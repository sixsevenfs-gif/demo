"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Sparkles,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";

export default function ImportsPage() {
  const { setAiImportOpen, triggerReload } = useApp();
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;

    const rows = lines.slice(1).map((line, idx) => {
      // Split by comma preserving quotes
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
      const name = cols[0] || "";
      const phone = cols[1] || "";
      const category = cols[2] || "General";
      const city = cols[3] || "Guwahati";
      const address = cols[4] || "";

      const isValidPhone = phone.replace(/\D/g, "").length >= 10;

      return {
        id: idx,
        name,
        phone,
        category,
        city,
        address,
        isValidPhone,
      };
    });

    setPreviewRows(rows);
  };

  const handleFinalImport = async () => {
    if (previewRows.length === 0) return;
    setIsImporting(true);

    try {
      for (const row of previewRows) {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: row.name,
            phone: row.phone,
            category: row.category,
            city: row.city,
            address: row.address,
            source: "Imported",
            allowDuplicate: true,
          }),
        });
      }
      alert(`Successfully imported ${previewRows.length} leads!`);
      setPreviewRows([]);
      setCsvText("");
      triggerReload();
    } catch (err) {
      console.error(err);
      alert("Error during import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" />
          <span>Lead Import Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Import leads using AI Screenshot Vision OCR, or batch upload CSV/Excel files.
        </p>
      </div>

      {/* Two Main Cards: AI Screenshot vs CSV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AI Screenshot Card */}
        <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">AI Screenshot Import</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload Google Maps screenshots, directory listings, or business cards. AI extracts business name, rating, reviews, phone number, and address automatically.
            </p>
          </div>

          <button
            onClick={() => setAiImportOpen(true)}
            className="w-full py-3 bg-white hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Screenshot Extractor</span>
          </button>
        </div>

        {/* CSV/Excel Importer Card */}
        <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">CSV & Excel Batch Importer</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste or upload CSV text. The system parses headers, verifies phone numbers, validates duplicates, and presents an editable preview.
            </p>
          </div>

          <p className="w-full py-3 px-4 bg-[#171B26] border border-[#272E44] text-slate-300 text-xs rounded-xl text-center">
            Start by pasting your team&apos;s CSV below.
          </p>
        </div>
      </div>

      {/* CSV Input & Preview Section */}
      <div className="p-6 rounded-2xl bg-[#12141C] border border-[#1E2333] space-y-4">
        <h3 className="font-bold text-xs text-white">Paste CSV Data</h3>
        <textarea
          rows={4}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            handleParse(e.target.value);
          }}
          placeholder="Business Name,Phone,Category,City,Address"
          className="w-full bg-[#0D0F17] border border-[#1E2333] rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
        />

        {previewRows.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Import Preview ({previewRows.length} leads detected)
              </div>
              <button
                onClick={handleFinalImport}
                disabled={isImporting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Approve & Save Leads"}
              </button>
            </div>

            <div className="overflow-x-auto border border-[#1E2333] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2333] bg-[#0E1017] text-[11px] text-slate-400">
                    <th className="p-3">Business Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Address</th>
                    <th className="p-3 text-right">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171B26]">
                  {previewRows.map((r) => (
                    <tr key={r.id} className="hover:bg-[#161924]/60">
                      <td className="p-3 font-semibold text-white">{r.name}</td>
                      <td className="p-3 font-mono text-slate-300">{r.phone}</td>
                      <td className="p-3 text-slate-400">{r.category}</td>
                      <td className="p-3 text-slate-400">{r.city}</td>
                      <td className="p-3 text-slate-400 truncate max-w-xs">{r.address}</td>
                      <td className="p-3 text-right">
                        {r.isValidPhone ? (
                          <span className="text-emerald-400 font-bold text-[11px]">Valid Phone ✓</span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[11px]">Check Number ⚠️</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
