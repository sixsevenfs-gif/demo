"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "@/components/context/app-context";
import { Sidebar } from "@/components/sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { QuickAddModal } from "@/components/modals/quick-add-modal";
import { AiImportModal } from "@/components/modals/ai-import-modal";
import { DuplicateWarningModal } from "@/components/modals/duplicate-warning-modal";
import { CallOutcomeModal } from "@/components/modals/call-outcome-modal";
import { GlobalSearchModal } from "@/components/modals/global-search-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <AppProvider>
      <div className="flex w-full min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <TopNavbar />
          <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto max-w-full">{children}</main>
        </div>
      </div>
      <QuickAddModal />
      <AiImportModal />
      <DuplicateWarningModal />
      <CallOutcomeModal />
      <GlobalSearchModal />
    </AppProvider>
  );
}
