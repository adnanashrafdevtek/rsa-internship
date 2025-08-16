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
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: "2px 0 16px 0 rgba(44,62,80,0.10)"
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Navigation
      </h2>

      <p style={{ marginBottom: "20px", fontSize: "16px", color: "#ecf0f1" }}>
        Logged in as: <strong>{capitalizeFirst(user.firstName)}</strong>
      </p>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SidebarLink to="/home">Home</SidebarLink>
        <SidebarLink to="/class">Classes</SidebarLink>

        {isAdmin ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveringSchedule(true)}
            onMouseLeave={() => setHoveringSchedule(false)}
          >
            <div style={hoverableLinkStyle}>Schedule ▾</div>
            {hoveringSchedule && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  backgroundColor: "#34495e",
                  borderRadius: "4px",
                  zIndex: 10,
                  minWidth: "140px",
                  boxShadow: "2px 2px 12px 0 rgba(44,62,80,0.13)"
                }}
              >
                <SidebarLink to="/teacher/schedules" submenu>Teachers</SidebarLink>
                <SidebarLink to="/student/schedules" submenu>Students</SidebarLink>
              </div>
            )}
          </div>
        ) : (
          <SidebarLink to="/schedule">Schedule</SidebarLink>
        )}

        {isAdmin && (
          <>
            <SidebarLink to="/student">Users</SidebarLink>
            <SidebarLink to="/add-user" style={{ backgroundColor: "#16a085" }}>
              ➕ Add User
            </SidebarLink>
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

// SidebarLink component for hover effect
function SidebarLink({ to, children, submenu, style }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      style={{
        ...linkStyle,
        ...(submenu ? submenuLinkStyle : {}),
        ...(hover
          ? {
              boxShadow: "0 2px 12px 0 rgba(25,118,210,0.13)",
              backgroundColor: submenu ? "#42516a" : "#22313a",
              color: "#fff"
            }
          : {}),
        ...style
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "4px",
  backgroundColor: "#34495e",
  cursor: "pointer",
  transition: "box-shadow 0.18s, background 0.18s"
};

const hoverableLinkStyle = {
  ...linkStyle,
  transition: "box-shadow 0.18s, background 0.18s",
  cursor: "pointer"
};

const submenuLinkStyle = {
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

// To prevent overlay, update your main layout/page container (not here in Sidebar.js) to add a left margin or padding:
// Example (in your main page components, e.g. App.js or main layout):
// <div style={{ marginLeft: 250 }}>...</div>
// This ensures your content is not hidden behind the fixed sidebar.