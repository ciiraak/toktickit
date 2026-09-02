import React, { useState, useEffect, useRef } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  fetchTicketDetail,
  uploadAttachmentToTicket,
  getAttachmentDownloadUrl,
  softRemoveAttachment,
  TicketDetail,
  AttachmentDetail,
} from "../api";

interface Props {
  ticketId: number;
  onBack: () => void;
}

export default function RequesterTicketDetail({ ticketId, onBack }: Props) {
  const { requester } = useRequester();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // File Upload State
  const [uploading, setUploading] = useState(false);

  // Soft Removal Modal State
  const [removingAttachment, setRemovingAttachment] = useState<AttachmentDetail | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!requester) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTicketDetail(requester.id, ticketId);
        setTicket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket detail");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [requester, ticketId]);

  if (loading) {
    return (
      <div className="zen-card text-center py-5">
        <div className="spinner-border text-success mb-2" role="status"></div>
        <p className="text-muted small">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card text-center py-5">
        <div className="zen-banner-error mb-4">{error ?? "Ticket not found"}</div>
        <button type="button" className="btn-zen-secondary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((a) => !a.deletedAt);
  const activeCount = activeAttachments.length;
  const isMaxAttachmentsReached = activeCount >= 5;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !requester) return;

    if (isMaxAttachmentsReached) {
      setActionError("Ticket has already reached the maximum 5 active attachments limit.");
      return;
    }

    setUploading(true);
    setActionError(null);
    try {
      const newAttachment = await uploadAttachmentToTicket(requester.id, ticketId, file);
      setTicket((prev) => (prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleOpenRemoveModal(att: AttachmentDetail) {
    setRemovingAttachment(att);
    setDeletionReason("");
    setRemovalError(null);
  }

  async function handleConfirmRemove(e: React.FormEvent) {
    e.preventDefault();
    if (!removingAttachment || !requester) return;

    const trimmedReason = deletionReason.trim();
    if (trimmedReason.length < 5) {
      setRemovalError("Removal reason must be at least 5 characters.");
      return;
    }
    if (trimmedReason.length > 200) {
      setRemovalError("Removal reason must be at most 200 characters.");
      return;
    }

    setRemoving(true);
    setRemovalError(null);
    try {
      const result = await softRemoveAttachment(requester.id, removingAttachment.id, trimmedReason);
      setTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.map((a) =>
            a.id === removingAttachment.id
              ? { ...a, deletedAt: result.deletedAt, deletionReason: result.deletionReason }
              : a
          ),
        };
      });
      setRemovingAttachment(null);
    } catch (err) {
      setRemovalError(err instanceof Error ? err.message : "Failed to remove attachment");
    } finally {
      setRemoving(false);
    }
  }

  function renderPriorityBadge(p: string) {
    const uppercaseP = p.toUpperCase();
    let bg = "#F3F4F6";
    let color = "#4B5563";

    if (uppercaseP === "HIGH") {
      bg = "#FFEAEA";
      color = "#8B0000";
    } else if (uppercaseP === "MEDIUM") {
      bg = "#FEF3C7";
      color = "#92400E";
    } else if (uppercaseP === "LOW") {
      bg = "#F3F4F6";
      color = "#4B5563";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          borderRadius: "9999px",
          backgroundColor: bg,
          color,
        }}
      >
        {p}
      </span>
    );
  }

  function renderStatusBadge(s: string) {
    let bg = "#EAF6EF";
    let color = "#006B3C";

    if (s === "New") {
      bg = "#EAF6EF";
      color = "#006B3C";
    } else if (s === "Open") {
      bg = "#E0F2FE";
      color = "#0369A1";
    } else if (s === "Pending") {
      bg = "#FEF3C7";
      color = "#92400E";
    } else if (s === "Resolved") {
      bg = "#F3F4F6";
      color = "#4B5563";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          borderRadius: "9999px",
          backgroundColor: bg,
          color,
        }}
      >
        {s}
      </span>
    );
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Top Header & Breadcrumb */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          <span className="text-decoration-underline" style={{ cursor: "pointer" }} onClick={onBack}>
            My Tickets
          </span>{" "}
          &gt; <span className="fw-semibold text-dark">Ticket Details</span>
        </div>
        <button type="button" className="btn-zen-secondary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>

      {actionError && <div className="zen-banner-error mb-3">{actionError}</div>}

      {/* Main Ticket Read-Only Details Card */}
      <div className="zen-card mb-4">
        <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-3 mb-1">
              <h1 className="h4 fw-bold mb-0" style={{ fontFamily: "monospace", color: "var(--color-primary-green)" }}>
                {ticket.ticketNumber}
              </h1>
              {renderStatusBadge(ticket.currentStatus)}
              {renderPriorityBadge(ticket.requestedPriority)}
            </div>
            <p className="text-muted small mb-0">Created on {formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        {/* Form Metadata Grid (Read-only) */}
        <div className="row g-3 mb-4 p-3 rounded" style={{ backgroundColor: "#F0F4F2", border: "1px solid var(--color-border-neutral)" }}>
          <div className="col-md-4">
            <span className="text-muted small d-block">Requester</span>
            <span className="fw-semibold text-dark">{ticket.requester.name}</span>
          </div>
          <div className="col-md-4">
            <span className="text-muted small d-block">Category</span>
            <span className="fw-semibold text-dark">{ticket.category.name}</span>
          </div>
          <div className="col-md-4">
            <span className="text-muted small d-block">Related System</span>
            <span className="fw-semibold text-dark">{ticket.relatedSystem.name}</span>
          </div>
        </div>

        {/* Summary & Description */}
        <div className="mb-4">
          <h2 className="h6 text-muted fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
            Summary
          </h2>
          <div className="p-3 rounded border bg-white fw-medium text-dark mb-4">{ticket.summary}</div>

          <h2 className="h6 text-muted fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
            Description
          </h2>
          <div className="p-3 rounded border bg-white text-dark" style={{ whiteSpace: "pre-wrap", minHeight: 100 }}>
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Attachments Card */}
      <div className="zen-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h5 fw-bold mb-0" style={{ color: "var(--color-text-primary)" }}>
              Attachments ({activeCount}/5 active)
            </h2>
            <p className="text-muted small mb-0">Supporting evidence and documents for this ticket.</p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="d-none"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn-zen-primary"
              disabled={uploading || isMaxAttachmentsReached}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "+ Add Attachment"}
            </button>
          </div>
        </div>

        {/* Attachments List */}
        {ticket.attachments.length === 0 ? (
          <p className="text-muted small text-center py-4 mb-0 border rounded bg-light">
            No attachments uploaded for this ticket.
          </p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {ticket.attachments.map((att) => {
              const isDeleted = Boolean(att.deletedAt);

              return (
                <div
                  key={att.id}
                  className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-3 rounded border"
                  style={{
                    backgroundColor: isDeleted ? "#F9FAFA" : "#FFFFFF",
                    borderColor: isDeleted ? "#E5E7EB" : "var(--color-border-neutral)",
                  }}
                >
                  <div className="mb-2 mb-sm-0">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDeleted ? "#9CA3AF" : "var(--color-secondary-green)"} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span
                        className={`fw-semibold ${isDeleted ? "text-muted" : "text-dark"}`}
                        style={{ textDecoration: isDeleted ? "line-through" : "none" }}
                      >
                        {att.filename}
                      </span>
                      <span className="text-muted small">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                      {isDeleted && (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: "0.7rem" }}>
                          Removed
                        </span>
                      )}
                    </div>
                    {isDeleted && (
                      <p className="text-danger small mb-0 mt-1" style={{ fontSize: "0.8rem" }}>
                        Removed on {formatDate(att.deletedAt!)} — Reason: "{att.deletionReason}"
                      </p>
                    )}
                  </div>

                  <div className="d-flex gap-2 align-self-end align-self-sm-center">
                    {!isDeleted && (
                      <>
                        <a
                          href={getAttachmentDownloadUrl(att.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-zen-secondary btn-sm text-decoration-none"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={() => handleOpenRemoveModal(att)}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mock Collaboration / Historical Comments Section */}
      <div className="zen-card">
        <h2 className="h6 text-muted fw-semibold text-uppercase mb-3" style={{ letterSpacing: "0.5px" }}>
          Public Comments & Work Log (Read Only)
        </h2>
        <div className="p-3 rounded border bg-light text-muted small">
          <p className="mb-1">
            <strong>Jennifer Anderson (Requester):</strong> Thank you for taking a look at this issue.
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
            May 13, 2026 11:45 AM · Comments will be interactive in Lab 3.
          </p>
        </div>
      </div>

      {/* Soft Removal Reason Modal */}
      {removingAttachment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-2">
              <form onSubmit={handleConfirmRemove}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title h6 fw-bold" style={{ color: "var(--color-text-primary)" }}>
                    Remove Attachment
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setRemovingAttachment(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body py-3">
                  <p className="text-muted small mb-3">
                    You are removing <strong>{removingAttachment.filename}</strong>. The file metadata will remain
                    visible in the ticket history, but download access will be disabled.
                  </p>

                  {removalError && <div className="zen-banner-error mb-2">{removalError}</div>}

                  <label htmlFor="deletion-reason-input" className="form-label-custom">
                    Reason for removal <span className="required-asterisk">*</span>
                  </label>
                  <textarea
                    id="deletion-reason-input"
                    className="form-control-custom"
                    style={{ height: 90, resize: "vertical" }}
                    placeholder="Enter reason for removing this attachment (5–200 characters)..."
                    value={deletionReason}
                    maxLength={200}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    required
                  />
                  <div className="text-muted text-end small mt-1">{deletionReason.trim().length}/200</div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn-zen-secondary"
                    onClick={() => setRemovingAttachment(null)}
                    disabled={removing}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={removing}>
                    {removing ? "Removing..." : "Confirm Soft Removal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
