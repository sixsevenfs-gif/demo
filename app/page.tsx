"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/context/app-context";
export default function Home() {
  const { user, isLoading } = useApp(); const router = useRouter();
  useEffect(() => { if (!isLoading && user) router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/executive/dashboard"); }, [user, isLoading, router]);
  return <div className="py-20 text-center text-slate-400">Opening workspace…</div>;
}
