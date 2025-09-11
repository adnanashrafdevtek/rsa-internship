import React from "react";
import Sidebar from "./Sidebar";

export default function CreateSchedule() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 250, overflowY: "auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "32px" }}>Create Schedule</h1>
        {/* TODO: Add create schedule form here */}
      </div>
    </div>
  );
}
