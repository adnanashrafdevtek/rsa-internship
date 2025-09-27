import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState(""); // now using email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password); // pass email instead of username
    if (success) {
      navigate("/home");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleResetPassword = () => {
    navigate("/reset-password");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto" }}>
      <h2>LOGIN</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />
        <button type="submit">Login</button>
        <button
          type="button"
          onClick={handleResetPassword}
          style={{ marginLeft: "10px" }}
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}

export default Login;