import React, { useState, useEffect, useMemo } from "react";

export default function App() {
  const formatDisplayTime = (value) => {
    const d = new Date(value);
    if (isNaN(d)) return value;

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) return `Today • ${time}`;
    if (isYesterday) return `Yesterday • ${time}`;

    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    }) + ` • ${time}`;
  };
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState("feed");
  const [note, setNote] = useState("");

  const [loggedBy, setLoggedBy] = useState("Stephane");
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("oz");
  const [side, setSide] = useState("formula");

  const [editingId, setEditingId] = useState(null);
  const [customTime, setCustomTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tracker");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tracker", JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    const finalTime = customTime
      ? new Date(customTime).toLocaleString()
      : new Date().toLocaleString();

    if (editingId) {
      const updated = entries.map((e) =>
        e.id === editingId
          ? { ...e, type, note, loggedBy: loggedBy === "Other" ? customName : loggedBy, amount, side, unit, time: finalTime }
          : e
      );
      setEntries(updated);
      setEditingId(null);
    } else {
      const newEntry = {
        id: Date.now(),
        type,
        note,
        loggedBy: loggedBy === "Other" ? customName : loggedBy,
        amount,
        side,
        unit,
        time: finalTime,
      };
      setEntries([newEntry, ...entries]);
    }

    setNote("");
    setAmount("");
    setUnit("oz");
    setCustomTime("");
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const editEntry = (entry) => {
    setType(entry.type);
    setNote(entry.note);
    setLoggedBy(entry.loggedBy || "Stephane");
    setCustomName("");
    setAmount(entry.amount || "");
    setSide(entry.side || "formula");
    setUnit(entry.unit || "oz");
    setEditingId(entry.id);
    // pre-fill time (best effort for editing)
    const parsed = new Date(entry.time);
    if (!isNaN(parsed)) {
      const iso = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCustomTime(iso);
    } else {
      setCustomTime("");
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(entries)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEntries(JSON.parse(reader.result));
    };
    reader.readAsText(file);
  };

  const last24h = entries.filter((e) => {
    const diff = Date.now() - new Date(e.time).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const feedCount = last24h.filter((e) => e.type === "feed").length;
  const diaperCount = last24h.filter((e) => e.type === "diaper").length;

  const totalOz = last24h
    .filter((e) => e.type === "feed" && e.unit === "oz")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalMl = last24h
    .filter((e) => e.type === "feed" && e.unit === "ml")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const lastFeed = entries.find((e) => e.type === "feed");
  let hoursSinceFeed = null;
  if (lastFeed) {
    hoursSinceFeed = (Date.now() - new Date(lastFeed.time).getTime()) / 3600000;
  }

  const feedDue = hoursSinceFeed !== null && hoursSinceFeed >= 3;

  const quickAdd = (entry) => {
    const finalTime = customTime
      ? new Date(customTime).toLocaleString()
      : new Date().toLocaleString();

    setEntries([
      {
        id: Date.now(),
        loggedBy,
        unit: entry.unit || "oz",
        side: entry.side || "formula",
        ...entry,
        time: finalTime,
      },
      ...entries,
    ]);

    // clear time after quick add so it doesn't accidentally reuse
    setCustomTime("");
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((e) => {
      const haystack = `${e.type} ${e.note || ""} ${e.loggedBy || ""} ${e.side || ""} ${e.amount || ""} ${e.unit || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [entries, searchTerm]);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        backgroundColor: "#eef2f7",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center" }}>🍼 Newborn Tracker</h1>

      <div
        style={{
          background: feedDue ? "#ffe5e5" : "white",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
          textAlign: "center",
        }}
      >
        {lastFeed ? (
          <>
            Last feed: <strong>{formatDisplayTime(lastFeed.time)}</strong>
            <br />
            {hoursSinceFeed.toFixed(1)} hours ago
            {feedDue && (
              <div style={{ color: "red", marginTop: 5 }}>
                ⚠️ Baby may be due for feeding
              </div>
            )}
          </>
        ) : (
          "No feed logged yet"
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1, minWidth: 150 }}>
          🍼 Feeds (24h): <strong>{feedCount}</strong>
        </div>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1, minWidth: 150 }}>
          💩 Diapers (24h): <strong>{diaperCount}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1, minWidth: 150 }}>
          🍼 Total (oz): <strong>{totalOz}</strong>
        </div>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1, minWidth: 150 }}>
          🍼 Total (ml): <strong>{totalMl}</strong>
        </div>
      </div>

      <div style={{ background: "white", padding: 15, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Logged by:</strong>
          <select
            value={loggedBy}
            onChange={(e) => setLoggedBy(e.target.value)}
            style={{ marginLeft: 10, padding: 8 }}
          >
            <option value="Stephane">Stephane</option>
            <option value="Monica">Monica</option>
            <option value="Other">Other</option>
          </select>

          {loggedBy === "Other" && (
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter name"
              style={{ marginLeft: 10, padding: 8, minWidth: 140 }}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="feed">🍼 Feed</option>
            <option value="diaper">💩 Diaper</option>
            <option value="sleep">😴 Sleep</option>
            <option value="medicine">💊 Medicine</option>
          </select>

          {type === "feed" && (
            <>
              <input
                placeholder={unit}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: 80 }}
              />
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="oz">oz</option>
                <option value="ml">ml</option>
              </select>
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="left">Left breast</option>
                <option value="right">Right breast</option>
                <option value="both">Both breasts</option>
                <option value="formula">Formula</option>
              </select>
            </>
          )}

          <input
            type="datetime-local"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            style={{ padding: 8 }}
          />

          <input
            placeholder="Notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />

          <button onClick={addEntry} style={{ padding: "10px 16px", fontSize: 16 }}>
            {editingId ? "✏️ Update" : "➕ Add"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            style={bigBtn}
            onClick={() => quickAdd({ type: "feed", side: "formula", note: "Quick feed" })}
          >
            🍼 FEED
          </button>
          <button
            style={bigBtn}
            onClick={() => quickAdd({ type: "diaper", note: "Wet diaper" })}
          >
            💧 PEE
          </button>
          <button
            style={bigBtn}
            onClick={() => quickAdd({ type: "diaper", note: "Dirty diaper" })}
          >
            💩 POOP
          </button>
          <button
            style={bigBtn}
            onClick={() => quickAdd({ type: "sleep", note: "Nap" })}
          >
            😴 SLEEP
          </button>
        </div>
      </div>

      <div style={{ background: "white", padding: 15, borderRadius: 12, marginBottom: 20 }}>
        <strong>Search:</strong>
        <input
          type="text"
          placeholder="Search entries"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginLeft: 10, padding: 8, minWidth: 200 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={exportData}>⬇️ Export</button>
        <input type="file" onChange={importData} />
      </div>

      <h2>Entries</h2>
      {filteredEntries.length === 0 && <p>No entries found.</p>}

      {filteredEntries.map((e) => (
        <div key={e.id} style={{ background: "white", padding: 12, marginBottom: 10, borderRadius: 10 }}>
          <strong>{e.type}</strong>
          {e.loggedBy ? ` (${e.loggedBy})` : ""}
          <div style={{ fontSize: 12, color: "gray" }}>{formatDisplayTime(e.time)}</div>

          {e.type === "feed" && (
            <div>
              {e.amount && `${e.amount} ${e.unit || "oz"} • `}
              {e.side === "left" && "Left breast"}
              {e.side === "right" && "Right breast"}
              {e.side === "both" && "Both breasts"}
              {e.side === "formula" && "Formula"}
            </div>
          )}

          <div>{e.note}</div>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => editEntry(e)} style={{ marginRight: 10 }}>
              ✏️ Edit
            </button>
            <button onClick={() => deleteEntry(e.id)}>🗑 Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const bigBtn = {
  padding: "18px",
  fontSize: "18px",
  fontWeight: "bold",
  borderRadius: "12px",
  background: "white",
  border: "none",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};
