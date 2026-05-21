import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState("");
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
      const result = await resetPassword({ resetToken, newPassword });
      setMessage(result.message || "Password reset successfully.");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Reset Password</h1>
      <p className="page-copy">Enter the reset token and choose a new password.</p>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Reset token"
          value={resetToken}
          onChange={(event) => setResetToken(event.target.value)}
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
        <button className="button" type="submit" disabled={submitting || !resetToken.trim() || !newPassword.trim()}>
          {submitting ? "Resetting password…" : "Reset Password"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>
        Need a new token? <Link to="/forgot-password">Request another reset token</Link>
      </p>
    </section>
  );
};

export default ResetPassword;
