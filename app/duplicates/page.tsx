"use client";

import React, { useState, useEffect } from "react";
import { Copy, AlertCircle, GitMerge, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/context/app-context";

export default function DuplicatesPage() {
  const { user, triggerReload, reloadKey } = useApp();
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/duplicates");
      if (res.ok) {
        const json = await res.json();
        setDuplicates(json.duplicates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [reloadKey]);

  const handleMerge = async (primaryId: string, duplicateId: string) => {
    if (!confirm("Are you sure you want to merge these leads? All call history and notes will be transferred to the primary lead.")) {
      return;
    }

    setIsMerging(true);
    try {
      const res = await fetch("/api/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, duplicateId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchDuplicates();
        triggerReload();
      } else {
        alert(data.error || "Merge failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Scanning database for duplicate phone numbers...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Copy className="w-5 h-5 text-amber-400" />
          <span>Duplicate Leads & Merge Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Normalize phone numbers across Indian formats and merge redundant entries with zero data loss.
        </p>
      </div>

      {duplicates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#12141C] border border-[#1E2333] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-white">No Duplicate Phone Numbers Found</div>
          <div className="text-xs text-slate-400">
            All leads in your database have unique normalized contact numbers.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((group) => (
            <div
              key={group.normalizedPhone}
              className="p-5 rounded-2xl bg-[#12141C] border border-amber-500/30 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2333]">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-amber-400 font-bold">
                    Phone: {group.normalizedPhone}
                  </span>
                  <span className="text-slate-400">({group.count} duplicate records)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.leads.map((lead: any, idx: number) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-[#0D0F17] border border-[#1E2333] space-y-2 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{lead.businessName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#181C28] text-slate-300">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Category: {lead.category} · Assigned: {lead.assignedTo?.name || "Unassigned"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Total Calls: {lead.callCount} calls
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1E2333] gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-indigo-400 hover:underline text-[11px] flex items-center gap-1"
                      >
                        <span>View Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {idx > 0 && user?.role === "ADMIN" && (
                        <button
                          onClick={() => handleMerge(group.leads[0].id, lead.id)}
                          disabled={isMerging}
                          className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <GitMerge className="w-3 h-3" />
                          <span>Merge into #{group.leads[0].businessName}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
