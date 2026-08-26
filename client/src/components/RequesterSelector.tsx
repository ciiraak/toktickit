import React, { useState } from "react";
import { useRequester } from "../context/RequesterContext.js";

export default function RequesterSelector() {
  const { requesters, loading, error, setRequesterId, reloadRequesters } = useRequester();
  const [selectedId, setSelectedId] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setRequesterId(parseInt(selectedId, 10));
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <p className="text-muted">Loading development requesters…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="zen-card text-center" style={{ maxWidth: 450, width: "100%" }}>
          <div className="zen-banner-error mb-3">
            <strong>Error:</strong> {error}
          </div>
          <button className="btn-zen-primary" onClick={() => reloadRequesters()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center px-3 py-5" style={{ minHeight: "80vh" }}>
      <div className="zen-card" style={{ maxWidth: 520, width: "100%" }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary-green)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Select Development Requester
          </h2>
          <p className="text-muted small mb-0">
            Choose a development requester to simulate the current requester context for Lab 2.
            This is for testing only and is not a login screen.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="requester-select" className="form-label-custom">
              Development Requester <span className="required-asterisk">*</span>
            </label>
            <select
              id="requester-select"
              className="form-control-custom"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">-- Choose a requester --</option>
              {requesters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>

          <div className="zen-banner-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Only active development requesters are shown.</span>
          </div>

          <div
            className="p-3 mb-4 rounded"
            style={{
              backgroundColor: "#fbfcfb",
              border: "1px solid var(--color-border-neutral)",
            }}
          >
            <div className="d-flex gap-2 align-items-start">
              <span style={{ fontSize: "1.1rem" }}>🛡️</span>
              <div>
                <strong className="d-block text-dark small">Authentication coming in Lab 3</strong>
                <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                  In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn-zen-secondary"
              onClick={() => setSelectedId("")}
              disabled={!selectedId}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-zen-primary"
              disabled={!selectedId}
            >
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
