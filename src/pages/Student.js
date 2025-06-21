import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

// Mock user data — replace with actual fetch/API later
const mockUsers = [
  { id: 1, firstName: "Jane", lastName: "Doe", email: "jane@example.com", role: "student", status: "active" },
  { id: 2, firstName: "John", lastName: "Smith", email: "john@example.com", role: "admin", status: "inactive" }
];

export default function Student() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Simulate data fetch
    setUsers(mockUsers);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ flex: 1, backgroundColor: "white", padding: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "20px" }}>
          Welcome, {user?.username}, to the students page.
        </h1>

        {user?.role === "admin" ? (
          <>
            <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>User List</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td>{u.firstName}</td>
                    <td>{u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>
                      <button onClick={() => setSelectedUser(u)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedUser && (
              <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "6px" }}>
                <h3>User Detail</h3>
                <p><strong>First Name:</strong> {selectedUser.firstName}</p>
                <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
                <button onClick={() => setSelectedUser(null)} style={{ marginTop: "10px" }}>Close</button>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: "18px", color: "#555" }}>
            {/* This is the main content area of the home page. Here you can place any
            introductory information or content you'd like your visitors to see first. */}
          </p>
        )}
      </div>
    </div>
  );
}