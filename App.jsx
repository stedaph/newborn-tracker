import React, { useState, useEffect } from "react";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState("feed");
  const [note, setNote] = useState("");

  const [parent, setParent] = useState("Stephane");
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState("left");

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
    setSide(entry.side || "left");
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

  const last24h = entries.filter(e => {
    const diff = Date.now() - new Date(e.time).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const feedCount = last24h.filter(e => e.type === "feed").length;
  const diaperCount = last24h.filter(e => e.type === "diaper").length;

  return (
    <div style={{ padding: 20, fontFamily: "Arial", backgroundColor: "#f5f7fb", minHeight: "100vh" }}>

      <h1 style={{ textAlign: "center" }}>🍼 Newborn Tracker</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          🍼 Feeds (24h): <strong>{feedCount}</strong>
        </div>
        <div style={{ background: "white", padding: 10, borderRadius: 10, flex: 1 }}>
          💩 Diapers (24h): <strong>{diaperCount}</strong>
        </div>
      </div>

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
              <input placeholder="oz" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 60 }} />
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </>
          )}

          <input placeholder="Notes" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1 }} />

          <button onClick={addEntry}>
            {editingId ? "✏️ Update" : "➕ Add"}
          </button>
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
            <div>{e.amount} oz • {e.side}</div>
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
