import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage("");

    try {
      const result = await requestPasswordReset({ email, newPassword });
      setMessage(result.message || "If the email exists, the password has been reset.");
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Forgot Password</h1>
      <p className="page-copy">Enter your email and choose a new password.</p>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={6}
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={6}
        />
        <button className="button" type="submit" disabled={submitting || !email.trim() || !newPassword.trim() || !confirmPassword.trim()}>
          {submitting ? "Resetting password…" : "Reset Password"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>
        Remembered your password? <Link to="/login">Go back to login</Link>
      </p>
    </section>
  );
};

export default ForgotPassword;
