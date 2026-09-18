import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminUserManagement from "../../src/components/AdminUserManagement";

const mockUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@kmutt.ac.th",
    role: "ADMINISTRATOR" as const,
    requiresPasswordChange: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "IT Staff One",
    email: "staff1@kmutt.ac.th",
    role: "IT_STAFF" as const,
    requiresPasswordChange: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    role: "REQUESTER" as const,
    requiresPasswordChange: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const mockPagination = {
  totalItems: 3,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
};

describe("AdminUserManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMockFetch(customUsers = mockUsers) {
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      const method = options?.method || "GET";

      if (url.includes("/api/admin/users") && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: customUsers, pagination: mockPagination }),
        });
      }

      if (url.includes("/api/admin/users") && method === "POST" && !url.includes("reset-password")) {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 4,
            name: body.name,
            email: body.email,
            role: body.role,
            requiresPasswordChange: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          }),
        });
      }

      if (url.includes("/api/admin/users/") && method === "PATCH") {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...customUsers[0],
            ...body,
          }),
        });
      }

      if (url.includes("/reset-password") && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: "Password reset successfully",
            id: 3,
            requiresPasswordChange: true,
          }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  }

  it("renders user directory with search bar, filters, and user rows", async () => {
    setupMockFetch();
    render(<AdminUserManagement currentUserId={1} />);

    expect(screen.getByText(/loading user directory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("IT Staff One")).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    });

    expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();
    expect(screen.getByTestId("status-filter-select")).toBeInTheDocument();
    expect(screen.getByTestId("create-user-button")).toBeInTheDocument();
  });

  it("opens create user modal and submits new user", async () => {
    setupMockFetch();
    render(<AdminUserManagement currentUserId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    // Click Create User
    fireEvent.click(screen.getByTestId("create-user-button"));

    expect(screen.getByText("Create New User")).toBeInTheDocument();
    expect(screen.getByTestId("create-name-input")).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByTestId("create-name-input"), { target: { value: "New User Name" } });
    fireEvent.change(screen.getByTestId("create-email-input"), { target: { value: "new.user@kmutt.ac.th" } });
    fireEvent.change(screen.getByTestId("create-role-select"), { target: { value: "IT_STAFF" } });
    fireEvent.change(screen.getByTestId("create-password-input"), { target: { value: "TempPassword123!" } });

    // Submit
    fireEvent.click(screen.getByTestId("submit-create-user"));

    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toHaveTextContent(/created successfully/i);
    });
  });

  it("opens edit modal and updates user details", async () => {
    setupMockFetch();
    render(<AdminUserManagement currentUserId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-btn-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-user-btn-2"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-name-input")).toHaveValue("IT Staff One");
    });

    fireEvent.change(screen.getByTestId("edit-name-input"), { target: { value: "IT Staff Lead" } });
    fireEvent.click(screen.getByTestId("submit-edit-user"));

    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toHaveTextContent(/updated successfully/i);
    });
  });

  it("opens reset password modal and resets user password", async () => {
    setupMockFetch();
    render(<AdminUserManagement currentUserId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId("reset-pwd-btn-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-pwd-btn-3"));

    await waitFor(() => {
      expect(screen.getByTestId("reset-password-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("reset-password-input"), { target: { value: "BrandNewPwd999!" } });
    fireEvent.click(screen.getByTestId("submit-reset-password"));

    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toHaveTextContent(/password reset for/i);
    });
  });

  it("disables deactivation button for the current logged-in administrator", async () => {
    setupMockFetch();
    render(<AdminUserManagement currentUserId={1} />);

    await waitFor(() => {
      const deactivateSelfBtn = screen.getByTestId("toggle-active-btn-1");
      expect(deactivateSelfBtn).toBeDisabled();
    });
  });
});
