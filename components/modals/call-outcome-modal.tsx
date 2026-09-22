"use client";

import React, { useState } from "react";
import {
  X,
  PhoneCall,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "../context/app-context";

export function CallOutcomeModal({
  onSuccess,
}: {
  onSuccess?: (lead: any) => void;
}) {
  const { outcomeModalLead, setOutcomeModalLead, triggerReload } = useApp();

  const [outcome, setOutcome] = useState("Connected - Interested");
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("16:00");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("11:00");
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!outcomeModalLead) return null;

  const lead = outcomeModalLead;
  const close = () => {
    setOutcomeModalLead(null);
    setNotes("");
    setOriginalNotes("");
  };

  const outcomeOptions = [
    { label: "Connected - Interested", value: "Connected - Interested", color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
    { label: "Connected - Call Later", value: "Connected - Call Later", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
    { label: "Connected - Meeting Requested", value: "Connected - Meeting Requested", color: "border-blue-500 text-blue-400 bg-blue-500/10" },
    { label: "Connected - Not Interested", value: "Connected - Not Interested", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "No Answer", value: "No Answer", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "Busy", value: "Busy", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "Switched Off", value: "Switched Off", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "Wrong Number", value: "Wrong Number", color: "border-rose-600 text-rose-400 bg-rose-500/10" },
    { label: "Already Has Agency", value: "Already Has Agency", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "Not Decision Maker", value: "Not Decision Maker", color: "border-slate-600 text-slate-400 bg-slate-800/40" },
    { label: "Do Not Call", value: "Do Not Call", color: "border-red-600 text-red-400 bg-red-600/20" },
  ];

  // AI Note Cleanup
  const handleCleanNotes = async () => {
    if (!notes.trim()) return;
    setIsCleaning(true);
    setOriginalNotes(notes);

    try {
      const res = await fetch("/api/ai/clean-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success && data.cleanedNotes) {
        setNotes(data.cleanedNotes);
      }
    } catch (err) {
      console.error("AI clean failed", err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (outcome === "Connected - Call Later" && !followUpDate) {
      alert("Please select a Callback Date & Time for Call Later");
      return;
    }

    if (outcome === "Connected - Meeting Requested" && !meetingDate) {
      alert("Please select a Meeting Date & Time");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          outcome,
          durationSeconds,
          notes,
          originalNotes: originalNotes || notes,
          followUpDate: followUpDate || null,
          followUpTime: followUpTime || null,
          meetingDate: meetingDate || null,
          meetingTime: meetingTime || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        triggerReload();
        if (onSuccess) onSuccess(data.lead);
        close();
      } else {
        alert(data.error || "Failed to log call outcome");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2333]">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Log Call Outcome</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {lead.businessName} · {lead.phone}
            </p>
          </div>
          <button
            onClick={close}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Outcome Select Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Call Outcome <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outcomeOptions.map((opt) => {
                const isSelected = outcome === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOutcome(opt.value)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? `${opt.color} ring-1 ring-white/20 shadow`
                        : "border-[#1E2333] bg-[#0E1017] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DNC Warning */}
          {outcome === "Do Not Call" && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-xs text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Caution: </span>
                This will mark the lead as DO NOT CALL. Executives will be blocked from making future calls to this number.
              </div>
            </div>
          )}

          {/* Callback Scheduler (if Call Later) */}
          {outcome === "Connected - Call Later" && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Callback</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-[#12141C] border border-amber-500/40 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full bg-[#12141C] border border-amber-500/40 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Meeting Scheduler (if Meeting Requested) */}
          {outcome === "Connected - Meeting Requested" && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2.5 animate-in fade-in">
              <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Meeting Slot</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-[#12141C] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-[#12141C] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes & AI Cleanup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Call Notes & Discussion
              </label>
              <button
                type="button"
                onClick={handleCleanNotes}
                disabled={isCleaning || !notes.trim()}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isCleaning ? "Polishing with AI..." : "AI Note Cleanup"}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Owner interested in website. Asked to call tomorrow after 4 PM..."
              className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {originalNotes && originalNotes !== notes && (
              <div className="mt-1 text-[10px] text-slate-500 italic">
                Original note saved in timeline: &quot;{originalNotes}&quot;
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#1E2333] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2.5 bg-[#171B26] hover:bg-[#202534] text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black rounded-lg text-xs font-bold transition-all shadow active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Outcome & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
