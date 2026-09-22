"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { getTelLink } from "@/lib/phone";
import { useApp } from "../context/app-context";

export function FollowUpsWidget({ followUps }: { followUps: any[] }) {
  const [tab, setTab] = useState<"overdue" | "today" | "upcoming">("overdue");
  const { setOutcomeModalLead } = useApp();

  const safeList = Array.isArray(followUps) ? followUps : [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Group real database follow-ups
  const overdueItems = safeList.filter(
    (item) => new Date(item.scheduledAt) < startOfToday && item.status === "PENDING"
  );
  const todayItems = safeList.filter(
    (item) =>
      new Date(item.scheduledAt) >= startOfToday &&
      new Date(item.scheduledAt) <= endOfToday &&
      item.status === "PENDING"
  );
  const upcomingItems = safeList.filter(
    (item) => new Date(item.scheduledAt) > endOfToday && item.status === "PENDING"
  );

  const currentItems =
    tab === "overdue" ? overdueItems : tab === "today" ? todayItems : upcomingItems;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Follow-Ups</h3>
        <Link
          href="/follow-ups"
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <span className="text-slate-500">→</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0D0F17] rounded-lg border border-[#1E2333] mb-3">
        <button
          onClick={() => setTab("overdue")}
          className={`flex-1 py-1 px-1.5 sm:px-2 rounded text-[10px] sm:text-[11px] font-semibold transition-all flex items-center justify-center gap-1 truncate ${
            tab === "overdue"
              ? "bg-[#1C2030] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Overdue</span>
          <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
            {overdueItems.length}
          </span>
        </button>

        <button
          onClick={() => setTab("today")}
          className={`flex-1 py-1 px-1.5 sm:px-2 rounded text-[10px] sm:text-[11px] font-semibold transition-all flex items-center justify-center gap-1 truncate ${
            tab === "today"
              ? "bg-[#1C2030] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Today</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
            {todayItems.length}
          </span>
        </button>

        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 py-1 px-1.5 sm:px-2 rounded text-[10px] sm:text-[11px] font-semibold transition-all flex items-center justify-center gap-1 truncate ${
            tab === "upcoming"
              ? "bg-[#1C2030] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Upcoming</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
            {upcomingItems.length}
          </span>
        </button>
      </div>

      {/* Items List / Empty States */}
      <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {currentItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1.5">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500/60" />
            <div>
              {tab === "overdue"
                ? "No overdue follow-ups"
                : tab === "today"
                ? "No callbacks scheduled for today"
                : "No upcoming follow-ups"}
            </div>
            <div className="text-[10px] text-slate-600">
              Callbacks scheduled after calls will appear here automatically
            </div>
          </div>
        ) : (
          currentItems.map((item) => {
            const lead = item.lead || {};
            const initial = lead.businessName ? lead.businessName[0].toUpperCase() : "L";

            return (
              <div
                key={item.id}
                className="p-2 sm:p-2.5 rounded-xl bg-[#0D0F17] border border-[#1E2333] flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white truncate">
                      {lead.businessName || "Unknown Lead"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {new Date(item.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </div>
                  </div>
                </div>

                <a
                  href={getTelLink(lead.phone)}
                  onClick={() =>
                    setOutcomeModalLead({
                      id: lead.id,
                      businessName: lead.businessName,
                      phone: lead.phone,
                    })
                  }
                  className="py-1 px-2 rounded-lg bg-[#181C28] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-[#272E44] text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Call</span>
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
