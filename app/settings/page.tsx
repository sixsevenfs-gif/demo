"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Check,
  Phone,
  Building2,
  Shield,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";

export default function SettingsPage() {
  const { user } = useApp();
  const [agencyName, setAgencyName] = useState("");
  const [website, setWebsite] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [defaultCountryCode, setDefaultCountryCode] = useState("+91");
  const [dailyTarget, setDailyTarget] = useState("50");
  const [telephony, setTelephony] = useState("tel_protocol");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showClearData, setShowClearData] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState("");
  const [clearStatus, setClearStatus] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.agency_name)
            setAgencyName(data.settings.agency_name);
          if (data.settings.agency_website)
            setWebsite(data.settings.agency_website);
          if (data.settings.support_email)
            setSupportEmail(data.settings.support_email);
          if (data.settings.default_country_code)
            setDefaultCountryCode(data.settings.default_country_code);
          if (data.settings.default_daily_target)
            setDailyTarget(data.settings.default_daily_target);
          if (data.settings.telephony_provider)
            setTelephony(data.settings.telephony_provider);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: agencyName,
          agency_website: website,
          support_email: supportEmail,
          default_country_code: defaultCountryCode,
          default_daily_target: dailyTarget,
          telephony_provider: telephony,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearWorkspaceData = async () => {
    if (clearConfirmation !== "CLEAR DATA" || isClearing) return;
    setIsClearing(true);
    setClearStatus("");
    try {
      const response = await fetch("/api/settings/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: clearConfirmation }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not clear data.");
      setClearStatus(
        "All CRM data has been cleared. Login accounts and settings were kept.",
      );
      setClearConfirmation("");
      setShowClearData(false);
    } catch (error: any) {
      setClearStatus(error.message || "Could not clear data.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Agency Settings & Integrations</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure branding, outbound telephony gateways, default targets, and
          AI parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Agency Branding Card */}
        <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2333] pb-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Agency Profile & Branding</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Default Country Code
              </label>
              <input
                type="text"
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value)}
                className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-lg p-2.5 text-white"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-300" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Permanently remove all leads, calls, proof uploads, follow-ups,
            meetings, notices, notes and activity history. Admin/executive
            accounts and saved settings remain available.
          </p>
          {clearStatus && (
            <p
              className={
                clearStatus.startsWith("All")
                  ? "text-xs text-emerald-300"
                  : "text-xs text-rose-300"
              }
            >
              {clearStatus}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setClearStatus("");
              setShowClearData(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/50 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </button>
        </div>

        {/* Telephony Integration Card */}
        <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2333] pb-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Telephony & Calling Architecture</span>
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            The platform is built with modular telephony support. By default, it
            uses native device dialer links (`tel:`), enabling immediate
            zero-cost calling across mobile phones, tablets, and Mac FaceTime.
            Cloud telephony providers can be connected seamlessly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[
              {
                id: "tel_protocol",
                title: "Native tel: Link",
                desc: "Active & Ready. Zero config, works on any smartphone/laptop.",
              },
              {
                id: "exotel",
                title: "Exotel Cloud PBX",
                desc: "Indian enterprise virtual numbers and click-to-call API.",
              },
              {
                id: "twilio",
                title: "Twilio Voice",
                desc: "Global outbound voice SDK and programmable telephony.",
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setTelephony(item.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  telephony === item.id
                    ? "bg-[#1C2130] border-emerald-500 text-white"
                    : "bg-[#0D0F17] border-[#1E2333] text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-all shadow flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
      {showClearData && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-500/30 bg-[#12141C] p-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Clear all CRM data?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                This cannot be undone. Type{" "}
                <b className="text-rose-300">CLEAR DATA</b> to permanently
                remove all operational records and evidence.
              </p>
            </div>
            <input
              value={clearConfirmation}
              onChange={(event) => setClearConfirmation(event.target.value)}
              placeholder="CLEAR DATA"
              className="w-full rounded-lg border border-[#293042] bg-[#0D0F17] p-3 text-sm text-white"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearData(false);
                  setClearConfirmation("");
                }}
                className="rounded-lg border border-[#293042] px-4 py-2 text-sm font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmation !== "CLEAR DATA" || isClearing}
                onClick={clearWorkspaceData}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {isClearing ? "Clearing..." : "Permanently clear data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
