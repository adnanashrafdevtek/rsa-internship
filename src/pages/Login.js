import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/home");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleResetPassword = () => {
    navigate("/reset-password");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-branding">
          <img 
            src="https://media.discordapp.net/attachments/1096192885394771968/1408272693492580424/raw.png?ex=68ab1de6&is=68a9cc66&hm=4aeb1037d87e34a95583cf33b3ab1c457ed98876da08e5bcc986df29c90ef529&=&format=webp&quality=lossless&width=1936&height=1290" 
            alt="Schedulo Logo" 
            className="login-logo"
          />
          <h1 className="login-brand-name">Schedulo</h1>
          <p className="login-tagline">Streamline Your School Scheduling</p>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-box">
          <button className="back-button" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to manage your school schedule</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>
          
          <p className="forgot-password" onClick={handleResetPassword}>
            Forgot your password?
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;