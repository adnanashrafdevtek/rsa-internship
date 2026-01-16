import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const dummyUsers = [
  { email: "admin@example.com", password: "admin123", role: "admin", first_name: "Admin", last_name: "User", id: 0 },
  { email: "teacher@example.com", password: "teacher123", role: "teacher", first_name: "Teacher", last_name: "User", id: 1 },
  { email: "student@example.com", password: "student123", role: "student", first_name: "Student", last_name: "User", id: 2 },
  { email: "HARUN.person@example.com", password: "uuuuuuu", role: "student", first_name: "HARUN", last_name: "person", id: 5 },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Fetch all users (admin only, only once per login)
  const fetchAllUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setUsersError(err.message);
      // Do NOT clear users on error; keep last good list
    } finally {
      setUsersLoading(false);
    }
  };

  // Change user password (admin only)
  const changeUserPassword = async (username, newPassword) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${username}/password`, {
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

  // Toggle user active status (admin only)
  const toggleUserActiveStatus = async (username) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${username}/toggle-active`, {
        method: "PUT"
      });
      if (!res.ok) throw new Error("Failed to toggle user status");
      fetchAllUsers();
    } catch (err) {
      alert("Failed to toggle user status: " + err.message);
    }
  };

  const login = async (email, password) => {
    // First try dummy users
    const foundUser = dummyUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      return true;
    }

    // If not found, try backend login
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
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
  const hasFetchedUsers = React.useRef(false);
  React.useEffect(() => {
    if (user && user.role === "admin" && !hasFetchedUsers.current) {
      fetchAllUsers();
      hasFetchedUsers.current = true;
    }
    if (!user || user.role !== "admin") {
      hasFetchedUsers.current = false;
      setUsers([]);
    }
    // eslint-disable-next-line
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
