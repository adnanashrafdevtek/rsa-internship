// src/context/AuthContext.js
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([
    { email: "admin@example.com", password: "admin123", role: "admin", first_name: "Admin", last_name: "User", id: 0, active: true },
    { email: "teacher@example.com", password: "teacher123", role: "teacher", first_name: "Teacher", last_name: "User", id: 1, active: true },
    { email: "student@example.com", password: "student123", role: "student", first_name: "Student", last_name: "User", id: 2, active: true },
    { email: "HARUN.person@example.com", password: "uuuuuuu", role: "student", first_name: "HARUN", last_name: "person", id: 5, active: true },
  ]);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email, password) => {
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      return true;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return true;
      } else {
        console.error("Login failed:", data.error);
        return false;
      }
    } catch (err) {
      console.error("Network error:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const changeUserPassword = (username, newPassword) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.email === username ? { ...u, password: newPassword } : u
      )
    );
  };

  const toggleUserActiveStatus = (username) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.email === username ? { ...u, active: !u.active } : u
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        changeUserPassword,
        toggleUserActiveStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);