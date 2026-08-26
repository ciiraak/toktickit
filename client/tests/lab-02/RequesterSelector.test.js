import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("Lab 2 - Requester Selection and Context", () => {
    const mockRequesters = [
        { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
        { id: 2, name: "Michael Brown", email: "michael.brown@kmutt.ac.th" },
    ];
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("renders the Development Requester Selection screen when not selected", async () => {
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        render(_jsx(App, {}));
        expect(await screen.findByText(/Select Development Requester/i)).toBeInTheDocument();
        expect(screen.getByText(/Only active development requesters are shown/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Continue/i })).toBeDisabled();
    });
    it("populates active requesters in the dropdown", async () => {
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        render(_jsx(App, {}));
        expect(await screen.findByText(/Select Development Requester/i)).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Jennifer Anderson/i })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Michael Brown/i })).toBeInTheDocument();
    });
    it("selecting a requester and clicking Continue loads the app shell", async () => {
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        render(_jsx(App, {}));
        const select = await screen.findByLabelText(/Development Requester/i);
        await userEvent.selectOptions(select, "1");
        const continueBtn = screen.getByRole("button", { name: /Continue/i });
        expect(continueBtn).toBeEnabled();
        await userEvent.click(continueBtn);
        // Verify header and dashboard appear with selected requester
        const ticketsHeaders = await screen.findAllByText(/My Tickets/i);
        expect(ticketsHeaders.length).toBeGreaterThan(0);
        const userElements = await screen.findAllByText(/Jennifer Anderson/i);
        expect(userElements.length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /Change Requester/i })).toBeInTheDocument();
        expect(localStorage.getItem("toktickit_requester_id")).toBe("1");
    });
    it("clicking Change Requester returns to the selection screen", async () => {
        localStorage.setItem("toktickit_requester_id", "2");
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        render(_jsx(App, {}));
        // Starts directly in app shell for Michael Brown
        const userElements = await screen.findAllByText(/Michael Brown/i);
        expect(userElements.length).toBeGreaterThan(0);
        const changeBtn = screen.getByRole("button", { name: /Change Requester/i });
        await userEvent.click(changeBtn);
        // Returns to selector screen
        expect(await screen.findByText(/Select Development Requester/i)).toBeInTheDocument();
        expect(localStorage.getItem("toktickit_requester_id")).toBeNull();
    });
});
