"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Clock, Phone } from "lucide-react";

type Period = "today" | "yesterday" | "lifetime" | "custom";
type CallRecord = {
  id: string;
  callDate: string;
  outcome: string;
  clientConversationSummary?: string | null;
  notes?: string | null;
  lead: {
    id: string;
    businessName: string;
    phone: string;
    status: string;
    nextFollowUpDate?: string | null;
  };
};
type DayStats = { date: string; calls: number; connected: number; interested: number; callbacks: number; meetings: number };
type Stats = {
  today: DayStats;
  yesterday: DayStats;
  selected: DayStats;
  lifetimeCalls: number;
};

function Metric({ label, value }: { label: string; value?: number }) {
  return <div className="rounded-xl border border-[#293042] p-2 text-center"><b>{value ?? "—"}</b><p className="mt-1 text-[10px] text-slate-400">{label}</p></div>;
}

export default function ExecutiveHistory() {
  const [stats, setStats] = useState<Stats>();
  const [period, setPeriod] = useState<Period>("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = selectedDate ? `?date=${selectedDate}` : "";
    fetch(`/api/calls/stats${query}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((value: Stats) => setStats(value))
      .catch(() => { if (!controller.signal.aborted) setError("Could not load call totals."); });
    return () => controller.abort();
  }, [selectedDate]);

  const activeDate = period === "today" ? stats?.today.date : period === "yesterday" ? stats?.yesterday.date : period === "custom" ? selectedDate : undefined;
  const loadCalls = useCallback(async (nextPage: number, signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(nextPage) });
      if (activeDate) query.set("date", activeDate);
      const response = await fetch(`/api/calls/history?${query}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error("Could not load call history.");
      const result = await response.json();
      if (signal?.aborted) return;
      setCalls((previous) => nextPage === 1 ? result.calls : [...previous, ...result.calls]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch {
      if (!signal?.aborted) setError("Could not load call history.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    // Wait for the server's India date before loading the default day.
    if (period !== "lifetime" && !activeDate) return;
    const controller = new AbortController();
    setCalls([]);
    setHasMore(false);
    void loadCalls(1, controller.signal);
    return () => controller.abort();
  }, [activeDate, loadCalls, period]);

  const cards: { period: Period; label: string; value?: number; tone: string }[] = [
    { period: "today", label: "Today's calls", value: stats?.today.calls, tone: "text-indigo-300" },
    { period: "yesterday", label: "Yesterday's calls", value: stats?.yesterday.calls, tone: "text-slate-100" },
    { period: "lifetime", label: "Lifetime calls", value: stats?.lifetimeCalls, tone: "text-emerald-300" },
  ];
  const heading = period === "lifetime" ? "All calls" : period === "today" ? "Today's calls" : period === "yesterday" ? "Yesterday's calls" : `Calls on ${selectedDate}`;
  const dayStats = period === "today" ? stats?.today : period === "yesterday" ? stats?.yesterday : stats?.selected;

  return <div className="mx-auto max-w-4xl">
    <h1 className="text-2xl font-bold">Call History</h1>
    <p className="mt-1 text-sm text-slate-400">Select a day or lifetime total to see its call details.</p>

    <section className="mt-5 rounded-2xl border border-[#1E2333] bg-[#12141C] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Call Performance</h2>
        <label className="text-xs text-slate-400">Check a date
          <input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); if (event.target.value) setPeriod("custom"); else setPeriod("today"); }} className="ml-2 rounded-lg border border-[#293042] bg-[#0D0F17] px-2 py-1.5 text-sm text-white" />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cards.map((card) => <button key={card.period} type="button" onClick={() => setPeriod(card.period)} aria-pressed={period === card.period} className={`rounded-xl border p-3 text-center transition-colors ${period === card.period ? "border-indigo-400 bg-indigo-500/15" : "border-transparent bg-[#0D0F17] hover:border-[#293042]"}`}>
          <b className={`text-lg ${card.tone}`}>{card.value ?? "—"}</b><p className="mt-1 text-[10px] text-slate-400">{card.label}</p>
        </button>)}
      </div>
      {period !== "lifetime" && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Calls" value={dayStats?.calls} />
        <Metric label="Connected" value={dayStats?.connected} />
        <Metric label="Interested" value={dayStats?.interested} />
        <Metric label="Call later" value={dayStats?.callbacks} />
        <Metric label="Meetings booked" value={dayStats?.meetings} />
      </div>}
    </section>

    <div className="mt-5 flex items-center justify-between"><h2 className="font-bold">{heading}</h2><span className="text-xs text-slate-400">{calls.length} shown</span></div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
    <div className="mt-3 space-y-3">{calls.length ? calls.map((call) => {
      const pending = (call.outcome === "NO_ANSWER" || call.outcome === "CALL_LATER") && ["NO_ANSWER", "CALLBACK_REQUESTED"].includes(call.lead.status);
      const dueAt = call.lead.nextFollowUpDate ? new Date(call.lead.nextFollowUpDate) : null;
      const canCallBack = !dueAt || dueAt.getTime() <= now;
      return <div key={call.id} className={`rounded-xl border p-4 ${pending ? "border-rose-500/45 bg-rose-500/5" : "border-[#1E2333] bg-[#12141C]"}`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <Link href={`/executive/leads/${call.lead.id}`} className="min-w-0"><div className="flex items-center gap-2"><b>{call.lead.businessName}</b><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pending ? "bg-rose-500 text-white" : "bg-[#272E44] text-slate-200"}`}>{call.outcome.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-slate-400">{new Date(call.callDate).toLocaleString()} · {call.clientConversationSummary || call.notes || "No note"}</p><p className="mt-2 text-xs text-indigo-300">View full call timeline <ChevronRight className="inline w-3" /></p></Link>
          {pending && <div className="shrink-0"><p className="mb-2 flex items-center gap-1 text-xs text-rose-300"><Clock className="w-3" />{dueAt ? `Callback ${canCallBack ? "due" : `available ${dueAt.toLocaleString()}`}` : "Callback required"}</p>{canCallBack ? <a href={`tel:${call.lead.phone}`} className="inline-flex rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white"><Phone className="mr-1 w-3.5" />Call back</a> : <button disabled className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-200 opacity-70">Call back locked</button>}</div>}
        </div>
      </div>;
    }) : !loading && !error && (period === "lifetime" || activeDate) ? <p className="rounded-xl border border-[#1E2333] p-6 text-slate-400">No calls recorded for {heading.toLowerCase()}.</p> : null}</div>
    {(loading || (period !== "lifetime" && !activeDate)) && <p className="mt-4 text-sm text-slate-400">Loading calls…</p>}
    {hasMore && !loading && <button type="button" onClick={() => void loadCalls(page + 1)} className="mt-4 w-full rounded-lg border border-[#293042] px-4 py-2 text-sm font-semibold">Load more calls</button>}
  </div>;
}
