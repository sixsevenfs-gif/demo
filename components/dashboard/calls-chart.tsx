"use client";

import React, { useState } from "react";
import { ChevronDown, BarChart2 } from "lucide-react";

interface CallData {
  date: string;
  day: string;
  calls: number;
  active?: boolean;
}

export function CallsChart({ data }: { data: CallData[] }) {
  const [hoveredItem, setHoveredItem] = useState<CallData | null>(null);

  const safeData = Array.isArray(data) ? data : [];
  const maxCallValue = Math.max(...safeData.map((d) => d.calls), 5);
  const totalCalls = safeData.reduce((acc, curr) => acc + curr.calls, 0);

  // Active or hovered tooltip data
  const activeTooltip = hoveredItem || safeData.find((d) => d.active) || safeData[safeData.length - 1];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="font-semibold text-xs text-white">Calls Over Time</h3>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {totalCalls} total outreach calls recorded
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-[#171B26] px-2 py-0.5 rounded border border-[#272E44]">
          Last 7 days
        </span>
      </div>

      {totalCalls === 0 && safeData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <BarChart2 className="w-6 h-6 mx-auto text-slate-600" />
          <div>No call activity recorded yet</div>
          <div className="text-[10px] text-slate-600">Calls logged will automatically plot here</div>
        </div>
      ) : (
        /* Chart Visualization */
        <div className="relative pt-4 pb-1">
          {/* Dynamic Tooltip */}
          {activeTooltip && (
            <div className="mb-2 bg-[#1E2436] border border-[#303852] rounded-md px-2.5 py-1 text-center shadow-lg w-max ml-auto text-xs">
              <span className="font-bold text-white">{activeTooltip.calls} calls</span>
              <span className="text-slate-400 text-[10px] ml-1.5">({activeTooltip.date})</span>
            </div>
          )}

          {/* Grid lines and Bars */}
          <div className="h-36 sm:h-40 flex items-end justify-between gap-1.5 sm:gap-2.5 pl-6 sm:pl-8 relative">
            {/* Y Axis Labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] sm:text-[10px] text-slate-500 font-mono">
              <span>{maxCallValue}</span>
              <span>{Math.round(maxCallValue / 2)}</span>
              <span>0</span>
            </div>

            {/* Grid lines */}
            <div className="absolute left-6 sm:left-8 right-0 top-0 h-[1px] bg-[#1A1E2B]" />
            <div className="absolute left-6 sm:left-8 right-0 top-1/2 h-[1px] bg-[#1A1E2B]" />
            <div className="absolute left-6 sm:left-8 right-0 bottom-0 h-[1px] bg-[#1A1E2B]" />

            {/* Bars */}
            {safeData.map((item, idx) => {
              const heightPercent =
                maxCallValue > 0 ? Math.min(100, Math.round((item.calls / maxCallValue) * 100)) : 0;
              const isLatest = idx === safeData.length - 1;

              return (
                <div
                  key={item.date}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-0"
                >
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className={`w-full max-w-[24px] sm:max-w-[28px] rounded-t-sm transition-all ${
                      item.calls > 0
                        ? isLatest
                          ? "bg-[#3B82F6] hover:bg-[#60A5FA] shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                          : "bg-[#252C3E] hover:bg-[#3B82F6]"
                        : "bg-[#161924]"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between pl-6 sm:pl-8 mt-2 text-[9px] sm:text-[10px] text-slate-400 font-mono overflow-hidden">
            {safeData.map((item) => (
              <span key={item.date} className="flex-1 text-center truncate">
                {item.date.split(" ")[1] || item.date}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
