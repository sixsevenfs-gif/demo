"use client";

import React, { useState } from "react";
import {
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  PhoneCall,
  Plus,
} from "lucide-react";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";
import { useApp } from "../context/app-context";

export function CallingQueueWidget({ lead }: { lead: any | null }) {
  const { setOutcomeModalLead, setQuickAddOpen, triggerReload } = useApp();
  const [autoQueue, setAutoQueue] = useState(true);

  // Dynamic tomorrow date string
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [callbackDate, setCallbackDate] = useState(tomorrowStr);
  const [callbackTime, setCallbackTime] = useState("16:00");
  const [isSettingCallback, setIsSettingCallback] = useState(false);

  if (!lead) {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col items-center justify-center text-center h-full min-h-[260px] space-y-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Calling Queue Clear</div>
          <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs leading-relaxed">
            No pending leads in calling queue right now. Add or import leads to start sales outreach.
          </div>
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-lg transition-all shadow flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Quick Add Lead</span>
        </button>
      </div>
    );
  }

  const handleQuickOutcome = async (outcome: string) => {
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          outcome,
          durationSeconds: 45,
          notes: `Quick outcome logged: ${outcome}`,
        }),
      });
      triggerReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCallback = async () => {
    setIsSettingCallback(true);
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          outcome: "Connected - Call Later",
          followUpDate: callbackDate,
          followUpTime: callbackTime,
          notes: `Callback scheduled for ${callbackDate} at ${callbackTime}`,
        }),
      });
      triggerReload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettingCallback(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Next Lead to Call</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Auto queue</span>
          <button
            type="button"
            onClick={() => setAutoQueue(!autoQueue)}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              autoQueue ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                autoQueue ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Business Details Card */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-[#0D0F17] border border-[#1E2333] mb-3">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                {lead.businessName}
              </h4>
              <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                {lead.priority || "NORMAL"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
              <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{lead.googleRating || 5.0}</span>
              </span>
              <span>·</span>
              <span className="truncate">{lead.category}</span>
            </div>

            <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{lead.address || "Guwahati, Assam"}</span>
            </div>
          </div>
        </div>

        {/* Action Call & WhatsApp Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <a
            href={getTelLink(lead.phone)}
            onClick={() => setOutcomeModalLead(lead)}
            className="py-2 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 fill-black" />
            <span>Call</span>
          </a>

          <a
            href={getWhatsAppLink(
              lead.whatsappNumber || lead.phone,
              `Hello from DUDE Web Agency regarding ${lead.businessName}`
            )}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-2.5 rounded-lg bg-[#181C28] hover:bg-[#222838] text-slate-200 border border-[#2A3146] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Call Outcome Quick Pills */}
      <div className="mb-3">
        <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mb-1.5">
          Quick Outcome
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleQuickOutcome("Connected - Interested")}
            className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center justify-center truncate"
          >
            Interested
          </button>

          <button
            onClick={() => handleQuickOutcome("Connected - Not Interested")}
            className="flex-1 py-1 px-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center justify-center truncate"
          >
            Not Interested
          </button>

          <button
            onClick={() => handleQuickOutcome("No Answer")}
            className="flex-1 py-1 px-1.5 rounded-lg bg-[#181C28] hover:bg-[#202534] text-slate-300 border border-[#272E44] text-[10px] sm:text-[11px] font-medium transition-colors flex items-center justify-center truncate"
          >
            No Answer
          </button>
        </div>
      </div>

      {/* Schedule Callback row */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mb-1.5">
          Schedule Callback
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-[#0D0F17] border border-[#1E2333] rounded-lg px-2 py-1 text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full"
            />
          </div>
          <button
            onClick={handleSetCallback}
            disabled={isSettingCallback}
            className="px-3 py-1 bg-[#1C2132] hover:bg-[#282F48] text-white border border-[#2F3752] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
          >
            {isSettingCallback ? "..." : "Set"}
          </button>
        </div>
      </div>
    </div>
  );
}
