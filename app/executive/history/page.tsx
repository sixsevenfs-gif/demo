"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Phone, ChevronRight, Clock } from "lucide-react";

const callbackOutcome = (outcome: string) => outcome === "NO_ANSWER" || outcome === "CALL_LATER";

function Metric({ label, value, tone = "text-white", compact = false }: { label: string; value: number | undefined; tone?: string; compact?: boolean }) {
  return <div className={`rounded-xl ${compact ? "border border-[#293042] p-2" : "bg-[#0D0F17] p-3"} text-center`}><b className={compact ? "" : `text-lg ${tone}`}>{value ?? "—"}</b><p className="mt-1 text-[10px] text-slate-400">{label}</p></div>;
}

export default function ExecutiveHistory() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch("/api/leads?limit=100&includeCalls=all").then((response) => response.json()).then((data) => setLeads(data.leads || []));
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);
  useEffect(() => {
    fetch(`/api/calls/stats?date=${selectedDate}`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => data && setStats(data));
  }, [selectedDate]);

  const history = leads.flatMap((lead) => (lead.calls || []).map((call: any) => ({ ...call, lead }))).sort((a: any, b: any) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime());
  return <div className="mx-auto max-w-4xl"><h1 className="text-2xl font-bold">Call History</h1><p className="mt-1 text-sm text-slate-400">Review your previous calls, callbacks, and day-wise performance.</p>
    <section className="mt-5 rounded-2xl border border-[#1E2333] bg-[#12141C] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Call Performance</h2><p className="mt-1 text-xs text-slate-400">Select any date to see the saved call report for that day.</p></div><label className="text-xs text-slate-400">Check a date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="ml-2 rounded-lg border border-[#293042] bg-[#0D0F17] px-2 py-1.5 text-sm text-white" /></label></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Metric label="Today's calls" value={stats?.today.calls} tone="text-indigo-300" /><Metric label="Yesterday's calls" value={stats?.yesterday.calls} /><Metric label="Lifetime calls" value={stats?.lifetimeCalls} tone="text-emerald-300" /></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><Metric label="Calls" value={stats?.selected.calls} compact /><Metric label="Connected" value={stats?.selected.connected} compact /><Metric label="Interested" value={stats?.selected.interested} compact /><Metric label="Call later" value={stats?.selected.callbacks} compact /><Metric label="Meetings booked" value={stats?.selected.meetings} compact /></div></section>
    <div className="mt-5 space-y-3">{history.length ? history.map((call: any) => { const pending = callbackOutcome(call.outcome) && ["NO_ANSWER", "CALLBACK_REQUESTED"].includes(call.lead.status); const dueAt = call.lead.nextFollowUpDate ? new Date(call.lead.nextFollowUpDate) : null; const canCallBack = !dueAt || dueAt.getTime() <= now; return <div key={call.id} className={`rounded-xl border p-4 ${pending ? "border-rose-500/45 bg-rose-500/5" : "border-[#1E2333] bg-[#12141C]"}`}><div className="flex flex-col justify-between gap-3 sm:flex-row"><Link href={`/executive/leads/${call.lead.id}`} className="min-w-0"><div className="flex items-center gap-2"><b>{call.lead.businessName}</b><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pending ? "bg-rose-500 text-white" : "bg-[#272E44] text-slate-200"}`}>{call.outcome.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-slate-400">{new Date(call.callDate).toLocaleString()} · {call.clientConversationSummary || call.notes || "No note"}</p><p className="mt-2 text-xs text-indigo-300">View full call timeline <ChevronRight className="inline w-3" /></p></Link>{pending && <div className="shrink-0"><p className="mb-2 flex items-center gap-1 text-xs text-rose-300"><Clock className="w-3" />{dueAt ? `Callback ${canCallBack ? "due" : `available ${dueAt.toLocaleString()}`}` : "Callback required"}</p>{canCallBack ? <a href={`tel:${call.lead.phone}`} className="inline-flex rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white"><Phone className="mr-1 w-3.5" />Call back</a> : <button disabled className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-200 opacity-70">Call back locked</button>}</div>}</div></div>; }) : <p className="rounded-xl border border-[#1E2333] p-6 text-slate-400">No calls recorded yet.</p>}</div></div>;
}
