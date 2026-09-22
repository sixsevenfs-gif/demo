"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error || "Unable to sign in.");
        return;
      }
      const { user } = await response.json();
      router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/executive/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090A0F] text-slate-100 grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#1E2333] bg-[#12141C] p-6 space-y-5 shadow-2xl">
        <div>
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Use your organization account to access the lead workspace.</p>
        </div>
        <label className="block text-sm">Email
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#293042] bg-[#0D0F17] px-3 py-2.5 text-white outline-none focus:border-indigo-500" />
        </label>
        <label className="block text-sm">Password
          <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#293042] bg-[#0D0F17] px-3 py-2.5 text-white outline-none focus:border-indigo-500" />
        </label>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-black disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
