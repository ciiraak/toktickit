import React, { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  requestedPriority: string;
  itPriority: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category: { name: string };
  relatedSystem: { name: string };
  requester: { id: number; name: string; email: string };
  owner: { id: number; name: string } | null;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: number) => void;
}

const STATUSES = ["New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Cancelled"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function PriorityBadge({ priority }: { priority: string }) {
  const classMap: Record<string, string> = {
    HIGH: "badge-priority-high",
    MEDIUM: "badge-priority-medium",
    LOW: "badge-priority-low",
  };
  return <span className={`zen-badge ${classMap[priority] ?? "zen-badge-secondary"}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const isResolved = status === "Resolved" || status === "Closed";
  const isActive = status === "In Progress";
  const cls = isResolved ? "badge-status-resolved" : isActive ? "badge-status-active" : "badge-status-new";
  return <span className={`zen-badge ${cls}`}>{status}</span>;
}

export default function StaffTicketQueue({ onSelectTicket }: StaffTicketQueueProps) {
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", String(page));
      params.append("limit", "10");

      const res = await fetch(`${API_URL}/api/staff/tickets?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load ticket queue");
      }

      const data = await res.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message ?? "Failed to load ticket queue");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Reset page when filters change
  function applySearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const SortIcon = ({ field }: { field: string }) =>
    sortBy === field ? (
      <span style={{ fontSize: "0.7rem", marginLeft: "4px" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>
    ) : null;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h2 className="zen-heading mb-0">Ticket Queue</h2>
        <span className="text-muted small">{pagination?.totalItems ?? 0} total tickets</span>
      </div>

      {/* Filter Bar */}
      <div className="zen-card mb-3 p-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold mb-1">Search</label>
            <input
              id="staff-queue-search"
              type="text"
              className="zen-input"
              placeholder="Ticket # or summary…"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold mb-1">Status</label>
            <select
              id="staff-queue-status-filter"
              className="zen-input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Priority</label>
            <select
              id="staff-queue-priority-filter"
              className="zen-input"
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button
              type="button"
              className="zen-btn-secondary w-100"
              onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="zen-empty-state">
          <div className="zen-spinner" aria-label="Loading tickets" />
          <p className="text-muted mt-2">Loading ticket queue…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="zen-banner-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>{error}</span>
          <button type="button" className="zen-btn-secondary ms-auto" onClick={fetchQueue}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tickets.length === 0 && (
        <div className="zen-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
          <p className="text-muted mt-3">
            {search || statusFilter || priorityFilter ? "No tickets match your filters." : "No tickets in the queue yet."}
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="zen-card p-0 d-none d-md-block overflow-auto mb-3">
            <table className="zen-table w-100" id="staff-queue-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("ticketNumber")}>
                    Ticket # <SortIcon field="ticketNumber" />
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("createdAt")}>
                    Date <SortIcon field="createdAt" />
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Requester</th>
                  <th>Priority</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("currentStatus")}>
                    Status <SortIcon field="currentStatus" />
                  </th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="zen-table-row-hover"
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectTicket(t.id)}
                  >
                    <td className="fw-semibold text-nowrap">{t.ticketNumber}</td>
                    <td className="text-nowrap text-muted small">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ maxWidth: "260px" }}>
                      <span className="text-truncate d-block" title={t.summary}>{t.summary}</span>
                    </td>
                    <td className="small text-muted">{t.category.name}</td>
                    <td className="small">{t.requester.name}</td>
                    <td><PriorityBadge priority={t.requestedPriority} /></td>
                    <td><StatusBadge status={t.currentStatus} /></td>
                    <td className="small text-muted">{t.owner?.name ?? <span className="text-muted fst-italic">Unassigned</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="zen-card mb-2 p-3"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectTicket(t.id)}
              >
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className="fw-semibold small">{t.ticketNumber}</span>
                  <StatusBadge status={t.currentStatus} />
                </div>
                <p className="mb-1 small">{t.summary}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <PriorityBadge priority={t.requestedPriority} />
                  <span className="text-muted small">{t.category.name}</span>
                  <span className="text-muted small">{t.requester.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button
                type="button"
                className="zen-btn-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                id="staff-queue-prev-btn"
              >
                ← Previous
              </button>
              <span className="small text-muted">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="zen-btn-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                id="staff-queue-next-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
