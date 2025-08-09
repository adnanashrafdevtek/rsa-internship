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

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isTeacher = user.role === "teacher";

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

      <p style={{ marginBottom: "20px", fontSize: "16px", color: "#ecf0f1" }}>
        Logged in as: <strong>{capitalizeFirst(user.firstName)}</strong>
      </p>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link to="/home" style={linkStyle}>Home</Link>
        <Link to="/class" style={linkStyle}>Classes</Link>

        {isAdmin ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveringSchedule(true)}
            onMouseLeave={() => setHoveringSchedule(false)}
          >
            <div style={{ ...linkStyle, cursor: "pointer" }}>Schedule ▾</div>
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


        {isAdmin && (
          <>
            <Link to="/student" style={linkStyle}>Users</Link>
            <Link to="/add-user" style={{ ...linkStyle, backgroundColor: "#16a085" }}>
              ➕ Add User
            </Link>
          </>
        )}
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
  backgroundColor: "#34495e",
  cursor: "pointer"
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