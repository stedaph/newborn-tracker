const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

// Exercise App's real calculation block without a DOM or new dependencies.
const source = readFileSync(require.resolve('../App.jsx'), 'utf8');
const start = source.indexOf('  const last24h =');
const end = source.indexOf('  const quickAdd =', start);
assert.ok(start >= 0 && end > start, 'App calculation block must exist');
const calculations = source.slice(start, end);
const NOW = Date.parse('2026-10-13T16:00:00Z');
const HOUR = 60 * 60 * 1000;
class FixedDate extends Date {
  static now() { return NOW; }
}
function entry(id, type, age, extra = {}) {
  return { id, type, time: new Date(NOW - age).toISOString(), ...extra };
}
function calculate(entries) {
  return vm.runInNewContext(`${calculations}\n({last24h, lastFeed, hoursSinceFeed, feedDue, feedCount, diaperCount, totalOz, totalMl});`, { entries, Date: FixedDate });
}

test('last feed and reminder use the latest timestamp regardless of order', () => {
  const old = entry(1, 'feed', 4 * HOUR);
  const recent = entry(2, 'feed', HOUR);
  for (const entries of [[old, recent], [recent, old]]) {
    const result = calculate(entries);
    assert.equal(result.lastFeed.id, 2);
    assert.equal(result.hoursSinceFeed, 1);
    assert.equal(result.feedDue, false);
  }
});

test('past-24-hour summaries exclude future entries without removing history', () => {
  const entries = [
    entry(1, 'feed', HOUR, { amount: '5', unit: 'oz' }),
    entry(2, 'feed', 2 * HOUR, { amount: '60', unit: 'ml' }),
    entry(3, 'diaper', HOUR),
    entry(4, 'feed', -HOUR, { amount: '99', unit: 'oz' }),
    entry(5, 'diaper', -48 * HOUR),
    entry(6, 'diaper', 30 * HOUR),
  ];
  const result = calculate(entries);
  assert.equal(result.feedCount, 2);
  assert.equal(result.diaperCount, 1);
  assert.equal(result.totalOz, 5);
  assert.equal(result.totalMl, 60);
  assert.equal(entries.length, 6);
  assert.equal(entries[5].id, 6);
});

test('24-hour window includes now and just-inside but excludes exact boundary and older', () => {
  const result = calculate([
    entry(1, 'diaper', 0),
    entry(2, 'diaper', 24 * HOUR - 1),
    entry(3, 'diaper', 24 * HOUR),
    entry(4, 'diaper', 24 * HOUR + 1),
    entry(5, 'diaper', -1),
  ]);
  assert.deepEqual(Array.from(result.last24h, e => e.id), [1, 2]);
  assert.equal(result.diaperCount, 2);
});

test('invalid and future feeds do not override the latest completed feed', () => {
  const result = calculate([
    { id: 1, type: 'feed', time: 'invalid synthetic timestamp' },
    entry(2, 'feed', -HOUR),
    entry(3, 'feed', 4 * HOUR),
    entry(4, 'diaper', HOUR),
  ]);
  assert.equal(result.lastFeed.id, 3);
  assert.equal(result.hoursSinceFeed, 4);
  assert.equal(result.feedDue, true);
  assert.equal(result.feedCount, 1);
});

test('empty or invalid/future-only feeding histories have no reminder', () => {
  for (const entries of [[], [entry(1, 'diaper', HOUR)], [
    { id: 2, type: 'feed', time: 'invalid' }, entry(3, 'feed', -HOUR),
  ]]) {
    const result = calculate(entries);
    assert.equal(result.lastFeed, null);
    assert.equal(result.hoursSinceFeed, null);
    assert.equal(result.feedDue, false);
  }
});

test('feed timestamped exactly now is a valid completed feeding', () => {
  const result = calculate([
    entry(1, 'feed', 4 * HOUR),
    entry(2, 'feed', 0, { amount: '4', unit: 'oz' }),
    entry(3, 'feed', -1),
  ]);
  assert.equal(result.lastFeed.id, 2);
  assert.equal(result.hoursSinceFeed, 0);
  assert.equal(result.feedDue, false);
  assert.equal(result.feedCount, 2);
  assert.equal(result.totalOz, 4);
});

test('reminder begins at exactly three hours', () => {
  assert.equal(calculate([entry(1, 'feed', 3 * HOUR - 1)]).feedDue, false);
  assert.equal(calculate([entry(1, 'feed', 3 * HOUR)]).feedDue, true);
});

test('historical feed still drives reminder even when outside summary window', () => {
  const result = calculate([entry(1, 'feed', 30 * HOUR)]);
  assert.equal(result.lastFeed.id, 1);
  assert.equal(result.feedDue, true);
  assert.equal(result.feedCount, 0);
});

test('selection does not reorder entries or mutate their fields', () => {
  const entries = Object.freeze([
    Object.freeze(entry(1, 'feed', 4 * HOUR)),
    Object.freeze(entry(2, 'feed', HOUR)),
  ]);
  const before = JSON.stringify(entries);
  assert.equal(calculate(entries).lastFeed.id, 2);
  assert.equal(JSON.stringify(entries), before);
});
