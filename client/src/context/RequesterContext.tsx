import React, { createContext, useContext, useState, useEffect } from "react";
import { Requester, fetchRequesters } from "../api";

const STORAGE_KEY = "toktickit_requester_id";

interface RequesterContextType {
  requester: Requester | null;
  requesters: Requester[];
  loading: boolean;
  error: string | null;
  setRequesterId: (id: number) => void;
  clearRequester: () => void;
  reloadRequesters: () => Promise<void>;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [requester, setRequester] = useState<Requester | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setRequester(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requesters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function setRequesterId(id: number) {
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

  return (
    <RequesterContext.Provider
      value={{
        requester,
        requesters,
        loading,
        error,
        setRequesterId,
        clearRequester,
        reloadRequesters: loadData,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester() {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
