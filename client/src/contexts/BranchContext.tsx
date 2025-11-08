import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";
import { useAuth } from "@/lib/auth";

interface BranchContextType {
  currentBranch: Branch | null;
  branches: Branch[];
  setCurrentBranch: (branchId: string) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);

  // Fetch all branches
  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Initialize current branch from localStorage or user's branch
  useEffect(() => {
    if (branches.length === 0) return;

    // Try to get saved branch from localStorage
    const savedBranchId = localStorage.getItem('currentBranchId');
    
    if (savedBranchId) {
      const savedBranch = branches.find(b => b.id === savedBranchId);
      if (savedBranch) {
        setCurrentBranchState(savedBranch);
        return;
      }
    }

    // If no saved branch or saved branch not found, use user's branch or first branch
    if (user?.branchId) {
      const userBranch = branches.find(b => b.id === user.branchId);
      if (userBranch) {
        setCurrentBranchState(userBranch);
        localStorage.setItem('currentBranchId', userBranch.id);
        return;
      }
    }

    // Fall back to first branch if available
    if (branches.length > 0) {
      setCurrentBranchState(branches[0]);
      localStorage.setItem('currentBranchId', branches[0].id);
    }
  }, [branches, user]);

  const setCurrentBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranchState(branch);
      localStorage.setItem('currentBranchId', branchId);
    }
  };

  return (
    <BranchContext.Provider value={{ currentBranch, branches, setCurrentBranch, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within BranchProvider");
  }
  return context;
}
