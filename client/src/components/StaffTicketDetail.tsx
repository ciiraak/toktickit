import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface CommentAuthor {
  id: number;
  name: string;
  role: string;
}

export interface TicketComment {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

export interface TicketNote {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

export interface StaffTicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  requester: { id: number; name: string; email: string };
  owner: { id: number; name: string } | null;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  attachments: {
    id: number;
    filename: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    deletedAt: string | null;
    deletionReason: string | null;
  }[];
  comments: TicketComment[];
  notes: TicketNote[];
}

export interface Assignee {
  id: number;
  name: string;
  email?: string;
  role: string;
}

interface Props {
  ticketId: number;
  onBack: () => void;
  currentUserId?: number;
}

const STATUS_OPTIONS = [
  "New",
  "Open",
  "In Progress",
  "Waiting for Requester",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
];

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

export default function StaffTicketDetail({ ticketId, onBack, currentUserId }: Props) {
  const [ticket, setTicket] = useState<StaffTicketDetailData | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operations editable state
  const [status, setStatus] = useState("");
  const [itPriority, setItPriority] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [savingOps, setSavingOps] = useState(false);
  const [opsSuccess, setOpsSuccess] = useState<string | null>(null);
  const [opsError, setOpsError] = useState<string | null>(null);

  // Comments state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [ticketRes, assigneesRes] = await Promise.all([
          fetch(`${API_URL}/api/staff/tickets/${ticketId}`, { credentials: "include" }),
          fetch(`${API_URL}/api/staff/assignees`, { credentials: "include" }),
        ]);

        if (!ticketRes.ok) {
          const body = await ticketRes.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed to load ticket (${ticketRes.status})`);
        }

        const ticketData: StaffTicketDetailData = await ticketRes.json();
        setTicket(ticketData);
        setStatus(ticketData.currentStatus);
        setItPriority(ticketData.itPriority ?? ticketData.requestedPriority);
        setOwnerId(ticketData.owner ? String(ticketData.owner.id) : "");

        if (assigneesRes.ok) {
          const assigneesData = await assigneesRes.json();
          setAssignees(assigneesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ticketId]);

  async function handleSaveOperations(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSavingOps(true);
    setOpsSuccess(null);
    setOpsError(null);

    const payload: { status?: string; itPriority?: string; ownerId?: number | null } = {};
    if (status) payload.status = status;
    if (itPriority) payload.itPriority = itPriority;
    payload.ownerId = ownerId ? parseInt(ownerId) : null;

    try {
      const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update ticket");
      }

      const updatedTicket = await res.json();
      setTicket((prev) => (prev ? { ...prev, ...updatedTicket } : prev));
      setOpsSuccess("Ticket updated successfully.");
      setTimeout(() => setOpsSuccess(null), 4000);
    } catch (err) {
      setOpsError(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setSavingOps(false);
    }
  }

  function handleClaimTicket() {
    if (currentUserId) {
      setOwnerId(String(currentUserId));
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;

    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/public-comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to post comment");
      }

      const createdComment: TicketComment = await res.json();
      setTicket((prev) =>
        prev ? { ...prev, comments: [...(prev.comments || []), createdComment] } : prev
      );
      setNewComment("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const content = newNote.trim();
    if (!content) return;

    setSubmittingNote(true);
    setNoteError(null);
    try {
      const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/internal-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add internal note");
      }

      const createdNote: TicketNote = await res.json();
      setTicket((prev) =>
        prev ? { ...prev, notes: [...(prev.notes || []), createdNote] } : prev
      );
      setNewNote("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to add internal note");
    } finally {
      setSubmittingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="zen-card text-center py-5" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <p className="text-muted">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card text-center py-5" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <div className="zen-banner-error mb-4" style={{ color: "#8B0000", marginBottom: "1rem" }}>
          {error ?? "Ticket not found"}
        </div>
        <button type="button" className="btn-zen-secondary" onClick={onBack}>
          ← Back to Queue
        </button>
      </div>
    );
  }

  const activeAttachments = (ticket.attachments || []).filter((a) => !a.deletedAt);

  return (
    <div className="staff-ticket-detail-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            className="btn-zen-secondary"
            onClick={onBack}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}
          >
            ← Back to Queue
          </button>
          <span style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--color-primary-green)" }}>
            {ticket.ticketNumber}
          </span>
          <span className="zen-badge" style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", fontWeight: 600, fontSize: "0.85rem", backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)" }}>
            {ticket.currentStatus}
          </span>
          <span className="zen-badge" style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", fontWeight: 600, fontSize: "0.85rem", backgroundColor: "#FEF3C7", color: "#92400E" }}>
            Priority: {ticket.itPriority ?? ticket.requestedPriority}
          </span>
        </div>
      </div>

      {/* Main Grid: Left content, Right operations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Read-Only Info, Comments, Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary & Description Card */}
          <div className="zen-card" style={{ backgroundColor: "#fff", border: "1px solid var(--color-border-neutral)", borderRadius: "8px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: 0, marginBottom: "0.75rem", color: "var(--color-text-primary)" }}>
              {ticket.summary}
            </h2>
            <div style={{ whiteSpace: "pre-wrap", color: "var(--color-text-primary)", fontSize: "0.95rem", lineHeight: 1.6, backgroundColor: "#F8FAF9", padding: "1rem", borderRadius: "6px", border: "1px solid #E2E8E5" }}>
              {ticket.description}
            </div>

            {/* Attachments */}
            {activeAttachments.length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>
                  Attachments ({activeAttachments.length})
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {activeAttachments.map((att) => (
                    <li key={att.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                      <span>📎</span>
                      <a
                        href={`${API_URL}/api/attachments/${att.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--color-primary-green)", textDecoration: "underline", fontWeight: 500 }}
                      >
                        {att.filename}
                      </a>
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                        ({(att.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Public Comments Section */}
          <div className="zen-card" style={{ backgroundColor: "#fff", border: "1px solid var(--color-border-neutral)", borderRadius: "8px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Public Comments</h3>
              <span style={{ fontSize: "0.8rem", backgroundColor: "#E0F2FE", color: "#0369A1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 500 }}>
                Visible to Requester
              </span>
            </div>

            {/* List */}
            {(!ticket.comments || ticket.comments.length === 0) ? (
              <p style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontSize: "0.9rem" }}>
                No public comments yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      backgroundColor: "#F9FAF9",
                      border: "1px solid #E5ECE8",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {comment.author?.name ?? "Unknown"}
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "normal" }}>
                          ({comment.author?.role ?? "USER"})
                        </span>
                      </span>
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{comment.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddComment}>
              {commentError && (
                <div style={{ color: "var(--color-error)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  {commentError}
                </div>
              )}
              <textarea
                aria-label="New public comment"
                placeholder="Write a public comment for the requester..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border-neutral)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  marginBottom: "0.5rem",
                }}
              />
              <button
                type="submit"
                className="btn-zen-secondary"
                disabled={submittingComment || !newComment.trim()}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              >
                {submittingComment ? "Posting..." : "Post Public Comment"}
              </button>
            </form>
          </div>

          {/* Internal Notes Section */}
          <div
            className="zen-card"
            style={{
              backgroundColor: "#FFFDF5",
              border: "1px solid #FDE68A",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, color: "#92400E" }}>
                🔒 Internal Notes
              </h3>
              <span style={{ fontSize: "0.8rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                IT Staff & Admin Only
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#B45309", marginTop: 0, marginBottom: "1rem" }}>
              These notes are strictly private and never visible to the requester.
            </p>

            {/* List */}
            {(!ticket.notes || ticket.notes.length === 0) ? (
              <p style={{ color: "#92400E", fontStyle: "italic", fontSize: "0.9rem" }}>
                No internal notes yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {ticket.notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      backgroundColor: "#FEF9C3",
                      border: "1px solid #FDE047",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600, color: "#78350F" }}>
                        {note.author?.name ?? "Staff"}
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#92400E", fontWeight: "normal" }}>
                          ({note.author?.role ?? "IT_STAFF"})
                        </span>
                      </span>
                      <span style={{ color: "#92400E", fontSize: "0.8rem" }}>
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#451A03" }}>{note.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddNote}>
              {noteError && (
                <div style={{ color: "var(--color-error)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  {noteError}
                </div>
              )}
              <textarea
                aria-label="New internal note"
                placeholder="Write a private internal note (visible only to IT staff)..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #FCD34D",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  marginBottom: "0.5rem",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <button
                type="submit"
                className="btn-zen-primary"
                disabled={submittingNote || !newNote.trim()}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", backgroundColor: "#B45309" }}
              >
                {submittingNote ? "Adding..." : "Add Internal Note"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Operations Sidebar & Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Operations Form */}
          <div className="zen-card" style={{ backgroundColor: "#fff", border: "1px solid var(--color-border-neutral)", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 0, marginBottom: "1rem" }}>
              Ticket Operations
            </h3>

            {opsSuccess && (
              <div style={{ backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 500 }}>
                ✓ {opsSuccess}
              </div>
            )}

            {opsError && (
              <div style={{ backgroundColor: "#FFEAEA", color: "#8B0000", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {opsError}
              </div>
            )}

            <form onSubmit={handleSaveOperations} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Status */}
              <div>
                <label htmlFor="staff-status-select" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  Status
                </label>
                <select
                  id="staff-status-select"
                  aria-label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", height: "38px", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid var(--color-border-neutral)", fontSize: "0.9rem" }}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* IT Priority */}
              <div>
                <label htmlFor="staff-priority-select" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  IT Priority
                </label>
                <select
                  id="staff-priority-select"
                  aria-label="IT Priority"
                  value={itPriority}
                  onChange={(e) => setItPriority(e.target.value)}
                  style={{ width: "100%", height: "38px", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid var(--color-border-neutral)", fontSize: "0.9rem" }}
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner / Assignee */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label htmlFor="staff-owner-select" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Assigned Owner
                  </label>
                  {currentUserId && ownerId !== String(currentUserId) && (
                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-primary-green)",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
                <select
                  id="staff-owner-select"
                  aria-label="Assigned Owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  style={{ width: "100%", height: "38px", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid var(--color-border-neutral)", fontSize: "0.9rem" }}
                >
                  <option value="">Unassigned</option>
                  {assignees.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn-zen-primary"
                disabled={savingOps}
                style={{ marginTop: "0.5rem", width: "100%" }}
              >
                {savingOps ? "Saving Changes..." : "Save Operations"}
              </button>
            </form>
          </div>

          {/* Ticket Metadata Card */}
          <div className="zen-card" style={{ backgroundColor: "#fff", border: "1px solid var(--color-border-neutral)", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>
              Ticket Metadata
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Requester</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {ticket.requester.name} ({ticket.requester.email})
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Category</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {ticket.category?.name ?? "General"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Related System</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {ticket.relatedSystem?.name ?? "None"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Requested Priority</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {ticket.requestedPriority}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Created Date</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block" }}>Last Updated</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
