import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function TopBar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.topBar}>
      <div style={styles.rightSection}>
        <div style={styles.avatar} onClick={() => setDropdownOpen(!dropdownOpen)}>
          👤
        </div>
        {dropdownOpen && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownItem} onClick={() => navigate("/profile")}>
              My Profile
            </div>
            <div style={styles.dropdownItem} onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    height: "50px",
    backgroundColor: "#1e293b",
    color: "white",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0 20px",
    position: "relative",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  rightSection: {
    position: "relative",
    cursor: "pointer"
  },
  avatar: {
    fontSize: "20px",
    padding: "8px",
    borderRadius: "50%",
    backgroundColor: "#334155"
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    backgroundColor: "white",
    color: "black",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "5px",
    zIndex: 10
  },
  dropdownItem: {
    padding: "10px 15px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    backgroundColor: "white"
  }
};

export default TopBar;