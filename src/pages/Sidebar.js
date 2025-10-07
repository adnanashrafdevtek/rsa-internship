import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNavigate, Link } from "react-router-dom";

export default function Sidebar({ onWidthChange }) {
  const { user, logout } = useAuth();
  const { sidebarWidth, updateSidebarWidth, isCollapsed, toggleCollapse, getEffectiveWidth } = useSidebar();
  const navigate = useNavigate();
  const [hoveringSchedule, setHoveringSchedule] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  
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

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || isCollapsed) return;
      
      const newWidth = e.clientX;
      const minWidth = 150; // Allow smaller minimum for more flexibility
      const maxWidth = 600; // Keep increased maximum width
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        updateSidebarWidth(newWidth);
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging && !isCollapsed) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onWidthChange, isCollapsed, updateSidebarWidth]);

  const handleMouseDown = (e) => {
    if (isCollapsed) return;
    e.preventDefault();
    isResizing.current = true;
    setIsDragging(true);
  };

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

  const effectiveWidth = getEffectiveWidth();

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${effectiveWidth}px`,
        backgroundColor: "#2c3e50",
        color: "white",
        padding: isCollapsed ? "24px 8px" : "24px 20px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: "2px 0 16px 0 rgba(44,62,80,0.10)",
        overflowY: "auto",
        transition: isDragging ? 'none' : 'all 0.3s ease'
      }}
    >
      {/* Collapse/Expand Button */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: isCollapsed ? "center" : "space-between",
        marginBottom: "20px"
      }}>
        {!isCollapsed && (
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: "bold", 
            margin: 0,
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
        )}
        <button
          onClick={toggleCollapse}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            transition: "background-color 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "12px", 
        marginBottom: "20px"
      }}>
        <SidebarLink to="/home">Home</SidebarLink>
        <SidebarLink to="/class">Classes</SidebarLink>

        {isAdmin ? (
            <SidebarLink to="/schedules" iconOverride="📅">Schedule</SidebarLink>
        ) : (
          <>
            {isTeacher && (
              <SidebarLink to="/availability" iconOverride="⏰">Availability</SidebarLink>
            )}
            {isStudent && (
              <SidebarLink to="/student/schedule" iconOverride="📅">Schedule</SidebarLink>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <SidebarLink to="/student">Users</SidebarLink>
            <SidebarLink to="/add-user" style={{ backgroundColor: "#16a085" }} iconOverride="➕">
              Add User
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
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 10,
          padding: isCollapsed ? "12px 8px" : "12px"
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
        title={isCollapsed ? "Logout" : ""}
      >
        <span style={{fontSize: 18}}>🚪</span>
        {!isCollapsed && " Logout"}
      </button>
      
      {/* Resize handle - only visible when expanded */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            borderRight: '2px solid transparent',
            transition: 'border-color 0.2s ease',
            zIndex: 101
          }}
          onMouseEnter={(e) => {
            e.target.style.borderRightColor = '#3498db';
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.target.style.borderRightColor = 'transparent';
            }
          }}
        />
      )}
    </div>
  );
}

// SidebarLink component for hover effect
function SidebarLink({ to, children, submenu, style, iconOverride }) {
  const [hover, setHover] = useState(false);
  const { isCollapsed } = useSidebar();
  
  // Icon mapping based on route or label
  let icon = iconOverride || null;
  if (!iconOverride && !submenu) {
    if (to === "/home") icon = "🏠";
    else if (to === "/class") icon = "📚";
    else if (to === "/student") icon = "👥";
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
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? "12px 8px" : "12px 24px",
        ...style
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={isCollapsed ? children : ""}
    >
      {icon && <span style={{ marginRight: isCollapsed ? 0 : 10, fontSize: submenu ? 16 : 18 }}>{icon}</span>}
      {!isCollapsed && children}
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