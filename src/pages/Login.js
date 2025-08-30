import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css"; // keep your styled CSS

function Login() {
  const [email, setEmail] = useState(""); // using email now
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password); // pass email
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
    <div className="login-container">
      <div className="login-box">
        <div className="login-icon">
          <img src="https://media.discordapp.net/attachments/1096192885394771968/1408272693492580424/raw.png?ex=68ab1de6&is=68a9cc66&hm=4aeb1037d87e34a95583cf33b3ab1c457ed98876da08e5bcc986df29c90ef529&=&format=webp&quality=lossless&width=1936&height=1290" alt="School Scheduler" />
        </div>
        <h2>Welcome to Plannify</h2>
        <p>Manage your school schedule with ease.</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log In</button>
        </form>
        <p className="forgot-password" onClick={handleResetPassword}>
          Forgot your password?
        </p>
      </div>
    </div>
  );
}

export default Login;