import React, { useState } from "react";
import "./Login.css"; // We'll create this CSS file

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Username:", username, "Password:", password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-icon">
          {/* Replace with actual icon or image */}
          <img src="/calendar-icon.png" alt="School Scheduler" />
        </div>
        <h2>Welcome to Plannify</h2>
        <p>Manage your school schedule with ease.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Log In</button>
        </form>
        <p className="forgot-password">Forgot your password?</p>
      </div>
    </div>
  );
}

export default Login;