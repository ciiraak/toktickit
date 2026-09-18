import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StaffTicketDetail from "../../src/components/StaffTicketDetail";

const mockTicket = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  summary: "VPN Connection drops frequently",
  description: "User cannot connect to internal resources through Cisco AnyConnect.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "Open",
  createdAt: "2026-09-17T08:00:00.000Z",
  updatedAt: "2026-09-17T09:00:00.000Z",
  requester: { id: 10, name: "Alice Requester", email: "alice@kmutt.ac.th" },
  owner: { id: 2, name: "Bob Staff" },
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 2, name: "VPN Gateway" },
  attachments: [
    {
      id: 101,
      filename: "vpn-log.txt",
      fileSize: 4096,
      mimeType: "text/plain",
      createdAt: "2026-09-17T08:05:00.000Z",
      deletedAt: null,
      deletionReason: null,
    },
  ],
  comments: [
    {
      id: 201,
      content: "Can you provide the gateway IP?",
      createdAt: "2026-09-17T08:15:00.000Z",
      author: { id: 2, name: "Bob Staff", role: "IT_STAFF" },
    },
  ],
  notes: [
    {
      id: 301,
      content: "Checked switch 4B, firmware needs update.",
      createdAt: "2026-09-17T08:20:00.000Z",
      author: { id: 2, name: "Bob Staff", role: "IT_STAFF" },
    },
  ],
};

const mockAssignees = [
  { id: 2, name: "Bob Staff", role: "IT_STAFF" },
  { id: 3, name: "Charlie Admin", role: "ADMINISTRATOR" },
];

describe("StaffTicketDetail Component", () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onBack.mockClear();
  });

  function setupFetch(customTicket = mockTicket, customAssignees = mockAssignees) {
    global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(customAssignees),
        });
      }
      if (url.includes("/api/staff/tickets/42/public-comments") && options?.method === "POST") {
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 999,
              content: body.content,
              createdAt: new Date().toISOString(),
              author: { id: 2, name: "Bob Staff", role: "IT_STAFF" },
            }),
        });
      }
      if (url.includes("/api/staff/tickets/42/internal-notes") && options?.method === "POST") {
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 888,
              content: body.content,
              createdAt: new Date().toISOString(),
              author: { id: 2, name: "Bob Staff", role: "IT_STAFF" },
            }),
        });
      }
      if (url.includes("/api/staff/tickets/42") && options?.method === "PATCH") {
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...customTicket,
              currentStatus: body.status ?? customTicket.currentStatus,
              itPriority: body.itPriority ?? customTicket.itPriority,
              ownerId: body.ownerId !== undefined ? body.ownerId : customTicket.owner?.id,
            }),
        });
      }
      if (url.includes("/api/staff/tickets/42")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(customTicket),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  }

  it("renders ticket details and metadata correctly", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000042")).toBeInTheDocument();
    });

    expect(screen.getByText("VPN Connection drops frequently")).toBeInTheDocument();
    expect(screen.getByText(/User cannot connect to internal resources/)).toBeInTheDocument();
    expect(screen.getByText("Alice Requester (alice@kmutt.ac.th)")).toBeInTheDocument();
    expect(screen.getByText("vpn-log.txt")).toBeInTheDocument();
  });

  it("displays public comments and internal notes with distinct sections", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByText("Public Comments")).toBeInTheDocument();
    });

    expect(screen.getByText("Can you provide the gateway IP?")).toBeInTheDocument();
    expect(screen.getByText("🔒 Internal Notes")).toBeInTheDocument();
    expect(screen.getByText("Checked switch 4B, firmware needs update.")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByText("← Back to Queue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("← Back to Queue"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("updates ticket operations via PATCH", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save Operations/i })).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status");
    fireEvent.change(statusSelect, { target: { value: "In Progress" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Operations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ticket updated successfully/i)).toBeInTheDocument();
    });
  });

  it("submits a new public comment", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Post Public Comment/i })).toBeInTheDocument();
    });

    const commentInput = screen.getByLabelText("New public comment");
    fireEvent.change(commentInput, { target: { value: "New public reply to user." } });

    fireEvent.click(screen.getByRole("button", { name: /Post Public Comment/i }));

    await waitFor(() => {
      expect(screen.getByText("New public reply to user.")).toBeInTheDocument();
    });
  });

  it("submits a new internal note", async () => {
    setupFetch();
    render(<StaffTicketDetail ticketId={42} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Internal Note/i })).toBeInTheDocument();
    });

    const noteInput = screen.getByLabelText("New internal note");
    fireEvent.change(noteInput, { target: { value: "Internal diagnosis: cable replaced." } });

    fireEvent.click(screen.getByRole("button", { name: /Add Internal Note/i }));

    await waitFor(() => {
      expect(screen.getByText("Internal diagnosis: cable replaced.")).toBeInTheDocument();
    });
  });

  it("shows error state when ticket fails to load", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Ticket not found" }),
    });

    render(<StaffTicketDetail ticketId={999} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText("Ticket not found")).toBeInTheDocument();
    });
  });
});
