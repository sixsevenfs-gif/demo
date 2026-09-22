"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CALLING_EXECUTIVE";
  dailyTarget: number;
  avatar?: string | null;
}

interface AppContextType {
  user: CurrentUser | null;
  allUsers: CurrentUser[];
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  // Modal states
  isQuickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  isAiImportOpen: boolean;
  setAiImportOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  duplicateModalData: any | null;
  setDuplicateModalData: (data: any | null) => void;
  outcomeModalLead: any | null;
  setOutcomeModalLead: (lead: any | null) => void;
  // Mobile Navigation Drawer
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  // Trigger general reload
  reloadKey: number;
  triggerReload: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [allUsers, setAllUsers] = useState<CurrentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isAiImportOpen, setAiImportOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [duplicateModalData, setDuplicateModalData] = useState<any | null>(null);
  const [outcomeModalLead, setOutcomeModalLead] = useState<any | null>(null);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAllUsers(data.allUsers || []);
      } else {
        setUser(null);
        setAllUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Keyboard shortcut ⌘K or Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerReload = () => {
    setReloadKey((k) => k + 1);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        allUsers,
        isLoading,
        refreshUser,
        isQuickAddOpen,
        setQuickAddOpen,
        isAiImportOpen,
        setAiImportOpen,
        isSearchOpen,
        setSearchOpen,
        duplicateModalData,
        setDuplicateModalData,
        outcomeModalLead,
        setOutcomeModalLead,
        isMobileNavOpen,
        setMobileNavOpen,
        reloadKey,
        triggerReload,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
