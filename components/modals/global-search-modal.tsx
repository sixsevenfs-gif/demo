"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Phone,
  Building2,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/app-context";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";

export function GlobalSearchModal() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen, setOutcomeModalLead } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data.leads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const close = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "INTERESTED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "MEETING_SCHEDULED":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "FOLLOW_UP":
      case "CALLBACK_REQUESTED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "DO_NOT_CALL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "WON":
        return "bg-emerald-600/30 text-white border-emerald-500";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-[#1E2333] bg-[#0E1017]">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any phone number, business name, or contact..."
            className="w-full py-4 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-500 hover:text-white transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-[#171B26] border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">
              Searching leads and past call histories...
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <div className="text-xs font-semibold text-white">No matching leads found</div>
              <div className="text-[11px] text-slate-400">
                Number &quot;{query}&quot; has never been contacted by your agency.
              </div>
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="p-8 text-center text-xs text-slate-500">
              Enter any Indian phone number (+91, 0..., or 10 digits) or business name to see past contact timeline.
            </div>
          )}

          {results.map((lead) => {
            const lastCall = lead.calls?.[0];
            return (
              <div
                key={lead.id}
                className="p-3.5 hover:bg-[#181C28] rounded-xl transition-all border border-transparent hover:border-[#272E44] flex items-center justify-between gap-4 cursor-pointer group"
                onClick={() => {
                  router.push(`/leads/${lead.id}`);
                  close();
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">
                      {lead.businessName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                    {lead.isDoNotCall && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold">
                        DNC
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="font-mono text-emerald-400">{lead.phone}</span>
                    <span>{lead.category}</span>
                    <span>{lead.city || "Guwahati"}</span>
                    <span>Assigned: {lead.assignedTo?.name || "Unassigned"}</span>
                  </div>

                  {lastCall && (
                    <div className="mt-1.5 text-[11px] text-slate-300 bg-[#0E1017] p-2 rounded-lg border border-[#1E2333] flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        Last call: <strong className="text-white">{lastCall.outcome}</strong> - &quot;{lastCall.notes || "No notes"}&quot;
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!lead.isDoNotCall && (
                    <a
                      href={getTelLink(lead.phone)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOutcomeModalLead(lead);
                      }}
                      className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                      title="Call Now"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
