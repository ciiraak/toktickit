import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ChangePasswordScreen() {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current temporary password.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please verify current password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="zen-card p-4 p-md-5 shadow-sm" style={{ maxWidth: "480px", width: "100%" }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-warning-subtle text-warning p-3 rounded-circle mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="fs-4 fw-bold text-dark mb-1">Set New Password</h2>
          <p className="text-muted small mb-0">
            Welcome, <strong>{user?.name}</strong>! As this is your initial login or your password was reset, you must choose a new password before continuing.
          </p>
        </div>

        {error && (
          <div className="zen-banner-error mb-4" data-testid="change-password-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="change-password-form">
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary" htmlFor="current-password-input">
              Current / Temporary Password *
            </label>
            <input
              id="current-password-input"
              type="password"
              className="form-control"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              data-testid="current-password-input"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary" htmlFor="new-password-input">
              New Password *
            </label>
            <input
              id="new-password-input"
              type="password"
              className="form-control"
              placeholder="Choose a strong new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              data-testid="new-password-input"
            />
            <small className="text-muted">Minimum 6 characters.</small>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small text-secondary" htmlFor="confirm-password-input">
              Confirm New Password *
            </label>
            <input
              id="confirm-password-input"
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              data-testid="confirm-password-input"
            />
          </div>

          <div className="d-flex flex-column gap-2">
            <button
              type="submit"
              className="btn-zen-primary w-100 py-2 fw-semibold"
              disabled={submitting}
              data-testid="change-password-submit"
            >
              {submitting ? "Updating Password..." : "Update Password & Continue"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 py-2 small"
              onClick={logout}
              data-testid="cancel-logout-btn"
            >
              Sign Out Instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
