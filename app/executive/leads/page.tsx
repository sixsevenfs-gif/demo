"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function MyLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState("");
  const loadLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads?limit=100", {
        cache: "no-store",
      });
      if (response.status === 401)
        return void window.location.replace("/login");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setLeads(data.leads || []);
      setError("");
    } catch {
      setError(
        "Could not load your assigned leads. Please refresh and try again.",
      );
    }
  }, []);

  useEffect(() => {
    void loadLeads();
    const refreshTimer = window.setInterval(() => void loadLeads(), 15_000);
    const refreshOnFocus = () => void loadLeads();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [loadLeads]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">My Leads</h1>
      <p className="mt-1 text-sm text-slate-400">
        Assigned leads are read-only. New assignments appear automatically.
      </p>
      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}
      <div className="mt-5 grid gap-3">
        {leads.length ? (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-[#1E2333] bg-[#12141C] p-4"
            >
              <b>{lead.businessName}</b>
              <p className="mt-1 text-sm text-slate-400">
                {lead.category} · {lead.status}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  className="rounded-lg border border-indigo-400/50 px-3 py-2 text-sm text-indigo-200"
                  href={`/executive/leads/${lead.id}`}
                >
                  View read-only record
                </Link>
                <a
                  className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black"
                  href={`tel:${lead.phone}`}
                >
                  Call
                </a>
                <a
                  className="rounded-lg border border-emerald-500/50 px-3 py-2 text-sm text-emerald-300"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${lead.normalizedPhone}`}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="mt-5 rounded-xl border border-[#1E2333] p-6 text-slate-400">
            No leads have been assigned to you yet.
          </p>
        )}
      </div>
    </div>
  );
}
