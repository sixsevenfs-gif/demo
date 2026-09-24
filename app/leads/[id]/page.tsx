"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Building2,
  MapPin,
  Globe,
  Clock,
  Star,
  Calendar,
  User,
  ShieldAlert,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, allUsers, setOutcomeModalLead, triggerReload, reloadKey } = useApp();

  const [lead, setLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<{ summary: string; insight: any } | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [scripts, setScripts] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const isAdmin = user?.role === "ADMIN";

  const fetchLeadDetails = async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setLead(json.lead);
      } else if (res.status === 403) {
        alert("Access Denied: You are not authorized to view this lead.");
        router.push("/leads");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchLeadDetails();
    }
  }, [params.id, reloadKey]);

  useEffect(() => {
    if (!isAdmin) return;
    void Promise.all([fetch("/api/scripts"), fetch("/api/resources")]).then(async ([scriptResponse, resourceResponse]) => {
      if (scriptResponse.ok) setScripts((await scriptResponse.json()).scripts || []);
      if (resourceResponse.ok) setResources((await resourceResponse.json()).resources || []);
    }).catch(console.error);
  }, [isAdmin]);

  const handleToolkitChange = async (field: "assignedScriptId" | "assignedResourceId", value: string) => {
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Could not update lead toolkit.");
      return;
    }
    await fetchLeadDetails();
    triggerReload();
  };

  // Generate AI Lead Summary
  const handleGenerateSummary = async () => {
    if (!lead?.id) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/summarize-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary({ summary: data.summary, insight: data.insight });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchLeadDetails();
      triggerReload();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Reassign Lead (Admin only)
  const handleReassign = async (newExecId: string) => {
    const assignmentNote = newExecId && lead.callCount > 0 ? window.prompt("Why should the executive call this client again? (required)") : "";
    if (newExecId && lead.callCount > 0 && (!assignmentNote || assignmentNote.trim().length < 5)) {
      alert("Write a reason of at least 5 characters to reassign a previously called lead.");
      return;
    }
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: newExecId || null, assignmentNote }),
      });
      if (!response.ok) { const data = await response.json(); alert(data.error || "Could not reassign lead"); return; }
      fetchLeadDetails();
      triggerReload();
    } catch (err) {
      console.error(err);
    }
  };

  // Do Not Call Toggle
  const handleToggleDnc = async () => {
    const action = lead.isDoNotCall ? "DISABLE" : "ENABLE";
    let reason = "";
    if (action === "ENABLE") {
      reason = prompt("Enter reason for Do Not Call status:") || "Customer requested Do Not Call.";
    }

    try {
      const res = await fetch(`/api/leads/${lead.id}/dnc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchLeadDetails();
        triggerReload();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Soft Delete (Admin only)
  const handleDeleteLead = async () => {
    if (!confirm("Are you sure you want to delete this lead? Call history will be preserved.")) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) {
        triggerReload();
        router.push("/leads");
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading 360° lead profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Back button */}
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads Database</span>
        </Link>
      </div>

      {/* Top Profile Header Card */}
      <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {lead.businessName}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                lead.status === "INTERESTED"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : lead.status === "DO_NOT_CALL"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-[#181C28] text-slate-300 border-[#272E44]"
              }`}
            >
              {lead.status}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {lead.priority} Priority
            </span>
            {lead.isDoNotCall && (
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold">
                DO NOT CALL ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <span className="font-mono text-emerald-400 font-semibold text-sm">
              {lead.phone}
            </span>
            <span>{lead.category}</span>
            <span>{lead.city}, {lead.state}</span>
            <span>
              Assigned:{" "}
              <strong className="text-slate-200">
                {lead.assignedTo?.name || "Unassigned"}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!lead.isDoNotCall ? (
            <a
              href={getTelLink(lead.phone)}
              onClick={() => setOutcomeModalLead(lead)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow active:scale-95"
            >
              <Phone className="w-4 h-4 fill-black" />
              <span>Call Now</span>
            </a>
          ) : (
            <button
              disabled
              className="px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-400 text-xs font-bold flex items-center gap-2 cursor-not-allowed opacity-75"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Calls Blocked (DNC)</span>
            </button>
          )}

          <a
            href={getWhatsAppLink(lead.whatsappNumber || lead.phone)}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-[#171B26] hover:bg-[#202534] text-slate-200 border border-[#272E44] text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={handleToggleDnc}
            className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
              lead.isDoNotCall
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                : "bg-[#171B26] text-slate-400 border-[#272E44] hover:text-rose-400 hover:border-rose-500/40"
            }`}
          >
            {lead.isDoNotCall ? "Remove DNC" : "Mark Do Not Call"}
          </button>

          {isAdmin && (
            <button
              onClick={handleDeleteLead}
              className="p-2.5 rounded-xl bg-[#171B26] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#272E44] transition-colors"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DNC Alert Banner if active */}
      {lead.isDoNotCall && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-3 text-rose-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-400">
              DO NOT CALL REGISTER ACTIVE
            </div>
            <div className="mt-0.5 text-[11px] text-slate-300">
              Reason: {lead.dncReason || "Customer requested not to be contacted."} · Marked by {lead.dncMarkedBy || "Admin"}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Business Info + Sales Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Business Information Card */}
        <div className="p-5 rounded-xl bg-[#12141C] border border-[#1E2333] space-y-3.5">
          <h3 className="font-semibold text-xs text-white border-b border-[#1E2333] pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Business Information</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Contact Person</span>
              <span className="text-white font-medium">{lead.contactPerson || "Not specified"}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Google Rating & Reviews</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{lead.googleRating || "5.0"}</span>
                <span className="text-slate-400 font-normal">
                  ({lead.reviewCount || "26"} reviews)
                </span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Full Address</span>
              <span className="text-slate-200">{lead.address || "Guwahati, Assam"}</span>
            </div>

            {lead.mapsUrl && (
              <div>
                <span className="text-slate-400 block text-[11px]">Google Maps</span>
                <a
                  href={lead.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {lead.website && (
              <div>
                <span className="text-slate-400 block text-[11px]">Website</span>
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  {lead.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Sales & Assignment Card */}
        <div className="p-5 rounded-xl bg-[#12141C] border border-[#1E2333] space-y-3.5">
          <h3 className="font-semibold text-xs text-white border-b border-[#1E2333] pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Sales & Pipeline Details</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block text-[11px] mb-1">Update Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2 text-xs text-white focus:outline-none"
              >
                <option value="NEW">New</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="INTERESTED">Interested</option>
                <option value="FOLLOW_UP">Follow-Up</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
                <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="WON">Won</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="DO_NOT_CALL">Do Not Call</option>
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">
                  Assigned Executive
                </label>
                <select
                  value={lead.assignedToId || ""}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {allUsers
                    .filter((u) => u.role === "CALLING_EXECUTIVE")
                    .map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        {exec.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">
                  Script override
                </label>
                <select
                  value={lead.assignedScriptId || ""}
                  onChange={(e) => void handleToolkitChange("assignedScriptId", e.target.value)}
                  className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Use category default</option>
                  {scripts.filter((script) => script.status === "ACTIVE").map((script) => (
                    <option key={script.id} value={script.id}>{script.name} ({script.category})</option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Link for this lead</label>
                <select
                  value={lead.assignedResourceId || ""}
                  onChange={(e) => void handleToolkitChange("assignedResourceId", e.target.value)}
                  className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Use category links</option>
                  {resources.filter((resource) => resource.status === "ACTIVE" && resource.url).map((resource) => (
                    <option key={resource.id} value={resource.id}>{resource.name}</option>
                  ))}
                </select>
                {lead.assignedResourceId && resources.find((resource) => resource.id === lead.assignedResourceId)?.url && (
                  <a href={resources.find((resource) => resource.id === lead.assignedResourceId)?.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-[11px] text-indigo-300 hover:underline">
                    {resources.find((resource) => resource.id === lead.assignedResourceId)?.url}
                  </a>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-[#1E2333] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Calls Logged</span>
                <span className="font-bold text-white">{lead.callCount} calls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source</span>
                <span className="text-slate-300">{lead.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Follow-Up</span>
                <span className="text-rose-400 font-semibold">
                  {lead.nextFollowUpDate
                    ? new Date(lead.nextFollowUpDate).toLocaleString()
                    : "None scheduled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Operational Insight Card */}
        <div className="p-5 rounded-xl bg-[#12141C] border border-[#1E2333] space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E2333] pb-2 mb-3">
              <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Operational Insight</span>
              </h3>
              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingAi}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isGeneratingAi ? "Generating..." : "Generate Brief"}
              </button>
            </div>

            {aiSummary ? (
              <div className="space-y-3 text-xs animate-in fade-in">
                <div className="p-3 bg-[#0D0F17] rounded-xl border border-[#1E2333]">
                  <div className="text-[11px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">
                    Executive Summary
                  </div>
                  <p className="text-slate-300 leading-relaxed">{aiSummary.summary}</p>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-400 mb-1">
                    Recommended Operational Action:
                  </div>
                  <p className="text-slate-200">{aiSummary.insight.action}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Click &quot;Generate Brief&quot; to synthesize all call logs into an executive summary and operational recommendation.
              </div>
            )}
          </div>

          <button
            onClick={() => setOutcomeModalLead(lead)}
            className="w-full py-2 bg-[#171A26] hover:bg-[#202534] border border-[#272E44] text-xs font-semibold text-slate-200 rounded-lg transition-colors"
          >
            + Log New Call Outcome
          </button>
        </div>
      </div>

      {/* Complete Chronological Sales Timeline */}
      <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333]">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Complete Chronological Sales Timeline</span>
        </h3>

        <div className="space-y-4 border-l-2 border-[#1E2333] ml-3 pl-6 relative">
          {/* Calls */}
          {lead.calls?.map((call: any) => (
            <div key={call.id} className="relative group">
              {/* Dot */}
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#12141C] absolute -left-[31px] top-1" />
              <div className="p-4 rounded-xl bg-[#0D0F17] border border-[#1E2333] space-y-1.5">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400">{call.outcome}</span>
                    <span className="text-slate-400 font-normal">by {call.executive?.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(call.callDate).toLocaleString()}
                  </span>
                </div>

                {call.notes && (
                  <p className="text-xs text-slate-200 bg-[#141724] p-2.5 rounded-lg border border-[#202638]">
                    &quot;{call.notes}&quot;
                  </p>
                )}

                {call.originalNotes && call.originalNotes !== call.notes && (
                  <div className="text-[10px] text-slate-400 italic">
                    Raw notes prior to AI cleanup: &quot;{call.originalNotes}&quot;
                  </div>
                )}

                {call.followUpDate && (
                  <div className="text-[11px] text-amber-400 font-medium">
                    Callback Scheduled: {call.followUpDate} at {call.followUpTime || "16:00"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Activities */}
          {lead.activities?.map((act: any) => (
            <div key={act.id} className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-[#12141C] absolute -left-[30px] top-1" />
              <div className="text-xs text-slate-300 flex items-center justify-between">
                <span>{act.description}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
