import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { fetchRequesters } from "../api.js";
const STORAGE_KEY = "toktickit_requester_id";
const RequesterContext = createContext(undefined);
export function RequesterProvider({ children }) {
    const [requesters, setRequesters] = useState([]);
    const [requester, setRequester] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const list = await fetchRequesters();
            setRequesters(list);
            const savedId = localStorage.getItem(STORAGE_KEY);
            if (savedId) {
                const found = list.find((r) => r.id === parseInt(savedId, 10));
                if (found) {
                    setRequester(found);
                }
                else {
                    localStorage.removeItem(STORAGE_KEY);
                    setRequester(null);
                }
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load requesters");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, []);
    function setRequesterId(id) {
        const found = requesters.find((r) => r.id === id);
        if (found) {
            setRequester(found);
            localStorage.setItem(STORAGE_KEY, id.toString());
        }
    }
    function clearRequester() {
        setRequester(null);
        localStorage.removeItem(STORAGE_KEY);
    }
    return (_jsx(RequesterContext.Provider, { value: {
            requester,
            requesters,
            loading,
            error,
            setRequesterId,
            clearRequester,
            reloadRequesters: loadData,
        }, children: children }));
}
export function useRequester() {
    const context = useContext(RequesterContext);
    if (!context) {
        throw new Error("useRequester must be used within a RequesterProvider");
    }
    return context;
}
