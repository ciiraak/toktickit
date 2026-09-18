import React, { useState, useEffect, useCallback } from "react";
import {
  AdminUser,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  UserRole,
  PaginationMeta,
} from "../api";

interface AdminUserManagementProps {
  currentUserId?: number;
}

export default function AdminUserManagement({ currentUserId }: AdminUserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER" as UserRole,
    initialPassword: "Password123!",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER" as UserRole,
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("Password123!");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter !== "" ? statusFilter === "active" : undefined,
        page,
        limit,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function showSuccess(msg: string) {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 5000);
  }

  // Handle Create User
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const created = await createAdminUser(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        role: "REQUESTER",
        initialPassword: "Password123!",
      });
      showSuccess(`User "${created.name}" created successfully.`);
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  }

  // Open Edit Modal
  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditError(null);
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const updated = await updateAdminUser(editingUser.id, editForm);
      setEditingUser(null);
      showSuccess(`User "${updated.name}" updated successfully.`);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  }

  // Open Reset Password Modal
  function openResetModal(user: AdminUser) {
    setResetUser(user);
    setResetPasswordVal("Password123!");
    setResetError(null);
  }

  // Handle Reset Password Submit
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);
    setResetLoading(true);

    try {
      await resetAdminUserPassword(resetUser.id, resetPasswordVal);
      setResetUser(null);
      showSuccess(`Password reset for "${resetUser.name}". User must change password on next login.`);
      loadUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  // Toggle user activation directly
  async function handleToggleActive(user: AdminUser) {
    setError(null);
    if (user.id === currentUserId && user.isActive) {
      setError("You cannot deactivate your own administrator account.");
      return;
    }

    try {
      const updated = await updateAdminUser(user.id, { isActive: !user.isActive });
      showSuccess(`User "${updated.name}" is now ${updated.isActive ? "Active" : "Inactive"}.`);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case "ADMINISTRATOR":
        return "zen-badge badge-priority-high";
      case "IT_STAFF":
        return "zen-badge badge-priority-medium";
      default:
        return "zen-badge zen-badge-secondary";
    }
  }

  return (
    <div className="admin-user-management">
      {/* Header & Title */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1 d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            User Management
          </h2>
          <p className="text-muted small mb-0">
            Create, search, manage user accounts, assign roles, and reset initial passwords.
          </p>
        </div>

        <button
          type="button"
          className="btn-zen-primary d-inline-flex align-items-center gap-2"
          onClick={() => setIsCreateOpen(true)}
          data-testid="create-user-button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create User
        </button>
      </div>

      {/* Success / Error Banners */}
      {successBanner && (
        <div className="zen-banner-info mb-3" data-testid="success-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{successBanner}</span>
        </div>
      )}

      {error && (
        <div className="zen-banner-error mb-3" data-testid="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="zen-card mb-4 p-3">
        <div className="row g-3">
          <div className="col-12 col-md-5">
            <label className="form-label small text-muted mb-1">Search Users</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="user-search-input"
              />
              <span className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" style={{ pointerEvents: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small text-muted mb-1">Filter by Role</label>
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              data-testid="role-filter-select"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small text-muted mb-1">Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="col-12 col-md-1 d-flex align-items-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setStatusFilter("");
                setPage(1);
              }}
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="zen-card p-0 overflow-hidden shadow-sm mb-4">
        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <p className="mb-0">No users found matching the selected criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 zen-table">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "25%" }}>User</th>
                  <th style={{ width: "15%" }}>Role</th>
                  <th style={{ width: "15%" }}>Status</th>
                  <th style={{ width: "15%" }}>Password Status</th>
                  <th style={{ width: "25%" }} className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td className="text-muted small">{u.id}</td>
                      <td>
                        <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                          {u.name}
                          {isSelf && (
                            <span className="badge bg-secondary-subtle text-secondary small ms-1" style={{ fontSize: "0.7rem" }}>
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-muted small">{u.email}</div>
                      </td>
                      <td>
                        <span className={getRoleBadgeClass(u.role)}>
                          {u.role === "IT_STAFF" ? "IT Staff" : u.role === "ADMINISTRATOR" ? "Administrator" : "Requester"}
                        </span>
                      </td>
                      <td>
                        <span className={`zen-badge ${u.isActive ? "badge-status-active" : "zen-badge-secondary"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {u.requiresPasswordChange ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis small d-inline-flex align-items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            Must Change
                          </span>
                        ) : (
                          <span className="text-muted small">Standard</span>
                        )}
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => openEditModal(u)}
                            data-testid={`edit-user-btn-${u.id}`}
                            title="Edit User"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => openResetModal(u)}
                            data-testid={`reset-pwd-btn-${u.id}`}
                            title="Reset Initial Password"
                          >
                            Reset Pwd
                          </button>
                          <button
                            type="button"
                            className={`btn ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf && u.isActive}
                            data-testid={`toggle-active-btn-${u.id}`}
                            title={isSelf && u.isActive ? "Cannot deactivate yourself" : u.isActive ? "Deactivate User" : "Activate User"}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
            <span className="small text-muted">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total users)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-modal shadow">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Create New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsCreateOpen(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {createError && (
                    <div className="zen-banner-error mb-3">{createError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Alex Johnson"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                      data-testid="create-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. alex.j@kmutt.ac.th"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                      data-testid="create-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">System Role *</label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                      data-testid="create-role-select"
                    >
                      <option value="REQUESTER">Requester (Standard User)</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Initial Temporary Password *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.initialPassword}
                      onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                      required
                      minLength={6}
                      data-testid="create-password-input"
                    />
                    <small className="text-muted d-block mt-1">
                      User will be required to change this password on their first login.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-zen-primary"
                    disabled={createLoading}
                    data-testid="submit-create-user"
                  >
                    {createLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-modal shadow">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit User: {editingUser.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingUser(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {editError && (
                    <div className="zen-banner-error mb-3">{editError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      data-testid="edit-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      data-testid="edit-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Role *</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                      data-testid="edit-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editIsActiveSwitch"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      disabled={editingUser.id === currentUserId && editForm.isActive}
                      data-testid="edit-active-switch"
                    />
                    <label className="form-check-label fw-semibold small" htmlFor="editIsActiveSwitch">
                      Active Account
                    </label>
                    {editingUser.id === currentUserId && (
                      <small className="text-muted d-block">You cannot deactivate your own admin account.</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-zen-primary"
                    disabled={editLoading}
                    data-testid="submit-edit-user"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-modal shadow">
              <form onSubmit={handleResetSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Reset Initial Password</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setResetUser(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {resetError && (
                    <div className="zen-banner-error mb-3">{resetError}</div>
                  )}

                  <p className="small text-muted mb-3">
                    Set a new initial password for <strong>{resetUser.name}</strong> ({resetUser.email}).
                    The user will be required to change this password immediately upon their next login.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">New Temporary Password *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      required
                      minLength={6}
                      data-testid="reset-password-input"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setResetUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={resetLoading}
                    data-testid="submit-reset-password"
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
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
