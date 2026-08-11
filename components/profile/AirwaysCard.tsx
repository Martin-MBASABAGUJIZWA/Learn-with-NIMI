"use client";

import { useEffect, useState } from "react";
import { Plane, Download, Loader2, Music, BookOpen, Award, ChevronDown } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface Props {
  childId: string;
  childName: string;
  avatarUrl?: string | null;
}

interface StoryOption {
  slug: string | null;
  title: string;
  sort_order: number;
  is_complete: boolean;
}

// ── Classic documents (fixed params) ─────────────────────────────────────────
type ClassicKey = "kit" | "boarding-pass" | "passport" | "stamps" | "badge";

const CLASSIC_DOCS: {
  key: ClassicKey;
  label: string;
  emoji: string;
  desc: string;
  format?: "png" | "pdf";
  slow?: boolean;
}[] = [
  { key: "kit",          label: "Champion Kit",      emoji: "🧳", desc: "Personalised suitcase tag"         },
  { key: "boarding-pass",label: "Boarding Pass",     emoji: "✈️", desc: "Airways boarding pass card"        },
  { key: "passport",     label: "Passport",          emoji: "📘", desc: "Multi-page travel passport", slow: true },
  { key: "stamps",       label: "Stamp Collection",  emoji: "🗺️", desc: "Official collection of stamps"    },
  { key: "badge",        label: "Attitude Badge",    emoji: "🏅", desc: "Personalised attitude badge", format: "png", slow: true },
];

async function getHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function downloadBlob(url: string, filename: string, headers: HeadersInit) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `Error ${res.status}`);
  }
  const blob = await res.blob();
  const a    = Object.assign(document.createElement("a"), {
    href:     URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AirwaysCard({ childId, childName, avatarUrl }: Props) {
  const safeName = childName.replace(/\s+/g, "_");

  // ── Classic doc state ─────────────────────────────────────────────────────
  const [loadingC, setLoadingC] = useState<Record<ClassicKey, boolean>>({
    kit: false, "boarding-pass": false, passport: false, stamps: false, badge: false,
  });
  const [errorsC, setErrorsC] = useState<Record<ClassicKey, string | null>>({
    kit: null, "boarding-pass": null, passport: null, stamps: null, badge: null,
  });

  // ── New doc state ─────────────────────────────────────────────────────────
  type NewKey = "certificate" | "song" | "story-pdf";
  const [loadingN, setLoadingN] = useState<Record<NewKey, boolean>>({
    certificate: false, song: false, "story-pdf": false,
  });
  const [errorsN, setErrorsN] = useState<Record<NewKey, string | null>>({
    certificate: null, song: null, "story-pdf": null,
  });

  // ── Story picker for story-pdf ─────────────────────────────────────────────
  const [stories,      setStories]      = useState<StoryOption[]>([]);
  const [storiesLoaded,setStoriesLoaded]= useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadStories() {
      try {
        const h = await getHeaders();
        const res = await fetch(`/api/airways/stories?childId=${childId}`, { headers: h });
        if (!res.ok) return;
        const { stories: list } = await res.json() as { stories: StoryOption[] };
        if (cancelled) return;
        setStories(list ?? []);
        const first = list?.find(s => s.is_complete && s.slug) ?? list?.[0];
        if (first?.slug) setSelectedSlug(first.slug);
      } catch { /* silent */ } finally {
        if (!cancelled) setStoriesLoaded(true);
      }
    }
    loadStories();
    return () => { cancelled = true; };
  }, [childId]);

  // ── Classic download ──────────────────────────────────────────────────────
  async function downloadClassic(key: ClassicKey) {
    setLoadingC(p => ({ ...p, [key]: true }));
    setErrorsC(p => ({ ...p, [key]: null }));
    try {
      const fmt  = CLASSIC_DOCS.find(d => d.key === key)?.format ?? "pdf";
      const h    = await getHeaders();
      await downloadBlob(
        `/api/airways/${key}?childId=${childId}&format=${fmt}`,
        `${safeName}_${key}.${fmt}`,
        h,
      );
    } catch (e) {
      setErrorsC(p => ({ ...p, [key]: e instanceof Error ? e.message : "Download failed" }));
    } finally {
      setLoadingC(p => ({ ...p, [key]: false }));
    }
  }

  // ── New doc download ──────────────────────────────────────────────────────
  async function downloadNew(key: NewKey) {
    setLoadingN(p => ({ ...p, [key]: true }));
    setErrorsN(p => ({ ...p, [key]: null }));
    try {
      const h = await getHeaders();
      let apiUrl: string;
      let filename: string;

      if (key === "certificate") {
        apiUrl   = `/api/airways/certificate?childId=${childId}&format=pdf`;
        filename = `${safeName}_certificat.pdf`;
      } else if (key === "song") {
        apiUrl   = `/api/airways/song?childId=${childId}`;
        filename = `${safeName}_chanson.mp3`;
      } else {
        if (!selectedSlug) throw new Error("Veuillez sélectionner une histoire.");
        apiUrl   = `/api/airways/story-pdf?childId=${childId}&storySlug=${encodeURIComponent(selectedSlug)}`;
        filename = `${safeName}_histoire_${selectedSlug}.pdf`;
      }

      await downloadBlob(apiUrl, filename, h);
    } catch (e) {
      setErrorsN(p => ({ ...p, [key]: e instanceof Error ? e.message : "Download failed" }));
    } finally {
      setLoadingN(p => ({ ...p, [key]: false }));
    }
  }

  const completedStories = stories.filter(s => s.is_complete && s.slug);

  return (
    <div
      className="bg-ds-card border border-ds-border shadow-ds-card p-5 space-y-5"
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

      {/* ── No-photo nudge — only shown when avatar is missing ──────────── */}
      {!avatarUrl && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-100">
          <span className="text-base leading-none mt-0.5">📸</span>
          <p className="text-amber-800 text-2xs font-nunito leading-snug">
            <span className="font-bold">Add {childName}&apos;s photo</span> to get fully personalised documents — boarding pass, passport, badge and kit will include their picture.
          </p>
        </div>
      )}

      {/* ── Classic documents ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {CLASSIC_DOCS.map(doc => (
          <div key={doc.key}>
            <button
              onClick={() => void downloadClassic(doc.key)}
              disabled={loadingC[doc.key]}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl leading-none">{doc.emoji}</span>
                <div className="min-w-0">
                  <p className="font-baloo font-bold text-blue-900 text-sm leading-tight truncate">
                    {doc.label}
                    {doc.slow && <span className="ml-1 text-blue-400 text-2xs font-normal">~30s</span>}
                  </p>
                  <p className="text-blue-500 text-2xs font-nunito truncate">{doc.desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-blue-600">
                {loadingC[doc.key]
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
              </div>
            </button>
            {errorsC[doc.key] && (
              <p className="text-red-500 text-2xs font-semibold px-1 mt-0.5">{errorsC[doc.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Premium section divider ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-ds-border" />
        <span className="text-2xs font-semibold text-ds-muted uppercase tracking-wider">Premium</span>
        <div className="flex-1 h-px bg-ds-border" />
      </div>

      {/* ── Certificate ─────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => void downloadNew("certificate")}
          disabled={loadingN.certificate}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Award className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-baloo font-bold text-amber-900 text-sm leading-tight">
                Certificat Champion
              </p>
              <p className="text-amber-500 text-2xs font-nunito">
                Certificat personnalisé avec photo
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-amber-600">
            {loadingN.certificate
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
          </div>
        </button>
        {errorsN.certificate && (
          <p className="text-red-500 text-2xs font-semibold px-1 mt-0.5">{errorsN.certificate}</p>
        )}
      </div>

      {/* ── Song ────────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => void downloadNew("song")}
          disabled={loadingN.song}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 disabled:opacity-50 transition text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Music className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-baloo font-bold text-purple-900 text-sm leading-tight">
                Chanson personnalisée
              </p>
              <p className="text-purple-500 text-2xs font-nunito">
                La chanson de {childName} au format audio
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-purple-600">
            {loadingN.song
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
          </div>
        </button>
        {errorsN.song && (
          <p className="text-red-500 text-2xs font-semibold px-1 mt-0.5">{errorsN.song}</p>
        )}
      </div>

      {/* ── Personalized story PDF ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--ds-text-brand)] flex-shrink-0" />
          <p className="font-baloo font-bold text-[var(--ds-text-primary)] text-sm">Histoire personnalisée (PDF)</p>
        </div>

        {/* Story picker */}
        {storiesLoaded && (
          completedStories.length > 0 ? (
            <div className="relative">
              <select
                value={selectedSlug}
                onChange={e => setSelectedSlug(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-border-brand)]/40"
              >
                {completedStories.map(s => (
                  <option key={s.slug} value={s.slug!}>
                    Livre {s.sort_order} — {s.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-brand)] pointer-events-none" />
            </div>
          ) : (
            <p className="text-ds-muted text-2xs font-nunito px-1">
              Complete a story to unlock your personalised PDF.
            </p>
          )
        )}

        {completedStories.length > 0 && (
          <>
            <button
              onClick={() => void downloadNew("story-pdf")}
              disabled={loadingN["story-pdf"] || !selectedSlug}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[var(--ds-brand-subtle)] hover:bg-[var(--ds-brand-soft)] disabled:opacity-50 transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl leading-none">📖</span>
                <div className="min-w-0">
                  <p className="font-baloo font-bold text-[var(--ds-text-primary)] text-sm leading-tight">
                    Télécharger l&apos;histoire
                  </p>
                  <p className="text-[var(--ds-text-secondary)] text-2xs font-nunito">
                    Version avec la photo de {childName}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-[var(--ds-text-brand)]">
                {loadingN["story-pdf"]
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
              </div>
            </button>
            {errorsN["story-pdf"] && (
              <p className="text-red-500 text-2xs font-semibold px-1">{errorsN["story-pdf"]}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
