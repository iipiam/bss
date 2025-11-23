import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Restaurant } from "@shared/schema";

interface AuthContextType {
  user: User | null | undefined;
  restaurant: Restaurant | null | undefined;
  accountType: "client" | "it" | null;
  isLoading: boolean;
  login: (username: string, password: string, accountType?: "client" | "it") => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accountType, setAccountType] = useState<"client" | "it" | null>(null);
  
  const { data, isLoading, refetch } = useQuery<{ user: User; restaurant: Restaurant; accountType?: "client" | "it" } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      // Return null if not authenticated (instead of throwing)
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  // Extract user, restaurant, and accountType from the response
  const user = data?.user;
  const restaurant = data?.restaurant;
  
  // Update accountType when data changes
  useEffect(() => {
    if (data?.accountType) {
      setAccountType(data.accountType);
    } else if (data === null) {
      setAccountType(null);
    }
  }, [data]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, accountType }: { username: string; password: string; accountType?: "client" | "it" }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password, accountType });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      if (data?.accountType) {
        setAccountType(data.accountType);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setAccountType(null);
    },
  });

  const login = async (username: string, password: string, accountType?: "client" | "it") => {
    await loginMutation.mutateAsync({ username, password, accountType });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refetchUser = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider value={{ user, restaurant, accountType, isLoading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
