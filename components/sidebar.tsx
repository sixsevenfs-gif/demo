"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  UploadCloud,
  Clock,
  Bell,
  Settings,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useApp } from "./context/app-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, isMobileNavOpen, setMobileNavOpen } = useApp();
  const isAdmin = user?.role === "ADMIN";

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const adminNavItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Follow-Ups", href: "/follow-ups", icon: Calendar },
    { name: "Executives", href: "/executives", icon: UserCheck },
    { name: "AI Import", href: "/imports", icon: UploadCloud },
    { name: "Activity", href: "/activity", icon: Clock },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const executiveNavItems = [
    { name: "Home", href: "/executive/dashboard", icon: LayoutDashboard },
    { name: "My Leads", href: "/executive/leads", icon: Users },
    { name: "Follow-Ups", href: "/executive/follow-ups", icon: Calendar },
    { name: "Call History", href: "/executive/history", icon: Clock },
    { name: "Impo Note", href: "/executive/important-notes", icon: Bell },
  ];

  const navItems = isAdmin ? adminNavItems : executiveNavItems;

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full min-h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-[#161924]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-slate-700 bg-[#12141C] flex items-center justify-center font-bold text-white tracking-wider text-xs shadow-inner">
              DWA
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white">DWA</span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs font-medium text-slate-300">Lead Command Center</div>
              <div className="text-[10px] text-slate-500 font-mono">by DUDE Web Agency</div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A1E2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <div key={item.name} className="flex items-center gap-1">
                <Link
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex flex-1 items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#181C28] text-white font-semibold border border-[#272E44] shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#121520]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom DUDE Web Agency Banner */}
      <div className="p-4 border-t border-[#161924]">
        <a
          href="https://www.dudewebagency.in"
          target="_blank"
          rel="noreferrer"
          className="group block p-3 rounded-xl bg-[#121520] border border-[#1E2333] hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-6 h-6 rounded-full bg-black border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
              DWA
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Turn local businesses into real revenue.
          </p>
          <div className="text-[11px] font-semibold text-slate-200 mt-1 flex items-center gap-1">
            DUDE Web Agency
            <span className="text-indigo-400">→</span>
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (hidden on mobile, visible on lg+) */}
      <aside className="hidden lg:flex w-64 bg-[#090A0F] border-r border-[#1B1F2D] flex-col shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isMobileNavOpen is true) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
          />

          {/* Drawer content */}
          <aside className="relative w-72 max-w-[80vw] bg-[#090A0F] border-r border-[#1B1F2D] z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
