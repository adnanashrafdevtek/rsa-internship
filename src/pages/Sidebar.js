import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveringSchedule, setHoveringSchedule] = useState(false);
  
  // CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";


  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#2c3e50",
        color: "white",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: "2px 0 16px 0 rgba(44,62,80,0.10)",
        overflowY: "auto"
      }}
    >
      <h2 style={{ 
        fontSize: "24px", 
        fontWeight: "bold", 
        marginBottom: "20px",
        position: "relative",
        paddingBottom: "10px",
        paddingLeft: "8px"
      }}>
        Navigation
        <div style={{ 
          position: "absolute", 
          bottom: 0, 
          left: "8px",
          width: "40px", 
          height: "3px", 
          backgroundColor: "#3498db",
          borderRadius: "2px"
        }}></div>
      </h2>

      <nav style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "12px", 
        marginBottom: "20px"
      }}>
        <SidebarLink to="/home">Home</SidebarLink>
        <SidebarLink to="/class">Classes</SidebarLink>

        {isAdmin ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveringSchedule(true)}
            onMouseLeave={() => setHoveringSchedule(false)}
          >
            <div 
              style={{
                ...hoverableLinkStyle, 
                backgroundColor: hoveringSchedule ? "#22313a" : "#34495e",
                justifyContent: "space-between",
                paddingLeft: "24px",
                paddingRight: "24px",
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span style={{fontSize: 18}}>📅</span>
              <span>Schedule</span>
              <span style={{ transition: "transform 0.3s", marginLeft: 'auto' }}>
                {hoveringSchedule ? "▴" : "▾"}
              </span>
            </div>
            {hoveringSchedule && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  backgroundColor: "#34495e",
                  borderRadius: "8px",
                  zIndex: 999,
                  minWidth: "180px",
                  boxShadow: "0 6px 16px 0 rgba(0,0,0,0.25)",
                  animation: "fadeIn 0.2s ease-in-out",
                  padding: "6px"
                }}
              >
                <SidebarLink to="/teacher/schedules" submenu iconOverride="👨‍🏫">Teachers</SidebarLink>
                <SidebarLink to="/student/schedules" submenu iconOverride="🧑‍🎓">Students</SidebarLink>
              </div>
            )}
          </div>
        ) : (
          <SidebarLink to={isTeacher ? "/teacher/schedule" : "/student/schedule"} iconOverride="📅">Schedule</SidebarLink>
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

      <button 
        onClick={handleLogout} 
        style={{
          ...logoutStyle,
          marginLeft: "4px",
          marginBottom: "20px",
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#c0392b";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#e74c3c";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span style={{fontSize: 18}}>🚪</span> Logout
      </button>
    </div>
  );
}

// SidebarLink component for hover effect
function SidebarLink({ to, children, submenu, style, iconOverride }) {
  const [hover, setHover] = useState(false);
  // Icon mapping based on route or label
  let icon = iconOverride || null;
  if (!iconOverride && !submenu) {
    if (to === "/home") icon = "🏠";
    else if (to === "/class") icon = "📚";
    else if (to === "/student") icon = "👥";
    // No icon for add-user or schedule submenu
  }
  return (
    <Link
      to={to}
      style={{
        ...linkStyle,
        ...(submenu ? submenuLinkStyle : {}),
        ...(hover
          ? {
              boxShadow: "0 4px 12px 0 rgba(25,118,210,0.2)",
              backgroundColor: submenu ? "#42516a" : "#22313a",
              color: "#fff",
              transform: "translateY(-2px)"
            }
          : {}),
        ...style
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {icon && <span style={{ marginRight: 10, fontSize: submenu ? 16 : 18 }}>{icon}</span>}
      {children}
    </Link>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "6px",
  backgroundColor: "#34495e",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontWeight: 500,
  display: "flex",
  alignItems: "center"
};

const hoverableLinkStyle = {
  ...linkStyle,
  transition: "all 0.2s ease",
  cursor: "pointer",
  position: "relative"
};

const submenuLinkStyle = {
  display: "block",
  padding: "10px 20px",
  fontSize: "14px",
  backgroundColor: "#3b4b5e",
  borderRadius: "4px",
  margin: "4px"
};

const logoutStyle = {
  padding: "12px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "all 0.2s ease",
  marginTop: "8px",
  width: "100%"
};
