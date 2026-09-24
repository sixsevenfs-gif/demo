"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  PhoneCall,
  Flame,
  Handshake,
  Target,
  CheckCircle,
  X,
  Lock,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";

export default function ExecutivesPage() {
  const { user, reloadKey, refreshUser } = useApp();
  const [executives, setExecutives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Executive Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [dailyTarget, setDailyTarget] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExecutives = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/executives");
      if (res.ok) {
        const json = await res.json();
        setExecutives(json.executives || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutives();
  }, [reloadKey]);

  const handleCreateExecutive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/executives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, dailyTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsCreateOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        fetchExecutives();
      } else {
        alert(data.error || "Failed to create executive");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (executive: any) => {
    const nextStatus = executive.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const label = nextStatus === "INACTIVE" ? "disable" : "activate";
    if (!window.confirm(`Do you want to ${label} ${executive.name}?`)) return;
    const response = await fetch("/api/executives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: executive.id, status: nextStatus }),
    });
    if (response.ok) {
      await Promise.all([fetchExecutives(), refreshUser()]);
    }
    else {
      const data = await response.json();
      alert(data.error || "Could not update executive status.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Calling Executives & Performance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor calling targets, connection rates, and manage team accounts.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Create Calling Executive</span>
          </button>
        )}
      </div>

      {/* Executives List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {executives.map((exec) => {
          const targetPercent = Math.min(100, Math.round((exec.callsToday / (exec.dailyTarget || 50)) * 100));

          return (
            <div
              key={exec.id}
              className="p-5 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center justify-center">
                    {exec.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{exec.name}</h3>
                    <div className="text-[11px] text-slate-400">{exec.email}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${exec.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                  {exec.status}
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2333] bg-[#0D0F17] px-3 py-2 text-xs">
                <span className="text-slate-400">Last login: </span>
                <span className="font-medium text-slate-200">
                  {exec.lastLoginAt ? new Date(exec.lastLoginAt).toLocaleString() : "Never logged in"}
                </span>
              </div>

              {/* Target Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Daily Target</span>
                  </span>
                  <span className="font-mono text-white font-bold">
                    {exec.callsToday} / {exec.dailyTarget || 50} calls ({targetPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#0D0F17] overflow-hidden">
                  <div
                    style={{ width: `${targetPercent}%` }}
                    className="h-full bg-indigo-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E2333] text-center">
                <div className="p-2 rounded-lg bg-[#0D0F17] border border-[#1E2333]">
                  <div className="text-[10px] text-slate-400">Connected</div>
                  <div className="text-sm font-bold text-white mt-0.5">{exec.connected}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0D0F17] border border-[#1E2333]">
                  <div className="text-[10px] text-slate-400">Interested</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{exec.interested}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0D0F17] border border-[#1E2333]">
                  <div className="text-[10px] text-slate-400">Rate</div>
                  <div className="text-sm font-bold text-indigo-400 mt-0.5">{exec.connectionRate}</div>
                </div>
              </div>
              <button
                onClick={() => handleStatusChange(exec)}
                className={`w-full rounded-lg border py-2 text-xs font-bold transition-colors ${exec.status === "ACTIVE" ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10" : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"}`}
              >
                {exec.status === "ACTIVE" ? "Disable Executive" : "Activate Executive"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Executive Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2333]">
              <h3 className="font-bold text-sm text-white">Create Calling Executive</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExecutive} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@dudewebagency.in"
                  className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Temporary Password</label>
                <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg p-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Daily Call Target</label>
                <input
                  type="number"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-[#1E2333] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-[#171A26] text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-white text-black font-bold rounded-lg text-xs"
                >
                  {isSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
