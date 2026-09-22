"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Edit2,
  AlertTriangle,
  Building2,
  Star,
  Phone,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/app-context";

export function AiImportModal() {
  const {
    isAiImportOpen,
    setAiImportOpen,
    setDuplicateModalData,
    triggerReload,
    user,
    allUsers,
  } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [assignedToId, setAssignedToId] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [extractionError, setExtractionError] = useState("");

  if (!isAiImportOpen) return null;

  const close = () => {
    setAiImportOpen(false);
    setImagePreview(null);
    setExtractedData(null);
    setDuplicateWarning(null);
    setIsEditing(false);
    setExtractionError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractionError("");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsAnalyzing(true);

      try {
        const res = await fetch("/api/ai/extract-screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name,
          }),
        });

        const data = await res.json();
        if (data.success && data.primary) {
          setExtractedData(data.primary.extracted);
          if (data.primary.duplicateFound) {
            setDuplicateWarning(data.primary.existingLead);
          } else {
            setDuplicateWarning(null);
          }
        } else {
          setImagePreview(null);
          setExtractionError(
            data.error ||
              "Could not analyze this screenshot. Please try again.",
          );
        }
      } catch (err) {
        console.error(err);
        setImagePreview(null);
        setExtractionError(
          "Network error while analyzing the screenshot. Check your connection and retry.",
        );
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateLead = async (forceAllow = false) => {
    if (!extractedData) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: extractedData.businessName,
          phone: extractedData.phone,
          category: extractedData.category,
          googleRating: extractedData.rating,
          reviewCount: extractedData.reviews,
          address: extractedData.address,
          city: extractedData.city || "Guwahati",
          state: extractedData.state || "Assam",
          pincode: extractedData.pincode,
          source: "Google Maps",
          priority: "HOT",
          status: "NEW",
          assignedToId:
            assignedToId ||
            (user?.role === "CALLING_EXECUTIVE" ? user.id : null),
          notes: `AI Imported from Google Maps Screenshot. Rating: ${extractedData.rating} (${extractedData.reviews} reviews)`,
          allowDuplicate: forceAllow,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicate) {
        // Trigger Duplicate Warning Modal
        setDuplicateModalData({
          existingLead: data.existingLead,
          onAddAnyway: () => handleCreateLead(true),
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
      alert("Error saving extracted lead");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-[#12141C] border border-[#272E44] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2333]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">
                AI Screenshot Import
              </h3>
              <p className="text-[11px] text-slate-400">
                Extract leads from Google Maps, Instagram, or business listings
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Upload area */}
          {!extractedData && !isAnalyzing ? (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-[#262C40] hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0D0F17]/50 group">
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors mb-3" />
                <div className="text-xs font-semibold text-white">
                  Drop screenshot here or click to browse
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports Google Maps business cards, listings, mobile
                  screenshots (.PNG, .JPG)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {extractionError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {extractionError}
                </div>
              )}
            </div>
          ) : null}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-spin">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                Analyzing Screenshot with AI...
              </div>
              <div className="text-xs text-slate-400">
                Extracting business name, rating, reviews, phone number, and
                address
              </div>
            </div>
          )}

          {/* Analyzed & Extracted Information */}
          {extractedData && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in">
              {/* Status Header Badge */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-400">
                      Screenshot analyzed
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Successfully extracted business lead data.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-2.5 py-1 rounded-lg bg-[#181C28] border border-[#2A3146] text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Done Editing" : "Edit"}</span>
                </button>
              </div>

              {/* Duplicate Warning if phone exists */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Duplicate Notice: </span>
                    Phone number already exists in your database (
                    {duplicateWarning.businessName} - {duplicateWarning.status}
                    ).
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDuplicateModalData({
                        existingLead: duplicateWarning,
                        onAddAnyway: () => handleCreateLead(true),
                      })
                    }
                    className="underline font-bold text-[11px] text-amber-300"
                  >
                    View Duplicate
                  </button>
                </div>
              )}

              {/* Editable Fields Card */}
              <div className="p-4 rounded-xl bg-[#0D0F17] border border-[#1E2333] space-y-3 text-xs">
                {isEditing ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={extractedData.businessName}
                        onChange={(e) =>
                          setExtractedData({
                            ...extractedData,
                            businessName: e.target.value,
                          })
                        }
                        className="w-full bg-[#12141C] border border-[#272E44] rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={extractedData.category}
                          onChange={(e) =>
                            setExtractedData({
                              ...extractedData,
                              category: e.target.value,
                            })
                          }
                          className="w-full bg-[#12141C] border border-[#272E44] rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={extractedData.phone}
                          onChange={(e) =>
                            setExtractedData({
                              ...extractedData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-[#12141C] border border-[#272E44] rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={extractedData.address}
                        onChange={(e) =>
                          setExtractedData({
                            ...extractedData,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-[#12141C] border border-[#272E44] rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 divide-y divide-[#1A1D28]">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-slate-400 font-medium">
                        Business Name
                      </span>
                      <span className="font-bold text-white text-sm">
                        {extractedData.businessName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Category</span>
                      <span className="text-slate-200">
                        {extractedData.category}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Rating & Reviews</span>
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{extractedData.rating}</span>
                        <span className="text-slate-400 font-normal">
                          ({extractedData.reviews} reviews)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {extractedData.phone}
                      </span>
                    </div>

                    <div className="flex justify-between items-start pt-2">
                      <span className="text-slate-400">Address</span>
                      <span className="text-slate-300 text-right max-w-xs">
                        {extractedData.address || "Guwahati, Assam"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Website</span>
                      <span className="text-slate-400 italic">
                        {extractedData.website || "Not found"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment (Admin only) */}
              {user?.role === "ADMIN" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Assign to Executive
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full bg-[#0B0D14] border border-[#1E2333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
            </div>
          )}
        </div>

        {/* Action Footer */}
        {extractedData && (
          <div className="p-4 bg-[#0B0D14] border-t border-[#1E2333] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setImagePreview(null);
              }}
              className="px-4 py-2.5 bg-[#171B26] hover:bg-[#202534] text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Upload Another
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleCreateLead(false)}
              className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black rounded-lg text-xs font-bold transition-all shadow active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>
                {isSaving ? "Saving..." : "+ Create Lead from This Data"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
