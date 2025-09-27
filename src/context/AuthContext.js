import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();

const dummyUsers = [
  { email: "admin@example.com", password: "admin123", role: "admin", first_name: "Admin", last_name: "User", id: 0, active: true },
  { email: "teacher@example.com", password: "teacher123", role: "teacher", first_name: "Teacher", last_name: "User", id: 1, active: true },
  { email: "student@example.com", password: "student123", role: "student", first_name: "Student", last_name: "User", id: 2, active: true },
  { email: "HARUN.person@example.com", password: "uuuuuuu", role: "student", first_name: "HARUN", last_name: "person", id: 5, active: true },
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(dummyUsers);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Fetch all users (admin only)
  const fetchAllUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch("http://localhost:3000/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // Change user password
  const changeUserPassword = async (username, newPassword) => {
    try {
      const res = await fetch(`http://localhost:3000/api/users/${username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) throw new Error("Failed to change password");
      fetchAllUsers();
    } catch (err) {
      alert("Failed to change password: " + err.message);
    }
  };

  // Toggle user active status
  const toggleUserActiveStatus = async (username) => {
    try {
      const res = await fetch(`http://localhost:3000/api/users/${username}/toggle-active`, {
        method: "PUT"
      });
      if (!res.ok) throw new Error("Failed to toggle user status");
      fetchAllUsers();
    } catch (err) {
      alert("Failed to toggle user status: " + err.message);
    }
  };

  const login = async (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      return true;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Only fetch once per admin login
  const hasFetchedUsers = useRef(false);
  useEffect(() => {
    if (user && user.role === "admin" && !hasFetchedUsers.current) {
      fetchAllUsers();
      hasFetchedUsers.current = true;
    }
    if (!user || user.role !== "admin") {
      hasFetchedUsers.current = false;
      setUsers(dummyUsers); // fallback to local users
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      users,
      usersLoading,
      usersError,
      fetchAllUsers,
      changeUserPassword,
      toggleUserActiveStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

