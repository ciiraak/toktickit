import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  fetchMyTickets,
  fetchCategories,
  Category,
  TicketListItem,
  PaginationMeta,
} from "../api";

interface Props {
  onCreateTicketClick?: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export default function MyTickets({ onCreateTicketClick, onSelectTicket }: Props) {
  const { requester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Categories for Filter Dropdown
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Fetch Tickets when requester, page, or filters change
  const loadTickets = useCallback(async () => {
    if (!requester) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchMyTickets(requester.id, {
        search: search.trim() || undefined,
        category: category || undefined,
        priority: priority || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setTickets(res.tickets);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [requester, search, category, priority, status, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const hasActiveFilters = Boolean(search.trim() || category || priority || status);

  function handleClearFilters() {
    setSearch("");
    setCategory("");
    setPriority("");
    setStatus("");
    setPage(1);
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
          padding: "0.2rem 0.6rem",
          fontSize: "0.75rem",
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
          padding: "0.2rem 0.6rem",
          fontSize: "0.75rem",
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
    <div className="zen-card">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            My Tickets
          </h1>
          <p className="text-muted small mb-0">View and track all of your support requests.</p>
        </div>
        <button
          type="button"
          className="btn-zen-primary align-self-start align-self-sm-auto"
          onClick={onCreateTicketClick}
        >
          + Create Ticket
        </button>
      </div>

      {error && <div className="zen-banner-error mb-3">{error}</div>}

      {/* Search & Filter Controls */}
      <div className="p-3 mb-4 rounded" style={{ backgroundColor: "#FAFBFB", border: "1px solid var(--color-border-neutral)" }}>
        <div className="row g-2">
          {/* Search bar */}
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <input
                id="ticket-search-input"
                type="text"
                className="form-control-custom ps-4"
                placeholder="Search by ticket number or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-text-secondary)"
                strokeWidth="2"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-2">
            <select
              aria-label="Filter by Category"
              className="form-control-custom"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-2">
            <select
              aria-label="Filter by Priority"
              className="form-control-custom"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              aria-label="Filter by Status"
              className="form-control-custom"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="col-6 col-md-2 d-flex">
            <button
              type="button"
              className="btn-zen-secondary w-100"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              style={{ fontSize: "0.85rem" }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success mb-2" role="status"></div>
          <p className="text-muted small">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        hasActiveFilters ? (
          <div className="text-center py-5">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.5"
              className="mb-3 d-block mx-auto"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 className="h6 fw-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              No matching tickets found
            </h3>
            <p className="text-muted small mb-3">Try adjusting or clearing your search and filter options.</p>
            <button type="button" className="btn-zen-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="text-center py-5" style={{ backgroundColor: "#FAFBFB", borderRadius: 8, border: "1px dashed var(--color-border-neutral)" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-secondary-green)"
              strokeWidth="1.5"
              className="mb-3 d-block mx-auto"
            >
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="11" y2="17"></line>
            </svg>
            <h3 className="h6 fw-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              No support tickets yet
            </h3>
            <p className="text-muted small mb-3">You haven't submitted any IT support tickets.</p>
            <button type="button" className="btn-zen-primary" onClick={onCreateTicketClick}>
              + Create Ticket
            </button>
          </div>
        )
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="d-none d-md-block table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border-neutral)", color: "var(--color-text-secondary)", fontSize: "0.825rem", textTransform: "uppercase" }}>
                  <th scope="col">Ticket No.</th>
                  <th scope="col">Created Date</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Category</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => onSelectTicket?.(t.id)}>
                    <td className="fw-bold" style={{ fontFamily: "monospace", color: "var(--color-secondary-green)" }}>
                      {t.ticketNumber}
                    </td>
                    <td className="text-muted small">{formatDate(t.createdAt)}</td>
                    <td className="fw-medium text-truncate" style={{ maxWidth: 280 }}>
                      {t.summary}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{t.category?.name}</span>
                    </td>
                    <td>{renderPriorityBadge(t.requestedPriority)}</td>
                    <td>{renderStatusBadge(t.currentStatus)}</td>
                    <td className="text-muted small">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="d-md-none d-flex flex-column gap-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded border"
                style={{ backgroundColor: "#FFFFFF", borderColor: "var(--color-border-neutral)", cursor: "pointer" }}
                onClick={() => onSelectTicket?.(t.id)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold small" style={{ fontFamily: "monospace", color: "var(--color-secondary-green)" }}>
                    {t.ticketNumber}
                  </span>
                  <div className="d-flex gap-1">
                    {renderPriorityBadge(t.requestedPriority)}
                    {renderStatusBadge(t.currentStatus)}
                  </div>
                </div>
                <h3 className="h6 fw-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  {t.summary}
                </h3>
                <div className="d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: "0.8rem" }}>
                  <span>{t.category?.name}</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
              <div className="text-muted small">
                Showing{" "}
                <strong>
                  {(pagination.currentPage - 1) * pagination.limit + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
                </strong>{" "}
                of <strong>{pagination.totalItems}</strong> tickets
              </div>
              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn-zen-secondary px-3 py-1"
                  style={{ fontSize: "0.85rem" }}
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    className={`btn px-3 py-1 ${pNum === pagination.currentPage ? "btn-success" : "btn-outline-secondary"}`}
                    style={{
                      fontSize: "0.85rem",
                      backgroundColor: pNum === pagination.currentPage ? "var(--color-primary-green)" : undefined,
                      borderColor: pNum === pagination.currentPage ? "var(--color-primary-green)" : undefined,
                    }}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-zen-secondary px-3 py-1"
                  style={{ fontSize: "0.85rem" }}
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
