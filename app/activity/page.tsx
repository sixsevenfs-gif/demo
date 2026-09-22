"use client";

import React, { useState, useEffect } from "react";
import { Clock, Shield, Phone, Sparkles, User, FileText } from "lucide-react";

export default function ActivityPage() {
  const [tab, setTab] = useState<"activity" | "audit">("activity");
  const [activities, setActivities] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [actRes, audRes] = await Promise.all([
          fetch("/api/activity?type=activity"),
          fetch("/api/activity?type=audit"),
        ]);
        if (actRes.ok) {
          const actJson = await actRes.json();
          setActivities(actJson.activities || []);
        }
        if (audRes.ok) {
          const audJson = await audRes.json();
          setAudits(audJson.audits || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <span>Activity & Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete, chronological, immutable record of all team calls, status transitions, and administrative actions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2">
        <button
          onClick={() => setTab("activity")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "activity"
              ? "bg-[#181C28] text-white border border-[#272E44]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Live Activity Feed
        </button>

        <button
          onClick={() => setTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "audit"
              ? "bg-[#181C28] text-white border border-[#272E44]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Immutable Audit Log (Admin)
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 rounded-2xl bg-[#12141C] border border-[#1E2333]">
        {tab === "activity" ? (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-[#0D0F17] border border-[#1E2333] flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">{act.description}</div>
                  <div className="text-[11px] text-slate-400">
                    Logged by {act.userName || "System"}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#0D0F17] border border-[#1E2333] flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-slate-300">by {log.userName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{log.details}</div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
