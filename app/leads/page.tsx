"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Plus,
  Sparkles,
  Phone,
  MessageCircle,
  Download,
  Share2,
  CheckSquare,
  Square,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";

export default function LeadsPage() {
  const router = useRouter();
  const { user, setQuickAddOpen, setAiImportOpen, setOutcomeModalLead, reloadKey } = useApp();

  const [leads, setLeads] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeExecutives, setActiveExecutives] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [execFilter, setExecFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Bulk selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTargetExec, setBulkTargetExec] = useState("");

  const isAdmin = user?.role === "ADMIN";

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (execFilter !== "ALL") params.set("executiveId", execFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads || []);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, priorityFilter, execFilter, reloadKey]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadExecutives = async () => {
      const response = await fetch("/api/executives", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setActiveExecutives((data.executives || []).filter((executive: any) => executive.status === "ACTIVE"));
    };
    void loadExecutives();
    const refresh = window.setInterval(() => void loadExecutives(), 15_000);
    return () => window.clearInterval(refresh);
  }, [isAdmin, reloadKey]);

  // Bulk selection toggles
  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This will remove it from the active leads list.`)) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedIds((ids) => ids.filter((leadId) => leadId !== id));
      fetchLeads();
    } else {
      const data = await res.json();
      alert(data.error || "Lead could not be deleted.");
    }
  };

  // Bulk actions (Assign, Round-Robin, Status change, CSV export)
  const handleExecuteBulk = async () => {
    if (selectedIds.length === 0) return;

    if (bulkAction === "ROUND_ROBIN") {
      try {
        const res = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadIds: selectedIds,
            action: "ROUND_ROBIN",
          }),
        });
        const json = await res.json();
        if (res.ok) {
          alert(json.message);
          setSelectedIds([]);
          fetchLeads();
        } else {
          alert(json.error || "Bulk action failed");
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (bulkAction === "ASSIGN" && bulkTargetExec) {
      try {
        const res = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadIds: selectedIds,
            action: "ASSIGN",
            executiveId: bulkTargetExec,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          alert(json.message);
          setSelectedIds([]);
          fetchLeads();
        } else {
          alert(json.error || "Bulk action failed");
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (bulkAction === "EXPORT") {
      exportToCsv();
    }
  };

  const exportToCsv = () => {
    const selectedLeads = leads.filter((l) =>
      selectedIds.length > 0 ? selectedIds.includes(l.id) : true
    );
    const headers = ["Business Name", "Phone", "Category", "City", "Status", "Priority", "Assigned To"];
    const rows = selectedLeads.map((l) => [
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.category || ""}"`,
      `"${l.city || ""}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      `"${l.assignedTo?.name || "Unassigned"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DWA_Leads_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "INTERESTED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "MEETING_SCHEDULED":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "FOLLOW_UP":
      case "CALLBACK_REQUESTED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "NOT_INTERESTED":
        return "bg-slate-800 text-slate-400 border-slate-700";
      case "DO_NOT_CALL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold";
      case "WON":
        return "bg-emerald-500 text-black border-emerald-400 font-bold";
      default:
        return "bg-[#181C28] text-slate-300 border-[#272E44]";
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Leads Database</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181C28] text-slate-300 border border-[#272E44] font-mono">
              {totalCount} leads
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, filter, assign, and track outreach across all business leads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCsv()}
            className="px-3 py-2 bg-[#12141C] hover:bg-[#1A1E2C] border border-[#1E2333] text-xs font-semibold text-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setAiImportOpen(true)}
            className="px-3.5 py-2 bg-[#171A26] hover:bg-[#202534] border border-[#272E44] text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Import</span>
          </button>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-black text-xs font-bold rounded-lg transition-all shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by business name, phone, city, category..."
            className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0D0F17] border border-[#1E2333] text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="INTERESTED">Interested</option>
            <option value="FOLLOW_UP">Follow-Up</option>
            <option value="CALLBACK_REQUESTED">Callback Requested</option>
            <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            <option value="WON">Won</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="DO_NOT_CALL">Do Not Call</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0D0F17] border border-[#1E2333] text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HOT">Hot 🔥</option>
            <option value="WARM">Warm ⚡</option>
            <option value="NORMAL">Normal</option>
            <option value="COLD">Cold ❄️</option>
          </select>

          {/* Executive Filter (Admin only) */}
          {isAdmin && (
            <select
              value={execFilter}
              onChange={(e) => setExecFilter(e.target.value)}
              className="bg-[#0D0F17] border border-[#1E2333] text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="ALL">All Executives</option>
              <option value="unassigned">Unassigned Only</option>
              {activeExecutives.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-[#0D0F17] border border-[#1E2333] rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                viewMode === "table" ? "bg-[#1E2333] text-white" : "text-slate-400"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                viewMode === "kanban" ? "bg-[#1E2333] text-white" : "text-slate-400"
              }`}
            >
              Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Banner (when leads selected) */}
      {selectedIds.length > 0 && isAdmin && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="font-semibold text-indigo-300">
            {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""} selected
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-[#12141C] border border-[#272E44] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="">Select Bulk Action...</option>
              <option value="ROUND_ROBIN">Round-Robin Assignment (Even Split)</option>
              <option value="ASSIGN">Assign to Specific Executive</option>
              <option value="EXPORT">Export Selected to CSV</option>
            </select>

            {bulkAction === "ASSIGN" && (
              <select
                value={bulkTargetExec}
                onChange={(e) => setBulkTargetExec(e.target.value)}
                className="bg-[#12141C] border border-[#272E44] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="">Choose Executive...</option>
                {activeExecutives.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            )}

            <button
              onClick={handleExecuteBulk}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Leads Table View */}
      {viewMode === "table" && (
        <div className="p-5 rounded-xl bg-[#12141C] border border-[#1E2333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1A1E2B] text-[11px] text-slate-400">
                  {isAdmin && (
                    <th className="pb-3 w-8">
                      <button
                        onClick={handleSelectAll}
                        className="text-slate-400 hover:text-white"
                      >
                        {selectedIds.length === leads.length && leads.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="pb-3 font-medium">Business Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">City</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Assigned Executive</th>
                  <th className="pb-3 font-medium">Last Call Outcome</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171B26]">
                {leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const lastCall = lead.calls?.[0];

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className={`hover:bg-[#161924]/60 transition-colors cursor-pointer group ${
                        isSelected ? "bg-[#181C28]" : ""
                      }`}
                    >
                      {isAdmin && (
                        <td
                          className="py-3.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(lead.id);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </td>
                      )}
                      <td className="py-3.5 font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.businessName}</span>
                          {lead.isDoNotCall && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                              DNC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">{lead.phone}</td>
                      <td className="py-3.5 text-slate-400">{lead.category}</td>
                      <td className="py-3.5 text-slate-400">{lead.city || "Guwahati"}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium">
                        <span
                          className={`text-[11px] ${
                            lead.priority === "HOT"
                              ? "text-rose-400 font-bold"
                              : lead.priority === "WARM"
                              ? "text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {lead.assignedTo?.name || (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px] truncate max-w-xs">
                        {lastCall ? (
                          <span className="text-slate-300">{lastCall.outcome}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!lead.isDoNotCall && (
                            <a
                              href={getTelLink(lead.phone)}
                              onClick={() => setOutcomeModalLead(lead)}
                              className="p-1.5 rounded-lg bg-[#181C28] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-[#272E44] transition-colors"
                              title="Call Lead"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={getWhatsAppLink(lead.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#181C28] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-[#272E44] transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="p-1.5 rounded-lg bg-[#181C28] hover:bg-[#222738] text-slate-400 hover:text-white border border-[#272E44] transition-colors"
                            title="View 360 Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteLead(lead.id, lead.businessName)}
                              className="p-1.5 rounded-lg bg-[#181C28] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#272E44] transition-colors"
                              title="Delete lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban Pipeline View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {["NEW", "ASSIGNED", "INTERESTED", "MEETING_SCHEDULED"].map((colStatus) => {
            const colLeads = leads.filter((l) => l.status === colStatus);
            return (
              <div
                key={colStatus}
                className="p-4 rounded-xl bg-[#12141C] border border-[#1E2333] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2333] mb-3">
                  <span className="font-bold text-xs text-white">{colStatus}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#181C28] text-slate-300 text-[10px] font-mono border border-[#272E44]">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                  {colLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => router.push(`/leads/${l.id}`)}
                      className="p-3 rounded-xl bg-[#0D0F17] border border-[#1E2333] hover:border-slate-600 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="font-semibold text-xs text-white">{l.businessName}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">{l.phone}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>{l.category}</span>
                        <span className="font-medium">{l.assignedTo?.name || "Unassigned"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
