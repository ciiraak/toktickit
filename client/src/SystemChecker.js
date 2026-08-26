import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
export default function SystemChecker() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");
    async function handleCheck() {
        setState("loading");
        try {
            const result = await checkSystem();
            setCategories(result.categories);
            setState("success");
        }
        catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Unknown error");
            setState("error");
        }
    }
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("h1", { className: "h3 mb-4", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "loading" && _jsx("p", { className: "mt-3", children: "Checking system\u2026" }), state === "success" && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-success fw-bold", children: "Online" }), _jsx("ul", { children: categories.map((c) => (_jsx("li", { children: c.name }, c.id))) })] })), state === "error" && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-danger fw-bold", children: "Offline" }), _jsx("p", { className: "text-danger", children: errorMsg })] }))] }));
}
