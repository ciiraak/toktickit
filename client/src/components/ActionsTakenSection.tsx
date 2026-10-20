import React, { useState, useEffect } from "react";
import {
  ActionTaken,
  fetchActionsTaken,
  createStaffActionTaken,
  updateStaffActionTaken,
} from "../api";

interface Props {
  ticketId: number;
  readOnly?: boolean;
}

function formatLocalDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ActionsTakenSection({ ticketId, readOnly = false }: Props) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Mode state
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionDateTime, setActionDateTime] = useState(formatLocalDateTime());
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Mode state
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editFollowUpRequired, setEditFollowUpRequired] = useState(false);
  const [editFollowUpNote, setEditFollowUpNote] = useState("");
  const [editAttachmentNotes, setEditAttachmentNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActions() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchActionsTaken(ticketId);
        setActions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load actions taken");
      } finally {
        setLoading(false);
      }
    }
    loadActions();
  }, [ticketId]);

  function handleOpenAddForm() {
    setActionDateTime(formatLocalDateTime());
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setCreateError(null);
    setShowAddForm(true);
  }

  async function handleCreateAction(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const desc = description.trim();
    const res = result.trim();
    const note = followUpNote.trim();

    if (!desc) {
      setCreateError("Action description is required.");
      return;
    }
    if (!res) {
      setCreateError("Action result is required.");
      return;
    }
    if (followUpRequired && !note) {
      setCreateError("Follow-up note is required when follow-up is needed.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createStaffActionTaken(ticketId, {
        actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
        description: desc,
        result: res,
        followUpRequired,
        followUpNote: followUpRequired ? note : null,
        attachmentNotes: attachmentNotes.trim() || null,
      });

      setActions((prev) => [...prev, created]);
      setShowAddForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create action taken");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(action: ActionTaken) {
    setEditingActionId(action.id);
    setEditDescription(action.description);
    setEditResult(action.result);
    setEditFollowUpRequired(action.followUpRequired);
    setEditFollowUpNote(action.followUpNote ?? "");
    setEditAttachmentNotes(action.attachmentNotes ?? "");
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingActionId(null);
    setEditError(null);
  }

  async function handleSaveEdit(actionId: number, e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);

    const desc = editDescription.trim();
    const res = editResult.trim();
    const note = editFollowUpNote.trim();

    if (!desc) {
      setEditError("Action description is required.");
      return;
    }
    if (!res) {
      setEditError("Action result is required.");
      return;
    }
    if (editFollowUpRequired && !note) {
      setEditError("Follow-up note is required when follow-up is needed.");
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateStaffActionTaken(ticketId, actionId, {
        description: desc,
        result: res,
        followUpRequired: editFollowUpRequired,
        followUpNote: editFollowUpRequired ? note : null,
        attachmentNotes: editAttachmentNotes.trim() || null,
      });

      setActions((prev) =>
        prev.map((act) => (act.id === actionId ? updated : act))
      );
      setEditingActionId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update action taken");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      className="zen-card"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--color-border-neutral)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
      data-testid="actions-taken-section"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            📋 Actions Taken
          </h3>
          <span
            style={{
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-secondary-green)",
              padding: "0.2rem 0.55rem",
              borderRadius: "12px",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
            data-testid="actions-count-badge"
          >
            {actions.length}
          </span>
        </div>

        {!readOnly && !showAddForm && (
          <button
            type="button"
            className="btn-zen-primary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
            onClick={handleOpenAddForm}
            data-testid="add-action-button"
          >
            + Add Action Taken
          </button>
        )}
      </div>

      {loading && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Loading actions taken...
        </p>
      )}

      {error && (
        <div className="zen-banner-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Add Action Form */}
      {!readOnly && showAddForm && (
        <form
          onSubmit={handleCreateAction}
          data-testid="add-action-form"
          style={{
            backgroundColor: "#F8FAFC",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#1E3A8A",
            }}
          >
            Record Action Taken
          </h4>

          {createError && (
            <div className="zen-banner-error" style={{ marginBottom: "0.75rem" }}>
              {createError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {/* Action Date/Time */}
            <div>
              <label
                htmlFor="action-datetime-input"
                className="form-label-custom"
                style={{ fontSize: "0.85rem" }}
              >
                Action Date & Time
              </label>
              <input
                id="action-datetime-input"
                aria-label="Action date and time"
                type="datetime-local"
                value={actionDateTime}
                onChange={(e) => setActionDateTime(e.target.value)}
                className="form-control-custom"
                style={{ maxWidth: "260px" }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="action-description-input"
                className="form-label-custom"
                style={{ fontSize: "0.85rem" }}
              >
                Action Description <span className="required-asterisk">*</span>
              </label>
              <textarea
                id="action-description-input"
                aria-label="Action description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what technical steps or diagnostic tasks were performed..."
                rows={3}
                className="form-control-custom"
                style={{ height: "auto", resize: "vertical" }}
                required
              />
            </div>

            {/* Result */}
            <div>
              <label
                htmlFor="action-result-input"
                className="form-label-custom"
                style={{ fontSize: "0.85rem" }}
              >
                Action Result <span className="required-asterisk">*</span>
              </label>
              <textarea
                id="action-result-input"
                aria-label="Action result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="What was the outcome of this action? (e.g. resolved, tested, pending hardware)..."
                rows={2}
                className="form-control-custom"
                style={{ height: "auto", resize: "vertical" }}
                required
              />
            </div>

            {/* Follow-Up Required Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="action-followup-checkbox"
                aria-label="Follow-up required"
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label
                htmlFor="action-followup-checkbox"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: followUpRequired ? "var(--color-warning)" : "var(--color-text-primary)",
                }}
              >
                Follow-Up Required?
              </label>
            </div>

            {/* Conditional Follow-Up Note */}
            {followUpRequired && (
              <div
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: "6px",
                  padding: "0.75rem",
                }}
              >
                <label
                  htmlFor="action-followup-note-input"
                  className="form-label-custom"
                  style={{ fontSize: "0.85rem", color: "#92400E" }}
                >
                  Follow-Up Note <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="action-followup-note-input"
                  aria-label="Follow-up note"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Specify what follow-up action must be taken and by when..."
                  rows={2}
                  className="form-control-custom"
                  style={{ height: "auto", resize: "vertical" }}
                  required={followUpRequired}
                />
              </div>
            )}

            {/* Attachment Notes */}
            <div>
              <label
                htmlFor="action-attachments-input"
                className="form-label-custom"
                style={{ fontSize: "0.85rem" }}
              >
                Attachment Notes (Optional)
              </label>
              <input
                id="action-attachments-input"
                aria-label="Attachment notes"
                type="text"
                value={attachmentNotes}
                onChange={(e) => setAttachmentNotes(e.target.value)}
                placeholder="Mention relevant file names or screenshots (e.g. fluke_test_report.pdf)..."
                className="form-control-custom"
              />
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                className="btn-zen-secondary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-zen-primary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                disabled={submitting}
                data-testid="submit-action-button"
              >
                {submitting ? "Saving..." : "Save Action Taken"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Actions List */}
      {!loading && actions.length === 0 && (
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontStyle: "italic",
            fontSize: "0.9rem",
            margin: "0.5rem 0",
          }}
          data-testid="no-actions-message"
        >
          No actions recorded for this ticket yet.
        </p>
      )}

      {!loading && actions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {actions.map((action) => {
            const isEditing = editingActionId === action.id;

            if (isEditing) {
              return (
                <form
                  key={action.id}
                  onSubmit={(e) => handleSaveEdit(action.id, e)}
                  data-testid={`edit-action-form-${action.id}`}
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #93C5FD",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "0.75rem",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#1E3A8A",
                    }}
                  >
                    Edit Action Taken
                  </h4>

                  {editError && (
                    <div className="zen-banner-error" style={{ marginBottom: "0.5rem" }}>
                      {editError}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label
                        htmlFor={`edit-desc-${action.id}`}
                        className="form-label-custom"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Description <span className="required-asterisk">*</span>
                      </label>
                      <textarea
                        id={`edit-desc-${action.id}`}
                        aria-label="Edit description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="form-control-custom"
                        style={{ height: "auto", resize: "vertical" }}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-res-${action.id}`}
                        className="form-label-custom"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Result <span className="required-asterisk">*</span>
                      </label>
                      <textarea
                        id={`edit-res-${action.id}`}
                        aria-label="Edit result"
                        value={editResult}
                        onChange={(e) => setEditResult(e.target.value)}
                        rows={2}
                        className="form-control-custom"
                        style={{ height: "auto", resize: "vertical" }}
                        required
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        id={`edit-followup-${action.id}`}
                        aria-label="Edit follow-up required"
                        type="checkbox"
                        checked={editFollowUpRequired}
                        onChange={(e) => setEditFollowUpRequired(e.target.checked)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <label
                        htmlFor={`edit-followup-${action.id}`}
                        style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        Follow-Up Required?
                      </label>
                    </div>

                    {editFollowUpRequired && (
                      <div
                        style={{
                          backgroundColor: "#FFFBEB",
                          border: "1px solid #FCD34D",
                          borderRadius: "6px",
                          padding: "0.6rem",
                        }}
                      >
                        <label
                          htmlFor={`edit-note-${action.id}`}
                          className="form-label-custom"
                          style={{ fontSize: "0.8rem", color: "#92400E" }}
                        >
                          Follow-Up Note <span className="required-asterisk">*</span>
                        </label>
                        <textarea
                          id={`edit-note-${action.id}`}
                          aria-label="Edit follow-up note"
                          value={editFollowUpNote}
                          onChange={(e) => setEditFollowUpNote(e.target.value)}
                          rows={2}
                          className="form-control-custom"
                          style={{ height: "auto", resize: "vertical" }}
                          required={editFollowUpRequired}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor={`edit-attach-${action.id}`}
                        className="form-label-custom"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Attachment Notes
                      </label>
                      <input
                        id={`edit-attach-${action.id}`}
                        aria-label="Edit attachment notes"
                        type="text"
                        value={editAttachmentNotes}
                        onChange={(e) => setEditAttachmentNotes(e.target.value)}
                        className="form-control-custom"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-zen-secondary"
                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                        onClick={handleCancelEdit}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-zen-primary"
                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                        disabled={updating}
                        data-testid="save-edit-action-button"
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={action.id}
                data-testid={`action-card-${action.id}`}
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                {/* Top Row: Date, PerformedBy, Badges, and Edit Button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>
                      👤 {action.performedBy?.name ?? "IT Staff"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "#E2E8F0",
                        color: "#334155",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {action.performedBy?.role ?? "IT_STAFF"}
                    </span>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                      📅 {new Date(action.actionDateTime).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {action.followUpRequired ? (
                      <span
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FCD34D",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                        data-testid="followup-required-badge"
                      >
                        ⚠️ Follow-up Required
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#64748B",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        ✓ No Follow-up
                      </span>
                    )}

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(action)}
                        style={{
                          background: "transparent",
                          border: "1px solid #CBD5E1",
                          color: "#334155",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        data-testid={`edit-action-button-${action.id}`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Action Taken
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                    {action.description}
                  </div>
                </div>

                {/* Result */}
                <div style={{ marginBottom: action.followUpRequired || action.attachmentNotes ? "0.5rem" : 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Result
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                    {action.result}
                  </div>
                </div>

                {/* Follow-up Note Callout */}
                {action.followUpRequired && action.followUpNote && (
                  <div
                    style={{
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#92400E",
                    }}
                    data-testid="followup-note-content"
                  >
                    <strong>Follow-up Note:</strong> {action.followUpNote}
                  </div>
                )}

                {/* Attachment Notes */}
                {action.attachmentNotes && (
                  <div
                    style={{
                      backgroundColor: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      borderRadius: "6px",
                      padding: "0.4rem 0.65rem",
                      marginTop: "0.5rem",
                      fontSize: "0.825rem",
                      color: "#1E40AF",
                    }}
                    data-testid="attachment-notes-content"
                  >
                    📎 <strong>Attachment Notes:</strong> {action.attachmentNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
