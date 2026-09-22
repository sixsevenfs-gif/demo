"use client";

import React from "react";
import { Filter, Users } from "lucide-react";

interface PipelineProps {
  pipeline: {
    total: number;
    contacted: { count: number; percentage: string };
    interested: { count: number; percentage: string };
    proposal: { count: number; percentage: string };
    closed: { count: number; percentage: string };
  };
}

export function PipelineFunnel({ pipeline }: PipelineProps) {
  const total = pipeline?.total ?? 0;

  const stages = [
    {
      label: "Total Leads",
      count: total.toLocaleString(),
      percentage: null,
      width: "100%",
      color: "bg-emerald-600/30 border-emerald-500/40",
      dot: "bg-slate-400",
    },
    {
      label: "Contacted",
      count: (pipeline?.contacted?.count ?? 0).toLocaleString(),
      percentage: pipeline?.contacted?.percentage || "0%",
      width: "82%",
      color: "bg-emerald-500/50 border-emerald-400/50",
      dot: "bg-emerald-400",
    },
    {
      label: "Interested",
      count: (pipeline?.interested?.count ?? 0).toLocaleString(),
      percentage: pipeline?.interested?.percentage || "0%",
      width: "64%",
      color: "bg-emerald-500/70 border-emerald-300/60",
      dot: "bg-emerald-400",
    },
    {
      label: "Proposal",
      count: (pipeline?.proposal?.count ?? 0).toLocaleString(),
      percentage: pipeline?.proposal?.percentage || "0%",
      width: "46%",
      color: "bg-emerald-400/85 border-emerald-200/70",
      dot: "bg-emerald-300",
    },
    {
      label: "Closed / Won",
      count: (pipeline?.closed?.count ?? 0).toLocaleString(),
      percentage: pipeline?.closed?.percentage || "0%",
      width: "28%",
      color: "bg-emerald-300 text-black border-white",
      dot: "bg-emerald-200",
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Lead Pipeline</h3>
        <span className="text-[10px] text-slate-400 font-mono">Stage conversion</span>
      </div>

      {total === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <Filter className="w-6 h-6 mx-auto text-slate-600" />
          <div>No leads in pipeline yet</div>
          <div className="text-[10px] text-slate-600">
            Import or add business leads to view the conversion funnel
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 sm:gap-6 my-auto py-1">
          {/* Visual Funnel */}
          <div className="w-24 sm:w-32 flex flex-col items-center gap-1.5 shrink-0">
            {stages.map((st, i) => (
              <div
                key={i}
                style={{ width: st.width }}
                className={`h-5 sm:h-6 rounded-md border ${st.color} transition-all shadow-sm flex items-center justify-center`}
              />
            ))}
          </div>

          {/* Legend / Metrics */}
          <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
            {stages.map((st, i) => (
              <div key={i} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${st.dot}`} />
                  <span className="font-bold text-white text-[11px] sm:text-xs truncate">
                    {st.count}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 shrink-0 text-right">
                  {st.label} {st.percentage ? `(${st.percentage})` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
