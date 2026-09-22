"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Phone, Building2, User, MapPin, Tag } from "lucide-react";
import { useApp } from "../context/app-context";
import { normalizePhoneNumber } from "@/lib/phone";

export function QuickAddModal() {
  const {
    isQuickAddOpen,
    setQuickAddOpen,
    setDuplicateModalData,
    triggerReload,
    user,
    allUsers,
  } = useApp();

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [category, setCategory] = useState("Commercial Real Estate");
  const [city, setCity] = useState("Guwahati");
  const [address, setAddress] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [quickPasteText, setQuickPasteText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isQuickAddOpen) return null;

  const close = () => {
    setQuickAddOpen(false);
    setDuplicateAlert(null);
    setBusinessName("");
    setPhone("");
    setContactPerson("");
    setAddress("");
  };

  // Check phone duplicate on blur or change
  const handlePhoneBlur = async () => {
    if (!phone || phone.trim().length < 5) return;
    const norm = normalizePhoneNumber(phone);
    if (!norm) return;

    setIsChecking(true);
    try {
      const res = await fetch(`/api/leads/check-duplicate?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.exists) {
        setDuplicateAlert(data.lead);
      } else {
        setDuplicateAlert(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  // Quick Paste Parser (e.g. from WhatsApp, Google Maps text, or email)
  const handleParsePaste = () => {
    if (!quickPasteText) return;
    const lines = quickPasteText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      // First line is usually business name
      setBusinessName(lines[0]);
    }
    // Find phone number
    const phoneMatch = quickPasteText.match(/(\+?91[\-\s]?)?[0]?[6-9]\d{9}/);
    if (phoneMatch) {
      setPhone(phoneMatch[0]);
    }
    // Find potential address
    const addrLines = lines.slice(1).filter((l) => !l.match(/\d{10}/));
    if (addrLines.length > 0) {
      setAddress(addrLines.join(", "));
    }
    setShowPasteBox(false);
    setQuickPasteText("");
  };

  const handleSubmit = async (e: React.FormEvent, forceAllow = false) => {
    e.preventDefault();
    if (!phone && !businessName) {
      alert("Please provide at least a Phone Number or Business Name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || `Lead ${phone}`,
          phone,
          contactPerson,
          category,
          city,
          address,
          priority,
          assignedToId: assignedToId || (user?.role === "CALLING_EXECUTIVE" ? user.id : null),
          allowDuplicate: forceAllow,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicate) {
        // Trigger Duplicate Warning Modal
        setDuplicateModalData({
          existingLead: data.existingLead,
          onAddAnyway: () => handleSubmit(e, true),
        });
        return;
      }

      if (res.ok) {
        triggerReload();
        close();
      } else {
        alert(data.error || "Failed to create lead");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2333]">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <span>Quick Add Lead</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Instant lead creation with real-time phone duplicate verification
            </p>
          </div>
          <button
            onClick={close}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Paste Toggle */}
        <div className="px-5 pt-3">
          <button
            type="button"
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showPasteBox ? "Hide Smart Paste" : "Quick Paste Raw Text (Auto-Fill)"}</span>
          </button>

          {showPasteBox && (
            <div className="mt-2 p-3 bg-[#0C0E15] border border-[#1E2333] rounded-xl space-y-2 animate-in fade-in">
              <textarea
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder="Paste business details from WhatsApp, Google Maps, or message..."
                rows={3}
                className="w-full bg-[#12141C] border border-[#1E2333] rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
              >
                Auto-Extract Fields
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Duplicate Alert Banner */}
          {duplicateAlert && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start justify-between gap-2 text-xs text-amber-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Existing Lead Found with this number!</div>
                  <div className="text-[11px] text-slate-300">
                    {duplicateAlert.businessName} · Status: {duplicateAlert.status} · Assigned: {duplicateAlert.assignedTo}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDuplicateModalData({
                    existingLead: duplicateAlert,
                    onAddAnyway: () => handleSubmit({} as any, true),
                  });
                }}
                className="underline font-bold text-[11px] whitespace-nowrap text-amber-300"
              >
                View Details
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (duplicateAlert) setDuplicateAlert(null);
                  }}
                  onBlur={handlePhoneBlur}
                  placeholder="e.g. 06901301315 or 9876543210"
                  className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                {isChecking && (
                  <span className="absolute right-2.5 top-2 text-[10px] text-indigo-400 animate-pulse">
                    Checking...
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Business Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Real Estate Corner"
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Baruah"
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Commercial Real Estate"
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                City / Area
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Guwahati"
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Lead Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="HOT">Hot 🔥</option>
                <option value="WARM">Warm ⚡</option>
                <option value="NORMAL">Normal</option>
                <option value="COLD">Cold ❄️</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Full Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House No. 5, Purbanchal Path, Bormotoria, Guwahati 781006"
              className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {user?.role === "ADMIN" && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Assign Executive
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Leave Unassigned</option>
                {allUsers
                  .filter((u) => u.role === "CALLING_EXECUTIVE")
                  .map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#1E2333] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 bg-[#171B26] hover:bg-[#202534] text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-white hover:bg-slate-200 text-black rounded-lg text-xs font-bold transition-all shadow active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
