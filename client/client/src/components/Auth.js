
import React, { useState } from "react";

const API_URL = "http://localhost:5000/api/auth";

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isRegister
            ? { name, email, password }
            : { email, password }
        )
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isRegister) {
        setMessage("Registration successful! You can now log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        onLogin(data.user);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isRegister ? "Create Creator Account" : "Creator Login"}</h2>

        <p>
          {isRegister
            ? "Register to manage your content."
            : "Log in to access your creator dashboard."}
        </p>

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="8"
          required
        />

        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isRegister
            ? "Register"
            : "Login"}
        </button>

        <p className="auth-switch">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
          >
            {isRegister ? "Login here" : "Register here"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Auth;
