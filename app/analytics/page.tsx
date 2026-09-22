"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, Users, PhoneCall, Handshake, Globe } from "lucide-react";

export default function AnalyticsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        setSources(data.sources || []);
        setCategories(data.categories || []);
        setTotalLeads(data.totalLeads || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const exportAnalytics = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Category,Total Leads,Outreach Calls\n" +
      categories.map((c) => `"${c.name}",${c.leads},${c.calls}`).join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `DWA_Sales_Analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 font-mono">
        Loading real-time sales intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Sales Analytics & Conversion Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate real lead sources, category volumes, and calling activity.
          </p>
        </div>

        <button
          onClick={exportAnalytics}
          className="px-3.5 py-2 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow w-max active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Source Performance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4">
          <h3 className="font-bold text-xs text-white flex items-center justify-between">
            <span>Lead Source Distribution</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">
              {totalLeads} total leads
            </span>
          </h3>

          {sources.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No lead sources recorded yet.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {sources.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-mono text-white">
                      {s.leads} leads ({s.share})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0D0F17] overflow-hidden">
                    <div
                      style={{ width: s.share }}
                      className="h-full bg-emerald-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4">
          <h3 className="font-bold text-xs text-white flex items-center justify-between">
            <span>Category Performance & Outreach</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">
              By call volume
            </span>
          </h3>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No categories recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[320px]">
                <thead>
                  <tr className="border-b border-[#1E2333] text-[10px] sm:text-[11px] text-slate-400">
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Leads</th>
                    <th className="pb-2 text-right">Calls Made</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171B26]">
                  {categories.map((c) => (
                    <tr key={c.name} className="hover:bg-[#161924]/60 transition-colors">
                      <td className="py-2.5 font-medium text-white truncate max-w-[180px]">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-300">{c.leads}</td>
                      <td className="py-2.5 text-right font-mono text-emerald-400 font-bold">
                        {c.calls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
