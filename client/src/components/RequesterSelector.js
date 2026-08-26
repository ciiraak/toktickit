import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useRequester } from "../context/RequesterContext.js";
export default function RequesterSelector() {
    const { requesters, loading, error, setRequesterId, reloadRequesters } = useRequester();
    const [selectedId, setSelectedId] = useState("");
    function handleSubmit(e) {
        e.preventDefault();
        if (!selectedId)
            return;
        setRequesterId(parseInt(selectedId, 10));
    }
    if (loading) {
        return (_jsx("div", { className: "d-flex justify-content-center align-items-center", style: { minHeight: "70vh" }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "spinner-border text-success mb-3", role: "status" }), _jsx("p", { className: "text-muted", children: "Loading development requesters\u2026" })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "d-flex justify-content-center align-items-center", style: { minHeight: "70vh" }, children: _jsxs("div", { className: "zen-card text-center", style: { maxWidth: 450, width: "100%" }, children: [_jsxs("div", { className: "zen-banner-error mb-3", children: [_jsx("strong", { children: "Error:" }), " ", error] }), _jsx("button", { className: "btn-zen-primary", onClick: () => reloadRequesters(), children: "Retry" })] }) }));
    }
    return (_jsx("div", { className: "d-flex justify-content-center align-items-center px-3 py-5", style: { minHeight: "80vh" }, children: _jsxs("div", { className: "zen-card", style: { maxWidth: 520, width: "100%" }, children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("div", { className: "d-inline-flex align-items-center justify-content-center mb-3", style: {
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "var(--color-pale-green)",
                                color: "var(--color-primary-green)",
                            }, children: _jsxs("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }) }), _jsx("h2", { className: "h4 fw-bold mb-2", style: { color: "var(--color-text-primary)" }, children: "Select Development Requester" }), _jsx("p", { className: "text-muted small mb-0", children: "Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen." })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "requester-select", className: "form-label-custom", children: ["Development Requester ", _jsx("span", { className: "required-asterisk", children: "*" })] }), _jsxs("select", { id: "requester-select", className: "form-control-custom", value: selectedId, onChange: (e) => setSelectedId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "-- Choose a requester --" }), requesters.map((r) => (_jsxs("option", { value: r.id, children: [r.name, " (", r.email, ")"] }, r.id)))] })] }), _jsxs("div", { className: "zen-banner-info", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })] }), _jsx("span", { children: "Only active development requesters are shown." })] }), _jsx("div", { className: "p-3 mb-4 rounded", style: {
                                backgroundColor: "#fbfcfb",
                                border: "1px solid var(--color-border-neutral)",
                            }, children: _jsxs("div", { className: "d-flex gap-2 align-items-start", children: [_jsx("span", { style: { fontSize: "1.1rem" }, children: "\uD83D\uDEE1\uFE0F" }), _jsxs("div", { children: [_jsx("strong", { className: "d-block text-dark small", children: "Authentication coming in Lab 3" }), _jsx("span", { className: "text-muted small", style: { fontSize: "0.8rem" }, children: "In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account." })] })] }) }), _jsxs("div", { className: "d-flex justify-content-end gap-2", children: [_jsx("button", { type: "button", className: "btn-zen-secondary", onClick: () => setSelectedId(""), disabled: !selectedId, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn-zen-primary", disabled: !selectedId, children: "Continue \u2192" })] })] })] }) }));
}
