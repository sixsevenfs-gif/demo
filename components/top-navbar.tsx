"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Plus, Sparkles, Bell, Menu } from "lucide-react";
import { useApp } from "./context/app-context";

export function TopNavbar() {
  const {
    user,
    setQuickAddOpen,
    setAiImportOpen,
    setSearchOpen,
    setMobileNavOpen,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) setNotifications((await response.json()).notifications || []);
    } catch { /* Keep the last successful list during a network interruption. */ }
  };
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    void loadNotifications();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadNotifications(); }, 15000);
    const refresh = () => void loadNotifications();
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [user?.id]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const markRead = async (item: any) => {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, kind: item.kind }) });
    if (response.ok) { setNotifications((current) => current.filter((notice) => !(notice.id === item.id && notice.kind === item.kind))); }
  };

  return (
    <header className="h-16 border-b border-[#1A1E2C] bg-[#090A0F]/90 backdrop-blur sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Mobile Hamburger Menu Toggle */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="lg:hidden p-2 rounded-lg bg-[#12141C] border border-[#1E2333] text-slate-300 hover:text-white shrink-0 active:scale-95"
        title="Open Navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Search Input Bar (⌘K) */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2 bg-[#12141C] border border-[#1E2333] hover:border-slate-600 rounded-lg text-xs text-slate-400 transition-all text-left shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">Search phone, lead, contact...</span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-[#1A1E2B] rounded border border-slate-700/60 shrink-0">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Action Buttons & User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {user?.role === "ADMIN" && <>
        {/* Quick Add Lead */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95"
          title="Quick Add Lead"
        >
          <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        {/* AI Import */}
        <button
          onClick={() => setAiImportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-[#141722] hover:bg-[#1A1E2C] text-slate-200 border border-[#23293D] font-medium text-xs rounded-lg transition-all shadow-sm active:scale-95 group"
          title="AI Screenshot Import"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">AI Import</span>
        </button>
        </>}

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
            onClick={() => { setIsNotifOpen(!isNotifOpen); void loadNotifications(); }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#12141C] border border-[#1E2333] hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {notifications.length > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 h-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[min(92vw,360px)] bg-[#12141C] border border-[#1E2333] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2333]">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-slate-400">{notifications.length} unread</span>
              </div>
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                {notifications.length ? notifications.map((item) => <div key={`${item.kind}-${item.id}`} className="rounded-lg border border-indigo-500/20 bg-[#171A24] p-3 text-xs">
                  <button onClick={() => { setSelectedNotification(item); void markRead(item); }} className="block w-full text-left"><b className="text-indigo-200">{item.title}</b><p className="mt-1 line-clamp-2 text-slate-400">{item.message}</p></button>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>{new Date(item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span><button onClick={() => void markRead(item)} className="text-emerald-300">Mark read</button></div>
                </div>) : <p className="py-5 text-center text-xs text-slate-400">No unread notifications.</p>}
              </div>
              {selectedNotification && <div className="mt-3 rounded-lg border border-indigo-500/30 bg-[#0D0F17] p-3 text-xs"><b className="text-white">{selectedNotification.title}</b><p className="mt-2 whitespace-pre-wrap text-slate-300">{selectedNotification.message}</p><div className="mt-3 flex items-center justify-between"><Link href={selectedNotification.href} onClick={() => setIsNotifOpen(false)} className="text-indigo-300">Open details →</Link><button onClick={() => { void markRead(selectedNotification); setSelectedNotification(null); }} className="text-emerald-300">Mark read</button></div></div>}
            </div>
          )}
        </div>

        {/* Current signed-in user */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1.5 bg-[#12141C] border border-[#1E2333] rounded-lg text-xs text-left">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-white">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "?")}
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-[11px] text-white leading-tight truncate max-w-[100px]">
                {user?.name || "Not signed in"}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {user?.role === "ADMIN" ? "Admin" : "Executive"}
              </div>
            </div>
        </div>
      </div>
    </header>
  );
}
