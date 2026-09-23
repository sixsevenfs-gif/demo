"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Search } from "lucide-react";

export default function ExecutiveResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch(`/api/resources?search=${encodeURIComponent(search)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setResources(data?.resources || []));
  }, [search]);
  const copy = (value: string) => navigator.clipboard.writeText(value);
  return <div className="mx-auto max-w-4xl space-y-5">
    <div><h1 className="text-2xl font-bold">Active Resources</h1><p className="mt-1 text-sm text-slate-400">Open or copy a demo, portfolio, pricing page, or other approved client link.</p></div>
    <div className="relative"><Search className="absolute left-3 top-3 w-4 text-slate-500"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resource, category, type or URL" className="w-full rounded-xl border border-[#272E44] bg-[#12141C] py-2.5 pl-9 text-sm"/></div>
    <div className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => <div key={resource.id} className="rounded-xl border border-[#1E2333] bg-[#12141C] p-4"><p className="font-bold">{resource.name}</p><p className="mt-1 text-xs text-indigo-300">{resource.category} · {resource.type}</p><p className="mt-3 min-h-10 text-sm text-slate-400">{resource.description || resource.url}</p><div className="mt-4 flex flex-wrap gap-2"><a href={resource.url} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black"><ExternalLink className="mr-1 inline w-3"/>Open link</a><button onClick={() => copy(resource.url)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs"><Copy className="mr-1 inline w-3"/>Copy link</button></div></div>)}</div>
    {!resources.length && <p className="rounded-xl border border-dashed border-slate-700 p-7 text-center text-slate-400">No active resources found.</p>}
  </div>;
}
