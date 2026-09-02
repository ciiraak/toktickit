import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import * as api from "../../src/api";
const mockRequesters = [
    { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
];
const mockCategories = [
    { id: 1, name: "Account and Access" },
    { id: 2, name: "Hardware" },
];
const mockSystems = [
    { id: 1, name: "Email" },
    { id: 7, name: "Corporate Laptop" },
];
const mockCreatedTicket = {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    currentStatus: "New",
    requestedPriority: "MEDIUM",
    summary: "My laptop battery drains too fast",
    description: "The battery drains from 100% to 0% within 2 hours of light usage.",
    createdAt: new Date().toISOString(),
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    attachments: [],
};
describe("Lab 2 - Create Ticket Form", () => {
    beforeEach(() => {
        localStorage.setItem("toktickit_requester_id", "1");
        vi.restoreAllMocks();
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchSystems").mockResolvedValue(mockSystems);
    });
    async function navigateToCreateTicket() {
        render(_jsx(App, {}));
        // Wait for the app shell to load and find the exact tab button
        const createTabBtn = await screen.findByRole("button", { name: /^Create Ticket$/i });
        await userEvent.click(createTabBtn);
    }
    it("shows Create Ticket form with read-only requester field", async () => {
        await navigateToCreateTicket();
        // Auto-generated ticket number placeholder
        expect(await screen.findByDisplayValue("Auto-generated")).toBeInTheDocument();
        // Requester name pre-filled
        expect(screen.getByDisplayValue("Jennifer Anderson")).toBeInTheDocument();
        // Submit button present
        expect(screen.getByRole("button", { name: /Submit Ticket/i })).toBeInTheDocument();
    });
    it("shows inline validation errors when submitting empty form", async () => {
        await navigateToCreateTicket();
        await screen.findByRole("button", { name: /Submit Ticket/i });
        await userEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));
        expect(await screen.findByText(/Summary is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
    });
    it("shows error when summary is too short", async () => {
        await navigateToCreateTicket();
        await userEvent.type(await screen.findByLabelText(/Summary/i), "Too short");
        await userEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));
        expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    });
    it("shows success screen with ticket number after valid submission", async () => {
        vi.spyOn(api, "createTicket").mockResolvedValue(mockCreatedTicket);
        await navigateToCreateTicket();
        await userEvent.type(await screen.findByLabelText(/Summary/i), "My laptop battery drains too fast");
        await userEvent.type(screen.getByLabelText(/Description/i), "The battery drains from 100% to 0% within 2 hours of light usage.");
        await userEvent.selectOptions(screen.getByRole("combobox", { name: /Category/i }), "2");
        await userEvent.selectOptions(screen.getByRole("combobox", { name: /Related System/i }), "7");
        await userEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));
        expect((await screen.findAllByText(/TKT-2026-000001/i)).length).toBeGreaterThan(0);
        expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
});
