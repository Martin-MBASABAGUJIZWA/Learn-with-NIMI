"use client";

import { Search, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type GalleryFilter = "all" | "art" | "coloring" | "story";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  filter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
}

export default function GalleryHeader({ search, onSearchChange, filter, onFilterChange }: Props) {
  const { t } = useLanguage();

  const tabs: { id: GalleryFilter; labelKey: string }[] = [
    { id: "all", labelKey: "filterAll" },
    { id: "art", labelKey: "filterArtwork" },
    { id: "coloring", labelKey: "filterColoring" },
    { id: "story", labelKey: "filterStories" },
  ];

  return (
    <div>
      <h1 className="font-black text-2xl sm:text-3xl text-ds-text">{t("communityGalleryTitle")}</h1>
      <p className="text-[var(--ds-text-secondary)] text-sm mt-1">{t("communityGallerySubtitle")}</p>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t("searchArtworkPlaceholder")}
            className="w-full bg-ds-input border border-ds-border rounded-full pl-9 pr-4 py-2 text-sm font-semibold text-ds-text placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-state-focus)] transition"
          />
        </div>

        <div className="inline-flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-colors ${
                filter === tab.id
                  ? "bg-[var(--ds-brand-primary)] text-white shadow"
                  : "border border-ds-border text-ds-text bg-[var(--ds-surface-card)] hover:bg-[var(--ds-surface-card)]"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--ds-surface-card)] border border-ds-border shadow-ds-card rounded-full px-4 py-2 text-sm font-bold text-ds-text shrink-0 sm:ml-auto">
          <span>{t("sortByNewest")}</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
