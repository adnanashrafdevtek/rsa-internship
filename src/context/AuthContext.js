// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const defaultUsers = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    first_name: "Admin",
    last_name: "User",
    active: true,
  },
  {
    username: "teacher",
    password: "teacher123",
    role: "teacher",
    first_name: "Jane",
    last_name: "Doe",
    active: true,
  },
  {
    username: "Mr. Smith",
    password: "test123",
    role: "teacher",
    first_name: "John",
    last_name: "Smith",
    active: true,
  },
  {
    username: "student",
    password: "student123",
    role: "student",
    first_name: "Sally",
    last_name: "Student",
    active: true,
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [users, setUsers] = useState(() => {
    const storedUsers = localStorage.getItem("users");
    return storedUsers ? JSON.parse(storedUsers) : defaultUsers;
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const login = (username, password) => {
    const foundUser = users.find(
      (u) =>
        u.username === username &&
        u.password === password &&
        u.active === true
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const changeUserPassword = (username, newPassword) => {
    const updatedUsers = users.map((u) =>
      u.username === username ? { ...u, password: newPassword } : u
    );
    setUsers(updatedUsers);
  };

  const toggleUserActiveStatus = (username) => {
    const updatedUsers = users.map((u) =>
      u.username === username ? { ...u, active: !u.active } : u
    );
    setUsers(updatedUsers);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        users,
        changeUserPassword,
        toggleUserActiveStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
