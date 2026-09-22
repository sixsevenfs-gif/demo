"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/components/context/app-context";

const outcomes = [
  ["INTERESTED", "Interested"],
  ["CALL_LATER", "Call Later"],
  ["MEETING_REQUIRED", "Meeting Required"],
  ["NO_ANSWER", "No Answer"],
  ["NOT_INTERESTED", "Not Interested"],
  ["WRONG_NUMBER", "Wrong Number"],
];
const buttons: Record<string, string> = {
  INTERESTED: "Save Interested Lead",
  CALL_LATER: "Schedule Callback",
  MEETING_REQUIRED: "Schedule Meeting",
  NO_ANSWER: "Save Call Attempt",
  NOT_INTERESTED: "Save as Not Interested",
  WRONG_NUMBER: "Mark Wrong Number",
};
const field =
  "w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-2.5 text-sm text-white";
const infoOptions = [
  "Pricing",
  "Services",
  "Portfolio",
  "Demo",
  "Company Details",
  "Other",
];
const sentOptions = [
  "Website Demo",
  "Portfolio",
  "Company Details",
  "Pricing Information",
  "Other",
];
const demoOptions = [
  "Website Demo",
  "Real Estate Demo",
  "Restaurant Demo",
  "Business Website Demo",
  "Other",
];
const notInterestedReasons = [
  "Not Required",
  "Already Has Website",
  "Already Has Agency / Developer",
  "No Budget",
  "Not Interested in Digital Services",
  "Not Decision Maker",
  "Asked Not to Contact Again",
  "Other",
];
const wrongReasons = [
  "Number belongs to someone else",
  "Number not in service",
  "Business number changed",
  "Person confirmed wrong business",
  "Other",
];

export default function ExecutiveDashboard() {
  const { user, isLoading } = useApp();
  const [data, setData] = useState<any>();
  const [outcome, setOutcome] = useState("");
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("11:00");
  const [followNote, setFollowNote] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("11:00");
  const [whatsapp, setWhatsapp] = useState(false);
  const [whatsappType, setWhatsappType] = useState("");
  const [whatsappNote, setWhatsappNote] = useState("");
  const [demoSent, setDemoSent] = useState(false);
  const [callLog, setCallLog] = useState<File | null>(null);
  const [whatsappProof, setWhatsappProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () =>
    fetch("/api/dashboard")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.replace("/login");
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((value) => {
        if (value) setData(value);
      })
      .catch(() =>
        setMessage(
          "Could not load your calling queue. Please refresh or sign in again.",
        ),
      );
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!isLoading && !user) window.location.replace("/login");
  }, [isLoading, user]);
  function choose(value: string) {
    setOutcome(value);
    setSummary("");
    setReason("");
    setFollowUp(value === "CALL_LATER");
    setFollowDate("");
    setFollowNote("");
    setMeetingDate("");
    setWhatsapp(false);
    setWhatsappType("");
    setWhatsappNote("");
    setWhatsappProof(null);
    setDemoSent(false);
    setMessage("");
  }
  function resetCallForm() {
    setOutcome("");
    setSummary("");
    setReason("");
    setFollowUp(false);
    setFollowDate("");
    setFollowTime("11:00");
    setFollowNote("");
    setMeetingDate("");
    setMeetingTime("11:00");
    setWhatsapp(false);
    setWhatsappType("");
    setWhatsappNote("");
    setWhatsappProof(null);
    setCallLog(null);
    setDemoSent(false);
  }
  async function save() {
    if (!data?.nextLead || saving) return;
    setSaving(true);
    setMessage("");
    const form = new FormData();
    const values: Record<string, string> = {
      leadId: data.nextLead.id,
      outcome,
      summary,
      outcomeReason: reason,
      followUpRequired: String(followUp),
      followUpDate: followDate,
      followUpTime: followTime,
      followUpNote: followNote,
      meetingDate,
      meetingTime,
      whatsappPerformed: String(whatsapp),
      whatsappSentType:
        outcome === "INTERESTED" && whatsapp ? "Website Demo" : whatsappType,
      whatsappNote,
      demoSent: String(demoSent),
    };
    Object.entries(values).forEach(([k, v]) => form.set(k, v));
    if (callLog) form.set("callLog", callLog);
    if (whatsappProof) form.set("whatsappProof", whatsappProof);
    const res = await fetch("/api/calls", { method: "POST", body: form });
    const result = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(result.error || "Could not save call result.");
      return;
    }
    resetCallForm();
    setMessage("Call report saved successfully.");
    void load();
  }
  const CallProof = () => (
    <label className="block text-sm font-semibold">
      Call Log Screenshot *
      <span className="block mt-1 text-xs font-normal text-amber-300">
        Upload a screenshot where the call duration/talk time is clearly
        visible.
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setCallLog(e.target.files?.[0] || null)}
        className={`${field} mt-2`}
      />
      {callLog && (
        <span className="mt-1 block text-xs text-emerald-400">
          Selected: {callLog.name}
        </span>
      )}
    </label>
  );
  const Summary = ({
    placeholder = "What did the client say?",
  }: {
    placeholder?: string;
  }) => (
    <label className="block text-sm font-semibold">
      Client Conversation Summary *
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={placeholder}
        className={`${field} mt-2`}
        rows={4}
      />
    </label>
  );
  const FollowFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">
          Follow-Up Date *
          <input
            type="date"
            value={followDate}
            onChange={(e) => setFollowDate(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Follow-Up Time *
          <input
            type="time"
            value={followTime}
            onChange={(e) => setFollowTime(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
      </div>
      <textarea
        value={followNote}
        onChange={(e) => setFollowNote(e.target.value)}
        placeholder="Follow-up note"
        className={field}
        rows={2}
      />
    </div>
  );
  const WhatsAppUpload = () => (
    <label className="block text-sm font-semibold">
      WhatsApp Screenshot *
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setWhatsappProof(e.target.files?.[0] || null)}
        className={`${field} mt-2`}
      />
    </label>
  );
  const YesNo = ({
    label,
    value,
    setValue,
  }: {
    label: string;
    value: boolean;
    setValue: (v: boolean) => void;
  }) => (
    <div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setValue(true)}
          className={`px-5 py-2 rounded-lg border ${value ? "border-indigo-400 bg-indigo-500/15" : "border-[#293042]"}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setValue(false)}
          className={`px-5 py-2 rounded-lg border ${!value ? "border-indigo-400 bg-indigo-500/15" : "border-[#293042]"}`}
        >
          No
        </button>
      </div>
    </div>
  );
  const select = (options: string[], placeholder: string) => (
    <select
      value={reason}
      onChange={(e) => setReason(e.target.value)}
      className={field}
    >
      <option value="">{placeholder}</option>
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
  function OutcomeForm() {
    if (!outcome) return null;
    const common = <CallProof />;
    if (outcome === "NO_ANSWER")
      return (
        <>
          <CallProof />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Attempt note (optional): Rang but no answer."
            className={field}
          />
          <YesNo
            label="Retry / Follow-Up?"
            value={followUp}
            setValue={setFollowUp}
          />
          {followUp && <FollowFields />}
        </>
      );
    if (outcome === "WRONG_NUMBER")
      return (
        <>
          {select(wrongReasons, "What happened? *")}
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Optional short note"
            className={field}
          />
          {common}
        </>
      );
    if (outcome === "NOT_INTERESTED")
      return (
        <>
          {select(notInterestedReasons, "Reason for Not Interested *")}
          {reason === "Asked Not to Contact Again" && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              This lead will be excluded from future calling queues.
            </p>
          )}
          <Summary />
          {common}
        </>
      );
    if (outcome === "CALL_LATER")
      return (
        <>
          <Summary placeholder="Owner was busy and asked me to call again after 5 PM." />
          {common}
          <FollowFields />
          <YesNo
            label="Did you send anything on WhatsApp?"
            value={whatsapp}
            setValue={setWhatsapp}
          />
          {whatsapp && (
            <>
              <select
                value={whatsappType}
                onChange={(e) => setWhatsappType(e.target.value)}
                className={field}
              >
                <option value="">What was sent? *</option>
                {sentOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <WhatsAppUpload />
            </>
          )}
        </>
      );
    if (outcome === "NEED_MORE_INFORMATION")
      return (
        <>
          <Summary />
          {common}
          {select(infoOptions, "What information does the client need? *")}
          <YesNo
            label="Did you send information on WhatsApp?"
            value={whatsapp}
            setValue={setWhatsapp}
          />
          {whatsapp && (
            <>
              <select
                value={whatsappType}
                onChange={(e) => setWhatsappType(e.target.value)}
                className={field}
              >
                <option value="">What was sent? *</option>
                {infoOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <WhatsAppUpload />
            </>
          )}
          <YesNo
            label="Follow-Up Needed?"
            value={followUp}
            setValue={setFollowUp}
          />
          {followUp && <FollowFields />}
        </>
      );
    if (outcome === "DEMO_REQUESTED")
      return (
        <>
          <Summary />
          {common}
          <select
            value={whatsappType}
            onChange={(e) => setWhatsappType(e.target.value)}
            className={field}
          >
            <option value="">Demo Type *</option>
            {demoOptions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <YesNo label="Demo Sent?" value={demoSent} setValue={setDemoSent} />
          {!demoSent && (
            <p className="text-amber-300 text-sm">
              This call will be saved as Demo Pending.
            </p>
          )}
          <WhatsAppUpload />
          <FollowFields />
        </>
      );
    if (outcome === "MEETING_REQUIRED")
      return (
        <>
          <Summary />
          {common}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className={field}
            />
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className={field}
            />
          </div>
          <textarea
            value={followNote}
            onChange={(e) => setFollowNote(e.target.value)}
            placeholder="Meeting note *"
            className={field}
          />
          <YesNo
            label="Was meeting information shared on WhatsApp?"
            value={whatsapp}
            setValue={setWhatsapp}
          />
          {whatsapp && (
            <>
              <input
                value={whatsappType}
                onChange={(e) => setWhatsappType(e.target.value)}
                placeholder="What was shared?"
                className={field}
              />
              <WhatsAppUpload />
            </>
          )}
        </>
      );
    return (
      <>
        <Summary />
        {common}
        <YesNo
          label="Demo sent on WhatsApp?"
          value={whatsapp}
          setValue={setWhatsapp}
        />
        {whatsapp && <WhatsAppUpload />}
        <YesNo
          label="Follow-Up Needed?"
          value={followUp}
          setValue={setFollowUp}
        />
        {followUp && <FollowFields />}
      </>
    );
  }
  if (!data)
    return <p className="text-slate-400">{message || "Loading your calls…"}</p>;
  const lead = data.nextLead;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Your calling workspace for today.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(data.progress).map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl bg-[#12141C] border border-[#1E2333] p-3 text-center"
          >
            <b>{String(v)}</b>
            <p className="text-[10px] text-slate-400 mt-1">
              {k.replace(/([A-Z])/g, " $1")}
            </p>
          </div>
        ))}
      </div>
      {message && !outcome && (
        <p className={message.includes("saved") ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>
          {message}
        </p>
      )}
      {lead ? (
        <section className="rounded-2xl border border-indigo-500/30 bg-[#12141C] p-5 space-y-5">
          <div>
            <p className="text-xs font-bold tracking-wider text-indigo-300">
              NEXT LEAD TO CALL
            </p>
            <h2 className="mt-2 text-xl font-bold">{lead.businessName}</h2>
            <p className="text-sm text-slate-400">
              {lead.category || "No category"} ·{" "}
              {[lead.area, lead.city].filter(Boolean).join(", ") ||
                "Location unavailable"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${lead.phone}`}
              className="rounded-xl bg-white py-3 text-center font-bold text-black"
            >
              Call {lead.phone}
            </a>
            <a
              href={`https://wa.me/${lead.normalizedPhone}`}
              target="_blank"
              className="rounded-xl border border-emerald-500/50 py-3 text-center font-bold text-emerald-300"
            >
              WhatsApp
            </a>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Call Result *</p>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map(([value, label]) => (
                <button
                  type="button"
                  onClick={() => choose(value)}
                  key={value}
                  className={`rounded-lg border px-3 py-2 text-sm ${outcome === value ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-[#293042] text-slate-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {outcome && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <OutcomeForm />
              {message && (
                <p
                  className={
                    message.includes("saved")
                      ? "text-emerald-400 text-sm"
                      : "text-rose-400 text-sm"
                  }
                >
                  {message}
                </p>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="w-full rounded-xl bg-indigo-500 py-3 font-bold disabled:opacity-60"
              >
                {saving ? "Saving evidence…" : buttons[outcome]}
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-[#1E2333] p-8 text-center">
          <p className="text-slate-300">You’re all caught up. No leads are currently available to call.</p>
          <div className="mt-4 flex justify-center gap-3">
            <a href="/executive/leads" className="rounded-lg border border-[#293042] px-4 py-2 text-sm font-semibold text-slate-200">
              View My Leads
            </a>
            <a href="/executive/follow-ups" className="rounded-lg border border-[#293042] px-4 py-2 text-sm font-semibold text-slate-200">
              View Follow-Ups
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
