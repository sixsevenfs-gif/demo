"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  SkipForward,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";

export default function CallingQueuePage() {
  const { user, setOutcomeModalLead, reloadKey } = useApp();
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leads?view=queue&limit=50");
      if (res.ok) {
        const json = await res.json();
        setQueue(json.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [reloadKey, user?.id]);

  const currentLead = queue[currentIndex] || null;

  const handleSkip = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleQuickOutcome = async (outcome: string) => {
    if (!currentLead) return;

    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: currentLead.id,
          outcome,
          durationSeconds: 45,
          notes: `Quick outcome logged: ${outcome}`,
        }),
      });

      if (autoAdvance) {
        handleSkip();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading prioritized calling queue...
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Calling Queue Completed!</h2>
        <p className="text-xs text-slate-400">
          No remaining call-pending leads in your queue. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in">
      {/* Queue Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <span>Calling Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#181C28] text-slate-300 border border-[#272E44] font-mono">
              Lead {currentIndex + 1} of {queue.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous sales calling console. Dial, log outcome, auto-advance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="rounded bg-[#0D0F17] border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Auto-advance on outcome</span>
          </label>

          <button
            onClick={handleSkip}
            className="px-3.5 py-1.5 bg-[#171A26] hover:bg-[#202534] border border-[#272E44] text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Skip Lead</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Focus Card */}
      {currentLead && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {currentLead.businessName}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {currentLead.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{currentLead.category}</span>
                  <span>·</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{currentLead.googleRating || 5.0}</span>
                  </span>
                  <span>·</span>
                  <span>{currentLead.city || "Guwahati"}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400">Total Calls Logged</span>
                <div className="font-mono text-base font-bold text-white">
                  {currentLead.callCount} calls
                </div>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="p-4 rounded-xl bg-[#0D0F17] border border-[#1E2333] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  {currentLead.phone}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Address:</span>
                <span className="text-slate-200 text-right max-w-sm">
                  {currentLead.address || "Guwahati, Assam"}
                </span>
              </div>
            </div>

            {/* Prominent Action Calling Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={getTelLink(currentLead.phone)}
                onClick={() => setOutcomeModalLead(currentLead)}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Phone className="w-4 h-4 fill-black" />
                <span>CALL NOW (tel:)</span>
              </a>

              <a
                href={getWhatsAppLink(currentLead.whatsappNumber || currentLead.phone)}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-[#171B26] hover:bg-[#202534] text-slate-200 border border-[#272E44] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Quick Outcome Selector */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Mark Quick Call Outcome:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickOutcome("Connected - Interested")}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold text-center"
                >
                  Interested
                </button>
                <button
                  onClick={() => setOutcomeModalLead(currentLead)}
                  className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold text-center"
                >
                  Call Later (Callback)
                </button>
                <button
                  onClick={() => handleQuickOutcome("No Answer")}
                  className="p-2 rounded-lg bg-[#181C28] hover:bg-[#202534] text-slate-300 border border-[#272E44] text-xs font-medium text-center"
                >
                  No Answer
                </button>
                <button
                  onClick={() => handleQuickOutcome("Connected - Not Interested")}
                  className="p-2 rounded-lg bg-[#181C28] hover:bg-[#202534] text-slate-400 border border-[#272E44] text-xs font-medium text-center"
                >
                  Not Interested
                </button>
              </div>
            </div>
          </div>

          {/* Up Next in Queue */}
          <div className="p-5 rounded-2xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between">
            <h3 className="font-semibold text-xs text-white border-b border-[#1E2333] pb-2 mb-3">
              Upcoming in Queue ({queue.length - currentIndex - 1} remaining)
            </h3>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {queue.slice(currentIndex + 1, currentIndex + 6).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentIndex(currentIndex + 1 + idx)}
                  className="p-3 rounded-xl bg-[#0D0F17] border border-[#1E2333] hover:border-slate-600 transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-xs text-white truncate">
                    {item.businessName}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    {item.phone}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {item.category} · {item.priority}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOutcomeModalLead(currentLead)}
              className="w-full mt-4 py-2.5 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-all shadow"
            >
              Open Full Outcome & AI Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
