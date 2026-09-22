"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";
import { getTelLink } from "@/lib/phone";

export default function FollowUpsPage() {
  const { user, setOutcomeModalLead, reloadKey } = useApp();
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"overdue" | "today" | "tomorrow" | "upcoming" | "completed">("overdue");
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/follow-ups");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [reloadKey, user?.id]);

  const handleMarkComplete = async (id: string) => {
    try {
      await fetch("/api/follow-ups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async (id: string) => {
    const newDate = prompt("Enter new callback date & time (YYYY-MM-DD HH:MM):", "2025-04-26 15:00");
    if (!newDate) return;

    try {
      await fetch("/api/follow-ups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PENDING", scheduledAt: new Date(newDate).toISOString() }),
      });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading scheduled follow-ups...
      </div>
    );
  }

  const list = data[activeTab] || [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Follow-Up & Callback Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss an interested prospect. Track overdue and upcoming callbacks.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2 overflow-x-auto">
        {[
          { key: "overdue", label: "Overdue", count: data.counts?.overdue, badgeColor: "bg-rose-500 text-white" },
          { key: "today", label: "Today", count: data.counts?.today, badgeColor: "bg-amber-500 text-black font-bold" },
          { key: "tomorrow", label: "Tomorrow", count: data.counts?.tomorrow, badgeColor: "bg-blue-500 text-white" },
          { key: "upcoming", label: "Upcoming", count: data.counts?.upcoming, badgeColor: "bg-slate-700 text-slate-200" },
          { key: "completed", label: "Completed", count: data.counts?.completed, badgeColor: "bg-emerald-500 text-black font-bold" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-[#181C28] text-white border border-[#272E44]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.badgeColor}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Follow-up Cards */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#12141C] border border-[#1E2333] text-center text-xs text-slate-400">
            No follow-ups in this section.
          </div>
        ) : (
          list.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#12141C] border border-[#1E2333] hover:border-slate-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/leads/${item.lead.id}`}
                    className="font-bold text-sm text-white hover:text-indigo-300 transition-colors"
                  >
                    {item.lead.businessName}
                  </Link>
                  <span className="font-mono text-emerald-400 text-xs">
                    {item.lead.phone}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181C28] text-slate-300 border border-[#272E44]">
                    {item.lead.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.scheduledAt).toLocaleString()}</span>
                  </span>
                  <span>Assigned: {item.executive?.name}</span>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-300 bg-[#0D0F17] p-2 rounded-lg border border-[#1E2333] mt-1">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getTelLink(item.lead.phone)}
                  onClick={() => setOutcomeModalLead(item.lead)}
                  className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
                >
                  <Phone className="w-3.5 h-3.5 fill-black" />
                  <span>Call Now</span>
                </a>

                {item.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleMarkComplete(item.id)}
                      className="py-2 px-3 bg-[#181C28] hover:bg-[#222838] text-slate-200 border border-[#2A3146] text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Complete</span>
                    </button>

                    <button
                      onClick={() => handleReschedule(item.id)}
                      className="py-2 px-3 bg-[#181C28] hover:bg-[#222838] text-slate-400 hover:text-slate-200 border border-[#2A3146] text-xs rounded-lg transition-colors"
                    >
                      Reschedule
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
