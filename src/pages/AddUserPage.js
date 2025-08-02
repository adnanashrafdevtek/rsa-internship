import React, { useState } from "react";

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    email: "",
    role: "student",
    firstName: "",
    lastName: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.trim() // avoid accidental spaces
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Sending user data:", formData); // debug log

    try {
      const res = await fetch("http://localhost:3000/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert("User added successfully!");
        setFormData({
          email: "",
          role: "student",
          firstName: "",
          lastName: ""
        }); // reset form
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error — check console for details");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Add New User</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", maxWidth: "400px" }}
      >
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>First Name</label>
        <input
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />

        <label>Last Name</label>
        <input
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" style={{ marginTop: "20px" }}>
          Add User
        </button>
      </form>
    </div>
  );
}