// components/Users.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Users() {
  const { user, users, changeUserPassword, toggleUserActiveStatus } = useAuth();
  const [newPasswords, setNewPasswords] = useState({});
  const [message, setMessage] = useState("");

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "40px", marginLeft: 300 }}>
        <h2>Unauthorized</h2>
        <p>You do not have access to view this page.</p>
      </div>
    );
  }

  const handlePasswordChange = (username) => {
    const newPassword = newPasswords[username];
    if (!newPassword) return;

    changeUserPassword(username, newPassword);
    setMessage(`✅ Password updated for ${username}`);
    setNewPasswords((prev) => ({ ...prev, [username]: "" }));
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ padding: "40px", flex: 1, marginLeft: 300 }}>
        <h1>All Users</h1>
        {message && <p style={{ color: "green" }}>{message}</p>}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#eee" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>New Password</th>
              <th style={thStyle}></th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username}>
                <td style={tdStyle}>{`${u.first_name} ${u.last_name}`}</td>
                <td style={tdStyle}>{u.username}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={tdStyle}>
                  <span style={{ color: u.active ? "green" : "gray" }}>
                    {u.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <input
                    type="password"
                    value={newPasswords[u.username] || ""}
                    onChange={(e) =>
                      setNewPasswords((prev) => ({
                        ...prev,
                        [u.username]: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handlePasswordChange(u.username)}>
                    Change
                  </button>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => toggleUserActiveStatus(u.username)}>
                    {u.active ? "Inactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px",
  fontWeight: "bold",
  borderBottom: "1px solid #ccc",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee",
};
