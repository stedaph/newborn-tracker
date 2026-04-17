import React, { useState, useEffect } from "react";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState("feed");
  const [note, setNote] = useState("");

  const [parent, setParent] = useState("Stephane");
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState("formula");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("tracker");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tracker", JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    if (editingId) {
      const updated = entries.map(e =>
        e.id === editingId
          ? { ...e, type, note, parent, amount, side }
          : e
      );
      setEntries(updated);
      setEditingId(null);
    } else {
      const newEntry = {
        id: Date.now(),
        type,
        note,
        parent,
        amount,
        side,
        time: new Date().toLocaleString()
      };
      setEntries([newEntry, ...entries]);
    }

    setNote("");
    setAmount("");
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const editEntry = (entry) => {
    setType(entry.type);
    setNote(entry.note);
    setParent(entry.parent);
    setAmount(entry.amount || "");
    setSide(entry.side || "formula");
    setEditingId(entry.id);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(entries)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setEntries(JSON.parse(reader.result));
    };
    reader.readAsText(file);
  };

  // --- STATS ---
  const last24h = entries.filter(e => {
    const diff = Date.now() - new Date(e.time).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const feedCount = last24h.filter(e => e.type === "feed").length;
  const diaperCount = last24h.filter(e => e.type === "diaper").length;

  // --- LAST FEED + DUE LOGIC ---
  const lastFeed = entries.find(e => e.type === "feed");
  let hoursSinceFeed = null;
  if (lastFeed) {
    hoursSinceFeed = (Date.now() - new Date(lastFeed.time).getTime()) / 3600000;
  }

  const feedDue = hoursSinceFeed !== null && hoursSinceFeed >= 3; // 3h threshold

  return (
    <div style={{ padding: 20, fontFamily: "Arial", backgroundColor: "#eef2f7", minHeight: "100vh" }}>

      <h1 style={{ textAlign: "center" }}>🍼 Newborn Tracker</h1>

      {/* LAST FEED */}
      <div style={{
        background: feedDue ? "#ffe5e5" : "white",
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        textAlign: "center"
      }}>
        {lastFeed ? (
          <>
            Last feed: <strong>{lastFeed.time}</strong><br />
            {hoursSinceFeed.toFixed(1)} hours ago
            {feedDue && <div style={{ color: "red", marginTop: 5 }}>⚠️ Baby may be due for feeding</div>}
          </>
        ) : (
          "No feed logged yet"
        )}
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          🍼 Feeds (24h): <strong>{feedCount}</strong>
        </div>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          💩 Diapers (24h): <strong>{diaperCount}</strong>
        </div>
      </div>

      {/* INPUT */}
      <div style={{ background: "white", padding: 15, borderRadius: 12, marginBottom: 20 }}>

        <div style={{ marginBottom: 10 }}>
          <strong>Logged by:</strong>
          <button onClick={() => setParent("Stephane")} style={{ marginLeft: 10, background: parent === "Stephane" ? "#ddd" : "white" }}>Stephane</button>
          <button onClick={() => setParent("Monica")} style={{ marginLeft: 5, background: parent === "Monica" ? "#ddd" : "white" }}>Monica</button>
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
              <input placeholder="oz / ml" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 80 }} />
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="left">Left breast</option>
                <option value="right">Right breast</option>
                <option value="both">Both breasts</option>
                <option value="formula">Formula</option>
                
              </select>
            </>
          )}

          <input placeholder="Notes" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1 }} />

          <button onClick={addEntry} style={{ padding: "10px 16px", fontSize: 16 }}>
            {editingId ? "✏️ Update" : "➕ Add"}
          </button>
        </div>
      </div>

      {/* BIG QUICK BUTTONS (night mode friendly) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button style={bigBtn} onClick={() => setEntries([{ id: Date.now(), type: "feed", parent, side: "formula", note: "Quick feed", time: new Date().toLocaleString() }, ...entries])}>🍼 FEED</button>
          <button style={bigBtn} onClick={() => setEntries([{ id: Date.now(), type: "diaper", parent, note: "Wet diaper", time: new Date().toLocaleString() }, ...entries])}>💧 PEE</button>
          <button style={bigBtn} onClick={() => setEntries([{ id: Date.now(), type: "diaper", parent, note: "Dirty diaper", time: new Date().toLocaleString() }, ...entries])}>💩 POOP</button>
          <button style={bigBtn} onClick={() => setEntries([{ id: Date.now(), type: "sleep", parent, note: "Nap", time: new Date().toLocaleString() }, ...entries])}>😴 SLEEP</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={exportData}>⬇️ Export</button>
        <input type="file" onChange={importData} />
      </div>

      <h2>Entries</h2>
      {entries.length === 0 && <p>No entries yet</p>}

      {entries.map((e) => (
        <div key={e.id} style={{ background: "white", padding: 12, marginBottom: 10, borderRadius: 10 }}>
          <strong>{e.type}</strong> ({e.parent})
          <div style={{ fontSize: 12, color: "gray" }}>{e.time}</div>

          {e.type === "feed" && (
            <div>
              {e.amount && `${e.amount} oz/ml • `}
              {e.side === "left" && "Left breast"}
              {e.side === "right" && "Right breast"}
              {e.side === "both" && "Both breasts"}
              {e.side === "formula" && "Formula"}
              
            </div>
          )}

          <div>{e.note}</div>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => editEntry(e)} style={{ marginRight: 10 }}>✏️ Edit</button>
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
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
};
