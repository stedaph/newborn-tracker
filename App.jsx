import React, { useState, useEffect } from "react";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState("feed");
  const [note, setNote] = useState("");

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
      time: new Date().toLocaleString()
    };
    setEntries([newEntry, ...entries]);
    setNote("");
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Newborn Tracker</h1>

      <div style={{ marginBottom: 20 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="feed">Feed</option>
          <option value="diaper">Diaper</option>
          <option value="sleep">Sleep</option>
          <option value="medicine">Medicine</option>
        </select>

        <input
          placeholder="Notes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ marginLeft: 10 }}
        />

        <button onClick={addEntry} style={{ marginLeft: 10 }}>
          Add
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={exportData}>Export</button>
        <input type="file" onChange={importData} />
      </div>

      <h2>Entries</h2>
      {entries.map((e) => (
        <div key={e.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <strong>{e.type}</strong> - {e.time}
          <div>{e.note}</div>
        </div>
      ))}
    </div>
  );
}
