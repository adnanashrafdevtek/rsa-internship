
import React from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Users() {
  const { user, users, usersLoading, usersError } = useAuth();

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "40px", marginLeft: 300 }}>
        <h2>Unauthorized</h2>
        <p>You do not have access to view this page.</p>
      </div>
    );
  }

  // Always use a safe array
  const safeUsers = Array.isArray(users) ? users : [];

  let content = null;
  if (usersLoading) {
    content = <p>Loading users...</p>;
  } else if (usersError) {
    content = <p style={{ color: "red" }}>Error: {usersError}</p>;
  } else {
    content = (
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
          </tr>
        </thead>
        <tbody>
          {safeUsers.map((u) => (
            <tr key={u.id || u.email}>
              <td style={tdStyle}>{`${u.first_name} ${u.last_name}`}</td>
              <td style={tdStyle}>{u.username || u.email}</td>
              <td style={tdStyle}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ padding: "40px", flex: 1, marginLeft: 300 }}>
        <h1>All Users</h1>
        {content}
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
