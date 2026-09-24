"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const labels: Record<string, string> = {
  totalLeads: "Total Leads",
  callsToday: "Calls Today",
  connectedCalls: "Connected Calls",
  interestedLeads: "Interested Leads",
  followUpsToday: "Follow-Ups Due",
  meetingsBooked: "Meetings Booked",
  unassignedLeads: "Unassigned Leads",
};
const cardTone = [
  "text-blue-300",
  "text-emerald-300",
  "text-violet-300",
  "text-amber-300",
  "text-cyan-300",
  "text-fuchsia-300",
  "text-slate-300",
];
function when(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export default function AdminDashboard() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isLoading = useRef(false);
  const [showNotice, setShowNotice] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [adminReply, setAdminReply] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [notice, setNotice] = useState({
    title: "",
    message: "",
    priority: "NORMAL",
    requireAcknowledgement: false,
  });
  const load = useCallback(async () => {
    // Avoid stacking slow network requests when a manual refresh and the
    // 30-second background refresh happen close together.
    if (isLoading.current) return;
    isLoading.current = true;
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load dashboard.");
      setData(await response.json());
      setError("");
      setLastUpdated(new Date());
    } catch {
      setError("Could not load dashboard.");
    } finally {
      setRefreshing(false);
      isLoading.current = false;
    }
  }, []);
  useEffect(() => {
    void load();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [load]);
  async function sendNotice(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notice),
    });
    if (res.ok) {
      setNotice({
        title: "",
        message: "",
        priority: "NORMAL",
        requireAcknowledgement: false,
      });
      setShowNotice(false);
      load();
    } else setError("Could not send notice.");
  }
  async function resolveNote(id: string) {
    await fetch("/api/internal-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "RESOLVED" }),
    });
    load();
  }
  function openNote(note: any) {
    setSelectedNote(note);
    setAdminReply(note.adminReply || "");
  }
  async function saveReply() {
    if (!selectedNote || !adminReply.trim() || savingReply) return;
    setSavingReply(true);
    const response = await fetch("/api/internal-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedNote.id,
        status: "REPLIED",
        adminReply: adminReply.trim(),
      }),
    });
    setSavingReply(false);
    if (!response.ok) {
      setError("Could not save the reply.");
      return;
    }
    setSelectedNote(null);
    setAdminReply("");
    load();
  }
  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading dashboard…</p>;
  const Section = ({
    title,
    action,
    children,
  }: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <section className="rounded-2xl border border-[#1E2333] bg-[#12141C] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1E2333] px-5 py-3">
        <h2 className="font-bold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 animate-in fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Today&apos;s calling operations. Monitor real activity, proofs and
            follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden text-xs text-slate-500 sm:inline">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            ● Live operations
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {Object.entries(data.summary).map(([key, value], index) => (
          <div
            key={key}
            className="rounded-xl border border-[#26304A] bg-[#12141C] p-4"
          >
            <p className={`text-2xl font-bold ${cardTone[index]}`}>
              {String(value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{labels[key]}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)]">
        <Section
          title="Today’s Call Activity"
          action={
            <Link href="/activity" className="text-xs text-indigo-300">
              View all →
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-[#0D0F17] text-slate-400">
                <tr>
                  <th className="p-3">Executive</th>
                  <th>Lead / Business</th>
                  <th>Category</th>
                  <th>Time</th>
                  <th>Outcome</th>
                  <th>Client Summary</th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.length ? (
                  data.activity.map((item: any) => (
                    <tr key={item.id} className="border-t border-[#1E2333]">
                      <td className="p-3 font-medium">{item.executive.name}</td>
                      <td>
                        <Link
                          className="text-indigo-300"
                          href={`/leads/${item.lead.id}`}
                        >
                          {item.lead.businessName}
                        </Link>
                      </td>
                      <td className="text-slate-400">
                        {item.lead.category || "—"}
                      </td>
                      <td>{when(item.callDate)}</td>
                      <td>
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-200">
                          {item.outcome.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="max-w-[190px] truncate text-slate-300">
                        {item.clientConversationSummary || item.notes || "—"}
                      </td>
                      <td className="flex gap-1 py-2">
                        {item.attachments.map((a: any) => (
                          <a
                            key={a.id}
                            href={`/api/evidence/${a.id}`}
                            target="_blank"
                            className="rounded border border-emerald-500/30 px-2 py-1 text-emerald-300"
                          >
                            {a.type === "CALL_LOG"
                              ? "Call log ✓"
                              : "WhatsApp ✓"}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-slate-400">
                      No calls logged today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
        <Section
          title="Follow-Ups Due"
          action={
            <Link href="/follow-ups" className="text-xs text-indigo-300">
              View all →
            </Link>
          }
        >
          <div className="divide-y divide-[#1E2333]">
            {data.followUps.length ? (
              data.followUps.map((item: any) => (
                <div className="p-4 text-sm" key={item.id}>
                  <Link
                    className="font-medium text-white"
                    href={`/leads/${item.lead.id}`}
                  >
                    {item.lead.businessName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.executive.name} · {when(item.scheduledAt)}
                  </p>
                  <span className="mt-2 inline-block rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                    Pending
                  </span>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-slate-400">No follow-ups due.</p>
            )}
          </div>
        </Section>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Section title="Interested Leads">
          <div className="divide-y divide-[#1E2333]">
            {data.interested.length ? (
              data.interested.map((item: any) => (
                <div className="p-4 text-sm" key={item.id}>
                  <Link
                    href={`/leads/${item.id}`}
                    className="font-medium text-emerald-300"
                  >
                    {item.businessName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.category} · {item.assignedTo?.name || "Unassigned"}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {item.calls[0]?.notes || "No client requirement recorded."}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-slate-400">
                No interested leads yet.
              </p>
            )}
          </div>
        </Section>
        <Section title="Executive Notes / Issues">
          <div className="divide-y divide-[#1E2333]">
            {data.executiveNotes.length ? (
              data.executiveNotes.map((item: any) => (
                <div className="p-4 text-sm" key={item.id}>
                  <div className="flex justify-between gap-2">
                    <b>{item.sender.name}</b>
                    <button
                      type="button"
                      onClick={() => openNote(item)}
                      className={
                        item.status === "RESOLVED"
                          ? "text-xs font-semibold text-emerald-400 underline underline-offset-4"
                          : "text-xs font-semibold text-amber-300 underline underline-offset-4"
                      }
                    >
                      {item.status === "OPEN"
                        ? "Open"
                        : item.status.replaceAll("_", " ")}
                    </button>
                  </div>
                  <p className="mt-1 font-medium text-indigo-200">
                    {item.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {item.message}
                  </p>
                  {item.lead && (
                    <Link
                      href={`/leads/${item.lead.id}`}
                      className="mt-2 block text-xs text-indigo-300"
                    >
                      {item.lead.businessName}
                    </Link>
                  )}
                  {item.status !== "RESOLVED" && (
                    <button
                      onClick={() => resolveNote(item.id)}
                      className="mt-2 text-xs text-emerald-300"
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-slate-400">
                No executive notes or issues.
              </p>
            )}
          </div>
        </Section>
        <Section
          title="Notice Board"
          action={
            <button
              onClick={() => setShowNotice(true)}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              + New notice
            </button>
          }
        >
          <div className="divide-y divide-[#1E2333]">
            {data.notices.length ? (
              data.notices.map((item: any) => (
                <div className="p-4 text-sm" key={item.id}>
                  <div className="flex justify-between">
                    <b>{item.title}</b>
                    <span className="text-[10px] text-slate-400">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Read {item.receipts.filter((r: any) => r.readAt).length}/
                    {item.receipts.length} · Acknowledged{" "}
                    {item.receipts.filter((r: any) => r.acknowledgedAt).length}/
                    {item.receipts.length}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-slate-400">No notices sent.</p>
            )}
          </div>
        </Section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Executive Status">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0D0F17] text-left text-xs text-slate-400">
                <tr>
                  <th className="p-3">Executive</th>
                  <th>Calls today</th>
                  <th>Follow-ups</th>
                  <th>Meetings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.executiveStatus.map((item: any) => (
                  <tr key={item.id} className="border-t border-[#1E2333]">
                    <td className="p-3">{item.name}</td>
                    <td>{item._count.calls}</td>
                    <td>{item._count.followUps}</td>
                    <td>{item._count.meetings}</td>
                    <td
                      className={
                        item.status === "ACTIVE"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section
          title="Recent Proof Uploads"
          action={
            <Link href="/activity" className="text-xs text-indigo-300">
              View all →
            </Link>
          }
        >
          <div className="divide-y divide-[#1E2333]">
            {data.recentProofs.length ? (
              data.recentProofs.map((item: any) => (
                <div
                  className="flex items-center justify-between gap-3 p-3 text-sm"
                  key={item.id}
                >
                  <div>
                    <Link
                      href={`/leads/${item.lead.id}`}
                      className="text-indigo-300"
                    >
                      {item.lead.businessName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {item.type.replace("_", " ")} · {item.executive.name}
                    </p>
                  </div>
                  <a
                    href={`/api/evidence/${item.id}`}
                    target="_blank"
                    className="text-xs text-emerald-300"
                  >
                    View proof
                  </a>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-slate-400">
                No proof uploads yet.
              </p>
            )}
          </div>
        </Section>
      </div>
      {showNotice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <form
            onSubmit={sendNotice}
            className="w-full max-w-lg space-y-3 rounded-2xl border border-[#293042] bg-[#12141C] p-6"
          >
            <div className="flex justify-between">
              <h2 className="font-bold">
                Send notice to all active executives
              </h2>
              <button
                type="button"
                onClick={() => setShowNotice(false)}
                className="text-slate-400"
              >
                ×
              </button>
            </div>
            <input
              required
              value={notice.title}
              onChange={(e) => setNotice({ ...notice, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-3"
            />
            <textarea
              required
              value={notice.message}
              onChange={(e) =>
                setNotice({ ...notice, message: e.target.value })
              }
              placeholder="Instruction or announcement"
              rows={4}
              className="w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-3"
            />
            <select
              value={notice.priority}
              onChange={(e) =>
                setNotice({ ...notice, priority: e.target.value })
              }
              className="w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-3"
            >
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={notice.requireAcknowledgement}
                onChange={(e) =>
                  setNotice({
                    ...notice,
                    requireAcknowledgement: e.target.checked,
                  })
                }
              />{" "}
              Require acknowledgement
            </label>
            <button className="w-full rounded-lg bg-indigo-500 py-3 font-bold">
              Send notice
            </button>
          </form>
        </div>
      )}
      {selectedNote && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[#293042] bg-[#12141C] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Executive note
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  {selectedNote.subject}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  From {selectedNote.sender.name} ·{" "}
                  {when(selectedNote.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-xl border border-[#293042] bg-[#0D0F17] p-4 text-sm text-slate-200">
              {selectedNote.message}
            </p>
            {selectedNote.lead && (
              <Link
                href={`/leads/${selectedNote.lead.id}`}
                className="block text-sm text-indigo-300"
              >
                Open linked lead: {selectedNote.lead.businessName}
              </Link>
            )}
            <label className="block text-sm font-semibold">
              Reply to executive
              <textarea
                value={adminReply}
                onChange={(event) => setAdminReply(event.target.value)}
                rows={4}
                placeholder="Write your response..."
                className="mt-2 w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-3 font-normal"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              {selectedNote.status !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={async () => {
                    await resolveNote(selectedNote.id);
                    setSelectedNote(null);
                  }}
                  className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300"
                >
                  Mark resolved
                </button>
              )}
              <button
                type="button"
                disabled={!adminReply.trim() || savingReply}
                onClick={saveReply}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {savingReply ? "Saving..." : "Send reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
