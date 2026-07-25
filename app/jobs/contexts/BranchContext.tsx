"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BranchItem {
  branch_id: string;
  branch_name: string;
  job_count: number;
  urgent_count: number;
}

interface BranchContextType {
  branches: BranchItem[];
  loading: boolean;
  refetch: () => void;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  loading: true,
  refetch: () => {},
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBranches() {
    try {
      setLoading(true);
      const res = await fetch("/jobs/api/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");

      const data = await res.json();
      setBranches(data.openBranchJobs ?? []);
    } catch (err) {
      console.error("Fetch branches error:", err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <BranchContext.Provider value={{ branches, loading, refetch: fetchBranches }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranches() {
  return useContext(BranchContext);
}