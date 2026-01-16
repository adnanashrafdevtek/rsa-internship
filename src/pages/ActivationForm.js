import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ActivationForm.css";

export default function ActivationForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const API_BASE_URL = "http://3.143.57.120:4000";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validatePassword = (pwd) => {
    if (pwd.length < 6) return "Password must be at least 6 characters long.";
    if (!/\d/.test(pwd)) return "Password must include at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must include at least one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

if (!res.ok) {
  throw new Error(data.error || "Activation failed");
}

setMessage("✅ Your account has been activated! Redirecting...");

setTimeout(() => {
  if (data.role === "teacher") {
    window.location.href = `${API_BASE_URL}/availability?user_id=${data.user_id}`;
  } else {
    window.location.href = `${API_BASE_URL}`; // login page
  }
}, 2000);

    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  };

  return (
    <div className="activation-container">
      <div className="activation-box">
        <h2>Activate Your Plannify Account</h2>
        <p>Set your new password to secure your account and get started.</p>

        {message && <p className="message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label className="show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>
          <button type="submit">Activate Account</button>
        </form>
      </div>
    </div>
  );
}