"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, RotateCcw, X } from "lucide-react";

type Range = "today" | "yesterday" | "lifetime" | "date";
const indiaDate = (offset = 0) => new Date(Date.now() + (offset * 24 + 5.5) * 3600000).toISOString().slice(0, 10);

export default function ActivityPage() {
  const [range, setRange] = useState<Range>("today");
  const [date, setDate] = useState(indiaDate());
  const [page, setPage] = useState(1);
  const [calls, setCalls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("range");
    if (value === "today" || value === "yesterday" || value === "lifetime" || value === "date") setRange(value);
    const selectedDate = params.get("date");
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) setDate(selectedDate);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (range !== "lifetime") params.set("date", range === "today" ? indiaDate() : range === "yesterday" ? indiaDate(-1) : date);
    try {
      const response = await fetch(`/api/calls/history?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setCalls(result.calls || []);
      setTotal(result.total || 0);
      setError("");
    } catch { setError("Could not load call history"); }
    finally { setLoading(false); }
  }, [range, date, page]);
  useEffect(() => { void load(); }, [load]);

  const selectRange = (value: Range) => { setRange(value); setPage(1); };
  const assignBack = async () => {
    const response = await fetch("/api/calls/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callId: selected.id, note }) });
    if (response.ok) { setSelected(null); setNote(""); setError(""); void load(); }
    else setError((await response.json()).error || "Could not assign callback");
  };

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><PhoneCall className="w-6 text-indigo-300"/>All Call History</h1><p className="mt-1 text-sm text-slate-400">Review executive calls, client summaries, proofs, and assign callbacks.</p></div>
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#26304A] bg-[#12141C] p-1">
        {(["today", "yesterday", "lifetime", "date"] as const).map((value) => <button key={value} type="button" onClick={() => selectRange(value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${range === value ? "bg-indigo-500 text-white" : "text-slate-400"}`}>{value === "date" ? "Pick date" : value}</button>)}
        {range === "date" && <input aria-label="History date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="rounded-lg border border-[#26304A] bg-[#0D0F17] px-2 py-1 text-xs text-white" />}
      </div>
    </div>
    <p className="text-sm text-slate-400">{total} call report{total === 1 ? "" : "s"} · {range === "date" ? date : range}</p>
    {error && <p className="text-sm text-rose-300">{error}</p>}
    <div className="space-y-3">{loading ? <p className="text-slate-400">Loading calls…</p> : calls.length ? calls.map((call) => <div key={call.id} className="rounded-xl border border-[#1E2333] bg-[#12141C] p-4"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><Link href={`/leads/${call.lead.id}`} className="font-bold text-indigo-300">{call.lead.businessName}</Link><span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px]">{call.outcome.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-slate-400">Called by {call.executive.name} · {new Date(call.callDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {call.lead.phone}</p><p className="mt-3 text-sm text-slate-200">{call.clientConversationSummary || call.notes || "No client note recorded."}</p><div className="mt-3 flex gap-2">{call.attachments.map((attachment: any) => <a key={attachment.id} href={`/api/evidence/${attachment.id}`} target="_blank" rel="noreferrer" className="rounded border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300">{attachment.type === "CALL_LOG" ? "Call proof" : "WhatsApp proof"}</a>)}</div></div><button onClick={() => { setSelected(call); setNote(""); setError(""); }} className="h-fit rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/10"><RotateCcw className="mr-1 inline w-3.5"/>Assign Back</button></div></div>) : <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No calls logged for this period.</p>}</div>
    {total > 200 && <div className="flex items-center justify-between text-sm"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#26304A] px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {Math.ceil(total / 200)}</span><button disabled={page * 200 >= total} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#26304A] px-3 py-2 disabled:opacity-40">Next</button></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center"><div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[#12141C] p-5"><div className="flex justify-between"><div><h2 className="font-bold">Assign back for callback</h2><p className="mt-1 text-sm text-slate-400">{selected.lead.businessName} will return to {selected.executive.name}&apos;s Home screen.</p></div><button onClick={() => setSelected(null)}><X/></button></div><label className="mt-5 block text-sm font-semibold">Why should they call again? *<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a clear callback instruction for the executive…" rows={4} className="mt-2 w-full rounded-lg border border-[#272E44] bg-[#0D0F17] p-3 text-sm"/></label>{error && <p className="mt-2 text-sm text-rose-300">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={() => setSelected(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={assignBack} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white">Assign Back</button></div></div></div>}
  </div>;
}
