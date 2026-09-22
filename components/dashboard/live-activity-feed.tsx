"use client";

import React from "react";
import { Phone, UserPlus, Sparkles, RefreshCw, Clock, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  metadata?: string | null;
  createdAt: string | Date;
}

export function LiveActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const safeList = Array.isArray(activities) ? activities : [];

  const getIcon = (type: string) => {
    switch (type) {
      case "CALL_MADE":
        return <Phone className="w-3.5 h-3.5 text-emerald-400" />;
      case "LEAD_CREATED":
        return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case "AI_IMPORTED":
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case "STATUS_CHANGED":
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string | Date) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Live Activity Feed</h3>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Activities list */}
      {safeList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <Activity className="w-6 h-6 mx-auto text-slate-600" />
          <div>No activity events logged yet</div>
          <div className="text-[10px] text-slate-600">
            Outreach calls, imports, and status changes will stream here in real time
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3 overflow-y-auto max-h-64 sm:max-h-72 pr-1">
          {safeList.map((act) => {
            let meta: any = null;
            try {
              if (act.metadata) meta = JSON.parse(act.metadata);
            } catch {}

            return (
              <div key={act.id} className="flex items-start gap-2.5 sm:gap-3 text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#181C28] border border-[#272E44] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-medium leading-snug break-words">
                    {act.description}
                  </div>
                  {meta && (
                    <div className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                      {meta.outcome && <span>{meta.outcome}</span>}
                      {meta.callback && (
                        <span className="text-amber-400 ml-1">· Callback {meta.callback}</span>
                      )}
                      {meta.status && (
                        <span className="text-emerald-400 ml-1">→ {meta.status}</span>
                      )}
                      {meta.source && <span className="ml-1">· {meta.source}</span>}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {formatTimeAgo(act.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
