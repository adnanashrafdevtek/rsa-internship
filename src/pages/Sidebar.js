import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveringSchedule, setHoveringSchedule] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#2c3e50",
        color: "white",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative"
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Navigation
      </h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link to="/home" style={linkStyle}>Home</Link>
        <Link to="/class" style={linkStyle}>Classes</Link>

        {/* Schedule section */}
        {isAdmin ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveringSchedule(true)}
            onMouseLeave={() => setHoveringSchedule(false)}
          >
            <div style={{ ...linkStyle, cursor: "pointer" }}>
              Schedule ▾
            </div>
            {hoveringSchedule && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  backgroundColor: "#34495e",
                  borderRadius: "4px",
                  zIndex: 10,
                  minWidth: "140px"
                }}
              >
                <Link to="/teacher/schedules" style={submenuLinkStyle}>Teachers</Link>
                <Link to="/student/schedules" style={submenuLinkStyle}>Students</Link>
              </div>
            )}
          </div>
        ) : (
          <Link to="/schedule" style={linkStyle}>Schedule</Link>
        )}

        {/* Admin-only link */}
        {isAdmin && <Link to="/student" style={linkStyle}>Users</Link>}
      </nav>

      <div style={{ flexGrow: 1 }}></div>

      <button onClick={handleLogout} style={logoutStyle}>
        Logout
      </button>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "4px",
  backgroundColor: "#34495e"
};

const submenuLinkStyle = {
  ...linkStyle,
  display: "block",
  padding: "8px 12px",
  fontSize: "14px",
  backgroundColor: "#3b4b5e"
};

const logoutStyle = {
  padding: "10px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};