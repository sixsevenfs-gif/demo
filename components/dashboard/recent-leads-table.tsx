"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Edit, Users, MessageCircle } from "lucide-react";
import { getTelLink, getWhatsAppLink } from "@/lib/phone";
import { useApp } from "../context/app-context";

interface LeadItem {
  id: string;
  businessName: string;
  phone: string;
  whatsappNumber?: string | null;
  category: string;
  status: string;
  priority?: string;
  assignedTo?: { id: string; name: string } | null;
  lastCallDate?: string | Date | null;
  nextFollowUpDate?: string | Date | null;
  calls?: any[];
}

export function RecentLeadsTable({ leads }: { leads: LeadItem[] }) {
  const router = useRouter();
  const { setOutcomeModalLead, setQuickAddOpen } = useApp();

  const safeList = Array.isArray(leads) ? leads : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "INTERESTED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "NOT_INTERESTED":
        return "bg-slate-800 text-slate-400 border-slate-700";
      case "NEW":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "FOLLOW_UP":
      case "CALLBACK_REQUESTED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "WON":
        return "bg-emerald-500 text-black border-emerald-400 font-bold";
      case "DO_NOT_CALL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold";
      default:
        return "bg-[#181C28] text-slate-300 border-[#272E44]";
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#12141C] border border-[#1E2333]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-white">Recent Leads</h3>
        <Link
          href="/leads"
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>View All Database</span>
          <span className="text-slate-500">→</span>
        </Link>
      </div>

      {safeList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <Users className="w-6 h-6 mx-auto text-slate-600" />
          <div>No leads found in database</div>
          <div className="text-[10px] text-slate-600">
            Click Quick Add Lead or AI Import to add your first sales leads
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1A1E2B] text-[10px] sm:text-[11px] text-slate-400">
                <th className="pb-2.5 font-medium">Business Name</th>
                <th className="pb-2.5 font-medium">Phone</th>
                <th className="pb-2.5 font-medium">Category</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium">Assigned</th>
                <th className="pb-2.5 font-medium">Last Call</th>
                <th className="pb-2.5 font-medium">Next Callback</th>
                <th className="pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171B26]">
              {safeList.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="hover:bg-[#161924]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-semibold text-white group-hover:text-indigo-300 transition-colors truncate max-w-[160px]">
                    {lead.businessName}
                  </td>
                  <td className="py-3 font-mono text-slate-300">{lead.phone}</td>
                  <td className="py-3 text-slate-400 truncate max-w-[120px]">
                    {lead.category}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(
                        lead.status
                      )}`}
                    >
                      {lead.status === "INTERESTED"
                        ? "Interested"
                        : lead.status === "NOT_INTERESTED"
                        ? "Not Interested"
                        : lead.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-medium truncate max-w-[100px]">
                    {lead.assignedTo?.name || "Unassigned"}
                  </td>
                  <td className="py-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {lead.lastCallDate
                      ? new Date(lead.lastCallDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 text-[11px] whitespace-nowrap">
                    {lead.nextFollowUpDate ? (
                      <span className="text-rose-400 font-medium">
                        {new Date(lead.nextFollowUpDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={getTelLink(lead.phone)}
                        onClick={() => setOutcomeModalLead(lead)}
                        className="p-1.5 rounded-lg bg-[#181C28] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-[#272E44] transition-colors"
                        title="Call Lead"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-1.5 rounded-lg bg-[#181C28] hover:bg-[#222738] text-slate-400 hover:text-white border border-[#272E44] transition-colors"
                        title="View Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
