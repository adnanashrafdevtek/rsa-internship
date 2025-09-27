// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

// Seed users used if nothing valid is in localStorage
const defaultUsers = [
  {
    id: 0,
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    first_name: "Admin",
    last_name: "User",
    active: true,
  },
  {
    id: 1,
    username: "teacher",
    email: "teacher@example.com",
    password: "teacher123",
    role: "teacher",
    first_name: "Jane",
    last_name: "Doe",
    active: true,
  },
  {
    id: 2,
    username: "student",
    email: "student@example.com",
    password: "student123",
    role: "student",
    first_name: "Sally",
    last_name: "Student",
    active: true,
  },
];

// Safely load and migrate stored users (adds active=true if missing, ensures ids, etc.)
function loadUsersFromStorage() {
  try {
    const raw = localStorage.getItem("users");
    if (!raw) return defaultUsers;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultUsers;

    return parsed.map((u, idx) => ({
      id: u.id ?? idx,
      username:
        u.username ??
        (u.email ? u.email.split("@")[0] : `user${idx}`),
      email: u.email ?? "",
      password: u.password ?? "",
      role: u.role ?? "student",
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      // IMPORTANT: treat missing `active` as true so old data doesn't block login
      active: u.active === undefined ? true : !!u.active,
    }));
  } catch {
    return defaultUsers;
  }
}

export const AuthProvider = ({ children }) => {
  // Current logged-in user
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // User directory (admin can manage)
  const [users, setUsers] = useState(loadUsersFromStorage);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // Login with username OR email, then fallback to backend
  const login = async (identifier, password) => {
    const idNorm = (identifier || "").trim().toLowerCase();

    // 1) Try local directory first
    const localMatch = users.find(
      (u) =>
        (u.username?.toLowerCase() === idNorm ||
          u.email?.toLowerCase() === idNorm) &&
        u.password === password
    );

    if (localMatch) {
      if (localMatch.active === false) {
        console.error("Account is deactivated");
        return false;
      }
      setUser(localMatch);
      localStorage.setItem("user", JSON.stringify(localMatch));
      return true;
    }

    // 2) Fallback to backend
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // backend expects email; pass identifier as email here
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return true;
      } else {
        console.error("Login failed:", data?.error || "Unknown error");
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

  // Admin helpers
  const changeUserPassword = (username, newPassword) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username ? { ...u, password: newPassword } : u
      )
    );
  };

  const toggleUserActiveStatus = (username) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username ? { ...u, active: !u.active } : u
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
