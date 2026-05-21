import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await login({ email, password });
      loginUser(user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Login</h1>
      <p className="page-copy">Access your account and create or message sellers.</p>

      {error && <div className="alert error">{error}</div>}

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
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>
      <p style={{ marginTop: "16px" }}>
        Forgot your password? <Link to="/forgot-password" className="reset-link">Reset it here</Link>.
      </p>
    </section>
  );
};

export default Login;
