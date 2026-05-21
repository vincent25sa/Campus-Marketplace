import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and conditions.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await register({ name, surname, email, password });
      loginUser({ id: result.userId, name: `${name} ${surname}`, email });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Create an account</h1>
      <p className="page-copy">Register to start listing items and messaging sellers.</p>

      {error && <div className="alert error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="First Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Last Name"
          value={surname}
          onChange={(event) => setSurname(event.target.value)}
          required
        />
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
        <input
          className="input"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
          />
          I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Registering…" : "Register"}
        </button>
      </form>
    </section>
  );
};

export default Register;
