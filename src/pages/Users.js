import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const {
    user,
    users: usersFromContext = [],
    changeUserPassword,
    toggleUserActiveStatus,
    usersLoading,
    usersError,
  } = useAuth();

  const [search, setSearch] = useState("");
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

  const handlePasswordChange = async (username) => {
    const newPassword = newPasswords[username];
    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }
    try {
      await changeUserPassword(username, newPassword);
      setMessage(`Password changed for ${username}`);
      setNewPasswords((prev) => ({ ...prev, [username]: "" }));
    } catch (err) {
      setMessage("Failed to change password.");
    }
  };

  // Filter users based on search
  const filteredUsers = Array.isArray(usersFromContext)
    ? usersFromContext.filter(
        (u) =>
          u.first_name.toLowerCase().includes(search.toLowerCase()) ||
          u.last_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "40px", marginLeft: 300 }}>
        <h1>All Users</h1>

        {message && <p style={{ color: "green" }}>{message}</p>}

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            marginBottom: 20,
            width: "100%",
            maxWidth: 400,
            fontSize: 14,
          }}
        />

        {usersLoading ? (
          <p>Loading users...</p>
        ) : usersError ? (
          <p style={{ color: "red" }}>Error: {usersError}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email / Username</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>New Password</th>
                <th style={thStyle}>Change Password</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.username || u.email}>
                    <td style={tdStyle}>{`${u.first_name} ${u.last_name}`}</td>
                    <td style={tdStyle}>{u.username || u.email}</td>
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
                      <button
                        onClick={() => toggleUserActiveStatus(u.username)}
                        style={{
                          padding: "4px 10px",
                          cursor: "pointer",
                          borderRadius: 4,
                          background: u.active ? "#f44336" : "#4caf50",
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        {u.active ? "Inactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: 20, color: "#888" }}
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
