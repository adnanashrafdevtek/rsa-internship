// src/pages/AddUserPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { apiUrl } from "../constants/apiConstants";
import { getToken } from "../lib/jwt";

export default function AddUserPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    address: "",
    role: "student", // default role
  });
  const API_BASE_URL = apiUrl;
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
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.emailAddress,
      address: formData.address,
      role: formData.role.toLowerCase(),
    };

    const token = getToken();
    console.log("Adding user with payload:", payload);
    console.log("Authorization token:", token ? "present" : "missing");

    const res = await fetch(`${API_BASE_URL}/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Backend response:", { status: res.status, data });

    if (!res.ok) {
      let errMsg = data.error || data.message || "Failed to add user";
      const lower = errMsg.toLowerCase();
      if (
        res.status === 409 ||
        lower.includes("duplicate") ||
        lower.includes("unique") ||
        lower.includes("already exists")
      ) {
        errMsg = "Email already exists";
      }
      throw new Error(errMsg);
    }

    if (data.emailSent) {
      setMessage(`User ${data.firstName} added! Activation email sent.`);
    } else {
      setMessage(`User ${data.firstName} added, but email failed to send.`);
    }

    const teacherId = data.user_id || data.id || data.teacher_id;
    if (payload.role === "teacher" && teacherId) {
      navigate(`/availability?user_id=${teacherId}`);
      return;
    }

  } catch (err) {
    setMessage(`Error: ${err.message}`);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SidebarLayout>
      <div style={{ padding: "20px" }}>
        <h1>Add New User</h1>

        {message && <p>{message}</p>}
        {isLoading && <p>Processing...</p>}

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
    </SidebarLayout>
  );
}