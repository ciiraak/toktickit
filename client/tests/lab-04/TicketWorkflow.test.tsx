import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.tsx";

const baseMockTicket = {
  id: 55,
  ticketNumber: "TKT-2026-000055",
  summary: "Workflow state transitions verification",
  description: "Testing state transition options and concurrency guard.",
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  currentStatus: "New",
  createdAt: "2026-10-12T08:00:00.000Z",
  updatedAt: "2026-10-12T08:30:00.000Z",
  requester: { id: 10, name: "Alice Requester", email: "alice@kmutt.ac.th" },
  owner: null,
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 2, name: "VPN" },
  attachments: [],
  comments: [],
  notes: [],
};

const mockAssignees = [
  { id: 2, name: "Bob Staff", role: "IT_STAFF" },
  { id: 3, name: "Charlie Admin", role: "ADMINISTRATOR" },
];

describe("TicketWorkflow Component & Status Transitions (UI-04 / FR-06 / BR-06)", () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupFetch(customTicket = baseMockTicket) {
    (globalThis as any).fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAssignees),
        });
      }
      if (url.includes("/api/staff/tickets/") && (!options || options.method === "GET" || !options.method)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(customTicket),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  }

  it("UI-04: restricts status options for a 'New' ticket to permitted transitions (New, Open, Cancelled)", async () => {
    setupFetch({ ...baseMockTicket, currentStatus: "New" });

    render(<StaffTicketDetail ticketId={55} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain("New");
    expect(options).toContain("Open");
    expect(options).toContain("In Progress");
    expect(options).toContain("Cancelled");
    expect(options).not.toContain("Resolved");
    expect(options).not.toContain("Closed");
    expect(options).not.toContain("Reopened");
  });

  it("UI-04: restricts status options for an 'Open' ticket to permitted transitions", async () => {
    setupFetch({ ...baseMockTicket, currentStatus: "Open" });

    render(<StaffTicketDetail ticketId={55} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain("Open");
    expect(options).toContain("In Progress");
    expect(options).toContain("Waiting for Requester");
    expect(options).toContain("Resolved");
    expect(options).toContain("Cancelled");
    expect(options).not.toContain("New");
    expect(options).not.toContain("Closed");
    expect(options).not.toContain("Reopened");
  });

  it("UI-04: disables status dropdown when ticket is Cancelled (terminal status)", async () => {
    setupFetch({ ...baseMockTicket, currentStatus: "Cancelled" });

    render(<StaffTicketDetail ticketId={55} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(screen.getByText(/terminal state/i)).toBeInTheDocument();
  });

  it("sends clientUpdatedAt in PATCH payload to enable concurrency detection", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/staff/assignees")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockAssignees) });
      }
      if (options?.method === "PATCH") {
        const body = JSON.parse(options.body as string);
        expect(body).toHaveProperty("clientUpdatedAt", "2026-10-12T08:30:00.000Z");
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...baseMockTicket, currentStatus: "Open", updatedAt: "2026-10-12T09:00:00.000Z" }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(baseMockTicket) });
    });
    (globalThis as any).fetch = fetchMock;

    render(<StaffTicketDetail ticketId={55} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: "Open" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Operations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ticket updated successfully/i)).toBeInTheDocument();
    });
  });

  it("displays conflict error alert when server responds with 409 Conflict", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/staff/assignees")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockAssignees) });
      }
      if (options?.method === "PATCH") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "Conflict: This ticket has been updated by another user." }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(baseMockTicket) });
    });
    (globalThis as any).fetch = fetchMock;

    render(<StaffTicketDetail ticketId={55} onBack={onBack} currentUserId={2} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: "Open" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Operations/i }));

    await waitFor(() => {
      expect(screen.getByText(/Conflict: This ticket has been updated by another user/i)).toBeInTheDocument();
    });
  });
});
