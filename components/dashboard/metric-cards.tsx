"use client";

import React from "react";
import {
  Users,
  PhoneCall,
  Flame,
  Calendar,
  Handshake,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface MetricsProps {
  metrics: {
    totalLeads: number;
    totalLeadsDelta?: string;
    callsToday: number;
    callsTodayDelta?: string;
    callsConnected: number;
    interestedLeads: number;
    interestedLeadsDelta?: string;
    followUpsDue: number;
    followUpsDueDelta?: string;
    meetingsBooked: number;
    meetingsBookedDelta?: string;
    unassignedLeads: number;
    dealsWon: number;
  };
}

export function MetricCards({ metrics }: MetricsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: (metrics?.totalLeads ?? 0).toLocaleString(),
      subtext: "In database",
      icon: Users,
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Calls Today",
      value: (metrics?.callsToday ?? 0).toLocaleString(),
      subtext: `${metrics?.callsConnected ?? 0} connected`,
      icon: PhoneCall,
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Interested Leads",
      value: (metrics?.interestedLeads ?? 0).toLocaleString(),
      subtext: "High potential",
      icon: Flame,
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Follow-Ups Due",
      value: (metrics?.followUpsDue ?? 0).toLocaleString(),
      subtext: "Today / Overdue",
      icon: Calendar,
      iconBg: "bg-indigo-500/10 text-indigo-400",
    },
    {
      title: "Meetings Booked",
      value: (metrics?.meetingsBooked ?? 0).toLocaleString(),
      subtext: `${metrics?.dealsWon ?? 0} won`,
      icon: Handshake,
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Unassigned Leads",
      value: (metrics?.unassignedLeads ?? 0).toLocaleString(),
      subtext: "Needs executive",
      icon: UserX,
      iconBg: "bg-slate-500/10 text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-3.5 sm:p-4 rounded-xl bg-[#12141C] border border-[#1E2333] hover:border-[#272E44] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {card.title}
              </span>
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>

            <div className="mt-2.5 sm:mt-3">
              <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {card.value}
              </div>

              <div className="mt-0.5 sm:mt-1 text-[10px] text-slate-400 truncate">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
