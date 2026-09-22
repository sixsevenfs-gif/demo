"use client";

import React from "react";
import { X, AlertCircle, Phone, Calendar, User, ExternalLink, GitMerge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/app-context";

export function DuplicateWarningModal() {
  const router = useRouter();
  const { duplicateModalData, setDuplicateModalData, user } = useApp();

  if (!duplicateModalData) return null;

  const lead = duplicateModalData.existingLead;
  const onAddAnyway = duplicateModalData.onAddAnyway;
  const onMerge = duplicateModalData.onMerge;
  const isAdmin = user?.role === "ADMIN";

  const close = () => setDuplicateModalData(null);

  const handleViewExisting = () => {
    if (lead?.id) {
      router.push(`/leads/${lead.id}`);
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2333]">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <span>Duplicate Detection</span>
          </h3>
          <button
            onClick={close}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-400 tracking-wide">
                Existing Lead Found
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                This phone number already exists in your database.
              </p>
            </div>
          </div>

          {/* Existing Lead Details Card */}
          <div className="p-4 rounded-xl bg-[#0D0F17] border border-[#1E2333] space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Business Name</span>
              <span className="font-semibold text-white">{lead?.businessName || "N/A"}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Phone</span>
              <span className="font-mono text-emerald-400 font-semibold">{lead?.phone || "N/A"}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Status</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {lead?.status || "Interested"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Assigned To</span>
              <span className="text-slate-200 font-medium">{lead?.assignedTo || "Unassigned"}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Last Call</span>
              <span className="text-slate-300">
                {lead?.lastCall
                  ? `${new Date(lead.lastCall.date || lead.lastCall.callDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : "Never contacted"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Total Calls</span>
              <span className="text-slate-200 font-bold">{lead?.callCount ?? lead?.totalCalls ?? 0}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Next Follow-Up</span>
              <span className="text-rose-400 font-medium">
                {lead?.nextFollowUpDate
                  ? new Date(lead.nextFollowUpDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "None scheduled"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#0B0D14] border-t border-[#1E2333] flex items-center justify-between gap-3">
          <button
            onClick={handleViewExisting}
            className="flex-1 px-4 py-2.5 bg-[#171B26] hover:bg-[#202534] text-white border border-[#272E44] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>View Existing Lead</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => {
                if (onAddAnyway) onAddAnyway();
                close();
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-200 text-black rounded-lg text-xs font-bold transition-all shadow active:scale-95"
            >
              Add Anyway
            </button>
          ) : (
            <button
              onClick={close}
              className="px-4 py-2.5 bg-[#171B26] text-slate-400 rounded-lg text-xs font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
