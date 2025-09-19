import React from "react";
import "./Login.css";

function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Sign in to Smart Alert</h2>
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Sign in</button>
        </form>
        <div className="login-footer">Don't have an account? Contact admin.</div>
      </div>
    </div>
  );
}

export default Login;
