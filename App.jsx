import React, { useState, useEffect } from "react";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState("feed");
  const [note, setNote] = useState("");

  // NEW: parent + feed details
  const [parent, setParent] = useState("Stephane");
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState("left");

  useEffect(() => {
    const saved = localStorage.getItem("tracker");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tracker", JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
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
    setNote("");
    setAmount("");
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

  // SIMPLE STATS
  const last24h = entries.filter(e => {
    const diff = Date.now() - new Date(e.time).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const feedCount = last24h.filter(e => e.type === "feed").length;
  const diaperCount = last24h.filter(e => e.type === "diaper").length;

  return (
    <div style={{ 
      padding: 20, 
      fontFamily: "Arial", 
      backgroundColor: "#f5f7fb", 
      minHeight: "100vh" 
    }}>

      <h1 style={{ textAlign: "center" }}>🍼 Newborn Tracker</h1>

      {/* STATS DASHBOARD */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          🍼 Feeds (24h): <strong>{feedCount}</strong>
        </div>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          💩 Diapers (24h): <strong>{diaperCount}</strong>
        </div>
      </div>

      {/* INPUT CARD */}
      <div style={{
        background: "white",
        padding: 15,
        borderRadius: 12,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        marginBottom: 20
      }}>

        {/* Parent toggle */}
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

          {/* Feed-specific fields */}
          {type === "feed" && (
            <>
              <input
                placeholder="oz"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: 60 }}
              />

              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </>
          )}

          <input
            placeholder="Notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ flex: 1 }}
          />

          <button onClick={addEntry}>➕ Add</button>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button onClick={exportData}>⬇️ Export</button>
        <input type="file" onChange={importData} />
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginBottom: 20 }}>
        <h3>Quick Actions</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setEntries([{ id: Date.now(), type: "feed", parent, note: "Quick feed", time: new Date().toLocaleString() }, ...entries])}>🍼 Feed</button>
          <button onClick={() => setEntries([{ id: Date.now(), type: "diaper", parent, note: "Wet diaper", time: new Date().toLocaleString() }, ...entries])}>💧 Pee</button>
          <button onClick={() => setEntries([{ id: Date.now(), type: "diaper", parent, note: "Dirty diaper", time: new Date().toLocaleString() }, ...entries])}>💩 Poop</button>
          <button onClick={() => setEntries([{ id: Date.now(), type: "sleep", parent, note: "Nap", time: new Date().toLocaleString() }, ...entries])}>😴 Sleep</button>
        </div>
      </div>

      {/* ENTRIES */}
      <h2>Entries</h2>
      {entries.length === 0 && <p>No entries yet</p>}

      {entries.map((e) => (
        <div key={e.id} style={{
          background: "white",
          padding: 12,
          marginBottom: 10,
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
        }}>
          <strong>{e.type}</strong> {e.parent && `(${e.parent})`}
          <div style={{ fontSize: 12, color: "gray" }}>{e.time}</div>

          {e.type === "feed" && (
            <div style={{ fontSize: 13 }}>
              {e.amount && `${e.amount} oz`} {e.side && `• ${e.side}`}
            </div>
          )}

          <div>{e.note}</div>
        </div>
      ))}

    </div>
  );
}
