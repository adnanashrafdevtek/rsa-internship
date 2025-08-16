import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Capitalize the first letter of the username
  const capitalizeFirst = (str) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 300 }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "10px" }}>
          Welcome, <span style={{ color: "#26bedd" }}>{capitalizeFirst(user?.username)}</span>
        </h1>

        {/* 🔁 Role-specific content */}
        {user?.role === "admin" && (
          <>
            <p style={{ fontSize: "18px", color: "#8e44ad", marginBottom: "20px" }}>
              You are logged in as an <strong>administrator</strong>.
            </p>
            <ul style={{ fontSize: "16px" }}>
              <li>✅ Manage all user accounts</li>
              <li>✅ View full class rosters</li>
              <li>✅ Access analytics and controls</li>
            </ul>
          </>
        )}

        {user?.role === "teacher" && (
          <>
            <p style={{ fontSize: "18px", color: "#2c3e50", marginBottom: "20px" }}>
              You are logged in as a <strong>teacher</strong>.
            </p>
            <ul style={{ fontSize: "16px" }}>
              <li>📚 View your class rosters</li>
              <li>🗓 Access your schedule</li>
              <li>📝 Submit attendance</li>
            </ul>
          </>
        )}

        {user?.role === "student" && (
          <>
            <p style={{ fontSize: "18px", color: "#2c3e50", marginBottom: "20px" }}>
              You are logged in as a <strong>student</strong>.
            </p>
            <ul style={{ fontSize: "16px" }}>
              <li>📅 View your class schedule</li>
              <li>📖 Access your subjects</li>
              <li>🔔 Get announcements</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
