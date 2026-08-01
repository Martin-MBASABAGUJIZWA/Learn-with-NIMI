"use client";

import { useState } from "react";
import { Plane, Download, Loader2 } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface Props {
  childId: string;
  childName: string;
}

type DocKey = "kit" | "boarding-pass" | "passport";

const DOCS: { key: DocKey; label: string; emoji: string; desc: string }[] = [
  { key: "kit",          label: "Champion Kit",    emoji: "🧳", desc: "Full personalised kit with photo" },
  { key: "boarding-pass",label: "Boarding Pass",   emoji: "✈️", desc: "Airways boarding pass card"       },
  { key: "passport",     label: "Passport",        emoji: "📘", desc: "Nimipiko travel passport"         },
];

export default function AirwaysCard({ childId, childName }: Props) {
  const [loading, setLoading] = useState<Record<DocKey, boolean>>({ kit: false, "boarding-pass": false, passport: false });
  const [errors,  setErrors]  = useState<Record<DocKey, string | null>>({ kit: null, "boarding-pass": null, passport: null });

  async function download(key: DocKey) {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    try {
      // Prefer Bearer token when available; cookie auth handles the rest server-side
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(`/api/airways/${key}?childId=${childId}&format=pdf`, {
        headers,
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${childName.replace(/\s+/g, "_")}_${key}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrors(prev => ({ ...prev, [key]: e instanceof Error ? e.message : "Download failed" }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div
      className="bg-ds-card border border-ds-border shadow-ds-card p-5 space-y-4"
      style={{ borderRadius: "var(--leaf-r)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Plane className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-baloo font-black text-ds-text text-mlg leading-tight">
            Nimipiko Airways ✈️
          </h2>
          <p className="text-ds-text-secondary text-2xs font-nunito">
            {childName}&apos;s personalised travel documents
          </p>
        </div>
      </div>

      {/* Document buttons */}
      <div className="grid grid-cols-1 gap-2">
        {DOCS.map(doc => (
          <div key={doc.key} className="space-y-1">
            <button
              onClick={() => void download(doc.key)}
              disabled={loading[doc.key]}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl leading-none">{doc.emoji}</span>
                <div className="min-w-0">
                  <p className="font-baloo font-bold text-blue-900 text-sm leading-tight truncate">
                    {doc.label}
                  </p>
                  <p className="text-blue-500 text-2xs font-nunito truncate">{doc.desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-blue-600">
                {loading[doc.key]
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
              </div>
            </button>
            {errors[doc.key] && (
              <p className="text-red-500 text-2xs font-semibold px-1">{errors[doc.key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
