import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="zen-card p-4 p-md-5 shadow-sm" style={{ maxWidth: "440px", width: "100%" }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success p-3 rounded-circle mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h2 className="fs-3 fw-bold text-dark mb-1">TokTickIT</h2>
          <p className="text-muted small mb-0">Sign in to your account to continue</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="zen-banner-error mb-4" data-testid="login-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. user@kmutt.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              data-testid="login-email-input"
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small text-secondary" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="login-password-input"
            />
          </div>

          <button
            type="submit"
            className="btn-zen-primary w-100 py-2 fw-semibold"
            disabled={submitting}
            data-testid="login-submit-button"
          >
            {submitting ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <small className="text-muted">
            Internal IT Service Management System • KMUTT
          </small>
        </div>
      </div>
    </div>
  );
}
