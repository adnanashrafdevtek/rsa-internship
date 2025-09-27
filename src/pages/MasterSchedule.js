import React from "react";
import Sidebar from "./Sidebar";

export default function MasterSchedule() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 250, overflowY: "auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "32px" }}>Master Schedule</h1>
        <div style={{ fontSize: 20, color: '#888', marginTop: 32 }}>
          Placeholder: Master Schedule page is working and Sidebar is visible.
        </div>
      </div>
    </div>
  );
}