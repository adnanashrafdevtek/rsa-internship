import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveringSchedule, setHoveringSchedule] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [activationLink, setActivationLink] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    address: "",
    role: "student"
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:3000/api/user", formData);
      setActivationLink(res.data.activationLink || "");
      alert("User added successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        emailAddress: "",
        address: "",
        role: "student"
      });
    } catch (err) {
      console.error(err);
      alert("Error adding user.");
    }
  };

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
        Logged in as: <strong>{capitalizeFirst(user.username)}</strong>
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

        {(isAdmin || isTeacher) && (
          <Link to="/rosters" style={linkStyle}>Class Rosters</Link>
        )}

        {isAdmin && <Link to="/student" style={linkStyle}>Users</Link>}

        {/* Add User Button */}
        {isAdmin && (
          <button
            onClick={() => setShowAddUserForm(prev => !prev)}
            style={{
              ...linkStyle,
              textAlign: "left",
              backgroundColor: "#16a085"
            }}
          >
            {showAddUserForm ? "➖ Cancel Add User" : "➕ Add User"}
          </button>
        )}
      </nav>

      {/* Add User Form */}
      {showAddUserForm && (
        <form
          onSubmit={handleAddUserSubmit}
          style={{
            marginTop: "10px",
            backgroundColor: "#1c2833",
            padding: "10px",
            borderRadius: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            style={inputStyle}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            style={inputStyle}
          />
          <input
            name="emailAddress"
            placeholder="Email"
            value={formData.emailAddress}
            onChange={handleInputChange}
            style={inputStyle}
          />
          <input
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
            style={inputStyle}
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            style={inputStyle}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button type="submit" style={{ ...logoutStyle, backgroundColor: "#3498db" }}>
            Submit User
          </button>

          {activationLink && (
            <div style={{ fontSize: "12px", color: "#2ecc71" }}>
              Activation Link: <a href={activationLink} style={{ color: "#1abc9c" }}>{activationLink}</a>
            </div>
          )}
        </form>
      )}

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

const inputStyle = {
  padding: "6px",
  borderRadius: "4px",
  border: "none"
};

const logoutStyle = {
  padding: "10px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};