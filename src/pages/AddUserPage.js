// src/pages/AddUserPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddUserPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    address: "",
    role: "student", // default role
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");
  setIsLoading(true);

  try {
    // make role lowercase before sending
    const payload = {
      ...formData,
      role: formData.role.toLowerCase(),
    };

    const res = await fetch("http://localhost:3000/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add user");
    }

    if (data.emailSent) {
      setMessage(`✅ User ${data.firstName} added! Activation email sent.`);
    } else {
      setMessage(`⚠️ User ${data.firstName} added, but email failed to send.`);
    }

    setTimeout(() => navigate("/student"), 2000); // redirect after success
  } catch (err) {
    setMessage(`❌ ${err.message}`);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add New User</h1>

      {message && <p>{message}</p>}
      {isLoading && <p>⏳ Processing...</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}
      >
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="emailAddress"
          placeholder="Email"
          value={formData.emailAddress}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? "#95a5a6" : "#16a085",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
}