import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActionsTakenSection from "../../src/components/ActionsTakenSection";

const mockActions = [
  {
    id: 1,
    ticketId: 10,
    actionDateTime: "2026-10-12T10:30:00.000Z",
    description: "Inspected core switch port and tested cable integrity.",
    result: "Moved patch cable from port 14 to port 15 due to CRC errors.",
    performedById: 2,
    performedBy: {
      id: 2,
      name: "Michael Chang",
      role: "IT_STAFF",
    },
    followUpRequired: true,
    followUpNote: "Monitor port 15 for 24 hours to ensure zero errors.",
    attachmentNotes: "fluke_test_report.pdf",
    createdAt: "2026-10-12T10:35:00.000Z",
    updatedAt: "2026-10-12T10:35:00.000Z",
  },
  {
    id: 2,
    ticketId: 10,
    actionDateTime: "2026-10-12T11:00:00.000Z",
    description: "Verified workstation network connectivity and DHCP lease.",
    result: "Workstation received valid IP and internet connectivity is restored.",
    performedById: 3,
    performedBy: {
      id: 3,
      name: "Sarah Admin",
      role: "ADMINISTRATOR",
    },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-10-12T11:05:00.000Z",
    updatedAt: "2026-10-12T11:05:00.000Z",
  },
];

describe("ActionsTakenSection Component (UI-03 / FR-01, FR-03, FR-04, FR-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-03a: renders empty message when ticket has zero actions taken", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("0");
    expect(screen.getByTestId("no-actions-message")).toHaveTextContent(
      "No actions recorded for this ticket yet."
    );
  });

  it("UI-03b: renders list of existing actions taken with details and badges", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActions),
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");
    });

    // Check first action
    expect(screen.getByTestId("action-card-1")).toBeInTheDocument();
    expect(screen.getByText(/Michael Chang/)).toBeInTheDocument();
    expect(screen.getByText(/Inspected core switch port/)).toBeInTheDocument();
    expect(screen.getByText(/Moved patch cable from port 14/)).toBeInTheDocument();
    expect(screen.getByTestId("followup-required-badge")).toBeInTheDocument();
    expect(screen.getByTestId("followup-note-content")).toHaveTextContent(
      "Monitor port 15 for 24 hours to ensure zero errors."
    );
    expect(screen.getByTestId("attachment-notes-content")).toHaveTextContent(
      "fluke_test_report.pdf"
    );

    // Check second action
    expect(screen.getByTestId("action-card-2")).toBeInTheDocument();
    expect(screen.getByText(/Sarah Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Verified workstation network connectivity/)).toBeInTheDocument();
    expect(screen.getByText("✓ No Follow-up")).toBeInTheDocument();
  });

  it("UI-03c: toggles create form when clicking '+ Add Action Taken'", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActions),
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-button")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("add-action-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("add-action-button"));
    expect(screen.getByTestId("add-action-form")).toBeInTheDocument();

    // Clicking cancel hides the form
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("add-action-form")).not.toBeInTheDocument();
  });

  it("UI-03d: validates that follow-up note is required when follow-up checkbox is checked", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-action-button"));

    // Fill description and result
    fireEvent.change(screen.getByLabelText("Action description"), {
      target: { value: "Replaced faulty power supply unit." },
    });
    fireEvent.change(screen.getByLabelText("Action result"), {
      target: { value: "Server powered on cleanly." },
    });

    // Check follow-up required checkbox
    const followUpCheckbox = screen.getByLabelText("Follow-up required");
    fireEvent.click(followUpCheckbox);
    expect(followUpCheckbox).toBeChecked();

    // Submit without follow-up note
    fireEvent.submit(screen.getByTestId("add-action-form"));

    expect(
      screen.getByText("Follow-up note is required when follow-up is needed.")
    ).toBeInTheDocument();
  });

  it("UI-03e: successfully creates a new action taken and adds it to the list", async () => {
    const newAction = {
      id: 3,
      ticketId: 10,
      actionDateTime: "2026-10-12T12:00:00.000Z",
      description: "Updated router firmware to patch CVE vulnerability.",
      result: "Firmware version 2.4.1 applied; routing stable.",
      performedById: 2,
      performedBy: { id: 2, name: "Michael Chang", role: "IT_STAFF" },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: "2026-10-12T12:05:00.000Z",
      updatedAt: "2026-10-12T12:05:00.000Z",
    };

    (globalThis as any).fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(newAction),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-action-button"));

    fireEvent.change(screen.getByLabelText("Action description"), {
      target: { value: "Updated router firmware to patch CVE vulnerability." },
    });
    fireEvent.change(screen.getByLabelText("Action result"), {
      target: { value: "Firmware version 2.4.1 applied; routing stable." },
    });

    fireEvent.click(screen.getByTestId("submit-action-button"));

    await waitFor(() => {
      expect(screen.getByTestId("action-card-3")).toBeInTheDocument();
    });

    expect(screen.getByText("Updated router firmware to patch CVE vulnerability.")).toBeInTheDocument();
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("1");
  });

  it("UI-03f: allows editing an existing action taken in-place", async () => {
    const updatedAction = {
      ...mockActions[0],
      description: "Inspected core switch port and replaced cable completely.",
      result: "New CAT6 cable installed; zero packet loss observed.",
    };

    (globalThis as any).fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedAction),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActions),
      });
    });

    render(<ActionsTakenSection ticketId={10} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-action-button-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-action-button-1"));
    expect(screen.getByTestId("edit-action-form-1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Edit description"), {
      target: { value: "Inspected core switch port and replaced cable completely." },
    });
    fireEvent.change(screen.getByLabelText("Edit result"), {
      target: { value: "New CAT6 cable installed; zero packet loss observed." },
    });

    fireEvent.click(screen.getByTestId("save-edit-action-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("edit-action-form-1")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText("Inspected core switch port and replaced cable completely.")
    ).toBeInTheDocument();
  });

  it("UI-03g: hides add and edit controls when readOnly=true (Requester View)", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActions),
    });

    render(<ActionsTakenSection ticketId={10} readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");
    });

    // Requesters can see actions
    expect(screen.getByTestId("action-card-1")).toBeInTheDocument();
    expect(screen.getByText(/Michael Chang/)).toBeInTheDocument();

    // Requesters DO NOT see Add Action Taken button or Edit button
    expect(screen.queryByTestId("add-action-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-button-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-button-2")).not.toBeInTheDocument();
  });
});
