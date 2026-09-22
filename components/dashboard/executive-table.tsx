"use client";

import React from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";

interface ExecItem {
  id: string;
  name: string;
  avatar: string;
  calls: number;
  interested: number;
  meetings: number;
}

export function ExecutiveTable({ executives }: { executives: ExecItem[] }) {
  const safeList = Array.isArray(executives) ? executives : [];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Executive Performance</h3>
        <Link
          href="/executives"
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <span className="text-slate-500">→</span>
        </Link>
      </div>

      {safeList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <UserCheck className="w-6 h-6 mx-auto text-slate-600" />
          <div>No calling executives active</div>
          <div className="text-[10px] text-slate-600">
            Create executive accounts to start tracking individual calling performance
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1E2B] text-[10px] sm:text-[11px] text-slate-400">
                <th className="pb-2 font-medium">Executive</th>
                <th className="pb-2 font-medium text-right">Calls</th>
                <th className="pb-2 font-medium text-right">Interested</th>
                <th className="pb-2 font-medium text-right">Meetings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171B26]">
              {safeList.map((exec) => (
                <tr key={exec.id || exec.name} className="hover:bg-[#161924]/60 transition-colors">
                  <td className="py-2 sm:py-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-800 border border-slate-700 text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                      {exec.avatar || exec.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-white truncate text-xs">{exec.name}</span>
                  </td>
                  <td className="py-2 sm:py-2.5 text-right font-mono text-slate-300">{exec.calls}</td>
                  <td className="py-2 sm:py-2.5 text-right font-mono text-emerald-400 font-semibold">
                    {exec.interested}
                  </td>
                  <td className="py-2 sm:py-2.5 text-right font-mono text-blue-400 font-semibold">
                    {exec.meetings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
