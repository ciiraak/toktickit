import React, { useState, useEffect, useRef } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  fetchCategories,
  fetchSystems,
  createTicket,
  Category,
  RelatedSystem,
  CreatedTicket,
} from "../api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

interface FormErrors {
  summary?: string;
  description?: string;
  categoryId?: string;
  relatedSystemId?: string;
  requestedPriority?: string;
  attachments?: string;
  general?: string;
}

interface Props {
  onSuccess?: (ticket: CreatedTicket) => void;
}

export default function CreateTicket({ onSuccess }: Props) {
  const { requester } = useRequester();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("MEDIUM");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(null);

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  useEffect(() => {
    async function load() {
      try {
        const [cats, syss] = await Promise.all([fetchCategories(), fetchSystems()]);
        setCategories(cats);
        setSystems(syss);
      } catch {
        setErrors((e) => ({ ...e, general: "Failed to load categories or systems." }));
      } finally {
        setLoadingOptions(false);
      }
    }
    load();
  }, []);

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" has an unsupported type. Allowed: JPG, PNG, WEBP, PDF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds 5 MB limit.`;
    }
    return null;
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    const allFiles = [...attachments, ...newFiles];

    if (allFiles.length > MAX_FILES) {
      setErrors((e) => ({ ...e, attachments: `Maximum ${MAX_FILES} attachments allowed.` }));
      return;
    }
    const fileError = newFiles.map(validateFile).find(Boolean);
    if (fileError) {
      setErrors((e) => ({ ...e, attachments: fileError }));
      return;
    }
    setErrors((e) => ({ ...e, attachments: undefined }));
    setAttachments(allFiles);
  }

  function removeFile(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setErrors((e) => ({ ...e, attachments: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!summary.trim()) errs.summary = "Summary is required.";
    else if (summary.trim().length < 10) errs.summary = "Summary must be at least 10 characters.";
    else if (summary.trim().length > 100) errs.summary = "Summary must be at most 100 characters.";

    if (!description.trim()) errs.description = "Description is required.";
    else if (description.trim().length < 20) errs.description = "Description must be at least 20 characters.";
    else if (description.trim().length > 1000) errs.description = "Description must be at most 1000 characters.";

    if (!categoryId) errs.categoryId = "Category is required.";
    if (!relatedSystemId) errs.relatedSystemId = "Related System is required.";

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!requester) return;

    setSubmitting(true);
    setErrors({});
    try {
      const ticket = await createTicket(requester.id, {
        summary: summary.trim(),
        description: description.trim(),
        categoryId: parseInt(categoryId),
        relatedSystemId: parseInt(relatedSystemId),
        requestedPriority,
        attachments,
      });
      setCreatedTicket(ticket);
      onSuccess?.(ticket);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Failed to submit ticket." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSummary(""); setDescription(""); setCategoryId("");
    setRelatedSystemId(""); setRequestedPriority("MEDIUM");
    setAttachments([]); setErrors({}); setCreatedTicket(null);
  }

  // ── Success Screen ──
  if (createdTicket) {
    return (
      <div className="zen-card text-center" style={{ maxWidth: 580, margin: "0 auto", padding: "2.5rem" }}>
        <div
          className="d-inline-flex align-items-center justify-content-center mb-3"
          style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Ticket Submitted!</h2>
        <p className="text-muted mb-1">Your ticket has been created successfully.</p>
        <div className="my-3 p-3 rounded" style={{ backgroundColor: "var(--color-pale-green)", border: "1px solid rgba(11,122,70,0.2)" }}>
          <span className="text-muted small">Ticket Number</span>
          <div className="fw-bold fs-5 mt-1" style={{ color: "var(--color-primary-green)", fontFamily: "monospace" }}>
            {createdTicket.ticketNumber}
          </div>
        </div>
        <div className="text-start mb-3" style={{ fontSize: "0.9rem" }}>
          <div className="d-flex justify-content-between py-1 border-bottom"><span className="text-muted">Status</span><span className="fw-semibold">{createdTicket.currentStatus}</span></div>
          <div className="d-flex justify-content-between py-1 border-bottom"><span className="text-muted">Priority</span><span className="fw-semibold">{createdTicket.requestedPriority}</span></div>
          <div className="d-flex justify-content-between py-1 border-bottom"><span className="text-muted">Category</span><span className="fw-semibold">{createdTicket.category.name}</span></div>
          <div className="d-flex justify-content-between py-1"><span className="text-muted">Attachments</span><span className="fw-semibold">{createdTicket.attachments.length}</span></div>
        </div>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn-zen-secondary" onClick={handleReset}>Create Another</button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="zen-card" style={{ maxWidth: 860, margin: "0 auto" }}>
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Create Ticket</h1>
          <p className="text-muted small mb-0">Submit a new IT support request.</p>
        </div>

        {errors.general && (
          <div className="zen-banner-error mb-3">{errors.general}</div>
        )}

        {/* Read-only system fields */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label className="form-label-custom">Ticket No.</label>
            <input className="form-control-custom" value="Auto-generated" readOnly style={{ backgroundColor: "#F0F4F2", cursor: "default" }} />
          </div>
          <div className="col-md-4">
            <label className="form-label-custom">Ticket Date</label>
            <input className="form-control-custom" value={today} readOnly style={{ backgroundColor: "#F0F4F2", cursor: "default" }} />
          </div>
          <div className="col-md-4">
            <label className="form-label-custom">Requester</label>
            <input className="form-control-custom" value={requester?.name ?? ""} readOnly style={{ backgroundColor: "#F0F4F2", cursor: "default" }} />
          </div>
        </div>

        {/* Classification */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label htmlFor="category-select" className="form-label-custom">
              Category <span className="required-asterisk">*</span>
            </label>
            <select
              id="category-select"
              className={`form-control-custom ${errors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setErrors((er) => ({ ...er, categoryId: undefined })); }}
              disabled={loadingOptions}
            >
              <option value="">-- Select category --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="form-feedback-error">{errors.categoryId}</p>}
          </div>

          <div className="col-md-4">
            <label htmlFor="system-select" className="form-label-custom">
              Related System <span className="required-asterisk">*</span>
            </label>
            <select
              id="system-select"
              className={`form-control-custom ${errors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => { setRelatedSystemId(e.target.value); setErrors((er) => ({ ...er, relatedSystemId: undefined })); }}
              disabled={loadingOptions}
            >
              <option value="">-- Select system --</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.relatedSystemId && <p className="form-feedback-error">{errors.relatedSystemId}</p>}
          </div>

          <div className="col-md-4">
            <label className="form-label-custom">
              Priority <span className="required-asterisk">*</span>
            </label>
            <div className="d-flex gap-2 mt-1">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRequestedPriority(p)}
                  style={{
                    flex: 1,
                    padding: "0.45rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    border: "1px solid",
                    borderRadius: 6,
                    cursor: "pointer",
                    borderColor: requestedPriority === p ? "var(--color-secondary-green)" : "var(--color-border-neutral)",
                    backgroundColor: requestedPriority === p ? "var(--color-pale-green)" : "#fff",
                    color: requestedPriority === p ? "var(--color-secondary-green)" : "var(--color-text-secondary)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <label htmlFor="summary-input" className="form-label-custom">
            Summary <span className="required-asterisk">*</span>
            <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.8rem" }}>{summary.trim().length}/100</span>
          </label>
          <input
            id="summary-input"
            className={`form-control-custom ${errors.summary ? "is-invalid" : ""}`}
            placeholder="Brief summary of the issue (10–100 characters)"
            value={summary}
            maxLength={100}
            onChange={(e) => { setSummary(e.target.value); setErrors((er) => ({ ...er, summary: undefined })); }}
          />
          {errors.summary && <p className="form-feedback-error">{errors.summary}</p>}
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="description-input" className="form-label-custom">
            Description <span className="required-asterisk">*</span>
            <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.8rem" }}>{description.trim().length}/1000</span>
          </label>
          <textarea
            id="description-input"
            className={`form-control-custom ${errors.description ? "is-invalid" : ""}`}
            style={{ height: 120, resize: "vertical" }}
            placeholder="Detailed description of the issue (20–1000 characters)"
            value={description}
            maxLength={1000}
            onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: undefined })); }}
          />
          {errors.description && <p className="form-feedback-error">{errors.description}</p>}
        </div>

        {/* Attachments */}
        <div className="mb-4">
          <label className="form-label-custom">
            Attachments
            <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.8rem" }}>
              ({attachments.length}/{MAX_FILES} — JPG, PNG, WEBP, PDF · max 5 MB each)
            </span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--color-border-neutral)",
              borderRadius: 8,
              padding: "1.25rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#fafcfb",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-secondary-green)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-neutral)")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" className="mb-2 d-block mx-auto">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="mb-0 text-muted small">Click to select files or drag and drop</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="d-none"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
          {errors.attachments && <p className="form-feedback-error mt-1">{errors.attachments}</p>}

          {/* Selected file pills */}
          {attachments.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="d-flex align-items-center gap-2 px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--color-pale-green)", fontSize: "0.825rem", border: "1px solid rgba(11,122,70,0.2)" }}
                >
                  <span>{file.name}</span>
                  <span className="text-muted">({(file.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                    style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", padding: "0 2px", fontWeight: 700 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn-zen-secondary" onClick={handleReset} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-zen-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting…
              </>
            ) : (
              "Submit Ticket"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
