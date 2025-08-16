import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/users")  // Adjust endpoint if needed
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "40px", marginLeft: 300 }}>
        <h2>Unauthorized</h2>
        <p>You do not have access to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ padding: "40px", flex: 1, marginLeft: 300 }}>
        <h1>All Users</h1>
        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : (
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
                <th style={thStyle}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>{`${u.first_name} ${u.last_name}`}</td>
                  <td style={tdStyle}>{u.role}</td>
                </tr>
              ))}
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
