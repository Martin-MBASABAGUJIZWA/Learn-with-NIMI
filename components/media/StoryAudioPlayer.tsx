"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeMotion } from "@/hooks/useThemeMotion";
import { DURATION } from "@/lib/design-system/motion";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { getStorageUrl } from "@/lib/queries";

interface Props {
  url: string | null | undefined;
  title?: string;
  subtitle?: string;
  color?: string;
  onEnded?: () => void;
}

export default function StoryAudioPlayer({ url, title, subtitle, color = "bg-[var(--ds-brand-primary)]", onEnded }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<number>(0);
  const m = useThemeMotion();

  // R4: compute random bar values once to avoid re-generating on every render
  const barValues = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      height: 12 + Math.random() * 12,
      duration: DURATION.slow + Math.random() * DURATION.moderate,
    })),
    []
  );

  useEffect(() => {
    return () => { clearInterval(intervalRef.current); ref.current?.pause(); };
  }, []);

  if (!url) {
    return (
      <div className="leaf border border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] p-6 shadow-card-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center leaf bg-[var(--ds-surface-card)] shadow-sm text-2xl shrink-0">
            <Sparkles className="h-6 w-6 text-[var(--ds-text-brand)]" />
          </div>
          <div>
            <p className="text-[var(--ds-text-primary)] text-sm font-black">Coming Soon</p>
            {title && <p className="text-[var(--ds-text-secondary)] text-3xs mt-0.5">{title}</p>}
          </div>
        </div>
      </div>
    );
  }

  const src = url.startsWith("http") ? url : getStorageUrl(url);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
      clearInterval(intervalRef.current);
    } else {
      ref.current.play().catch(() => {});
      setPlaying(true);
      intervalRef.current = window.setInterval(() => {
        if (ref.current) {
          setProgress(ref.current.currentTime);
          setDuration(ref.current.duration || 0);
        }
      }, 200);
    }
  };

  const restart = () => {
    if (!ref.current) return;
    ref.current.currentTime = 0;
    setProgress(0);
    if (!playing) toggle();
  };

  return (
    <div className="leaf border border-[var(--ds-border-brand)] bg-[var(--ds-brand-subtle)] p-5 shadow-card-2xl">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => { if (ref.current) setDuration(ref.current.duration); }}
        onEnded={() => { setPlaying(false); clearInterval(intervalRef.current); onEnded?.(); }}
      />

      <div className="flex items-center gap-4">
        {/* A2: accessible label for Play/Pause button */}
        <motion.button whileTap={m.dangerPress} onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className={`w-14 h-14 ${color} flex items-center justify-center text-white shadow-lg shrink-0 ring-4 ring-white/60`}
          style={{ borderRadius: 'var(--leaf-r)' }}>
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </motion.button>

        <div className="flex-1 min-w-0">
          {title && <p className="font-black text-ds-text text-sml truncate">{title}</p>}
          {subtitle && <p className="text-[var(--ds-text-secondary)] text-3xs truncate">{subtitle}</p>}

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-[var(--ds-surface-card)]/80 rounded-full h-[6px] overflow-hidden border border-[var(--ds-border-brand)]">
              <motion.div
                className={`${color} h-full rounded-full`}
                style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-[var(--ds-text-secondary)] text-4xs font-bold tabular-nums shrink-0">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Restart */}
        <button onClick={restart}
          className="w-10 h-10 rounded-full bg-[var(--ds-surface-card)]/80 border border-[var(--ds-border-brand)] flex items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-brand)] transition shrink-0 shadow-sm">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* M17: wrap waveform bars in AnimatePresence so they exit cleanly */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key="waveform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="flex items-end justify-center gap-[2px] mt-3 h-6"
          >
            {barValues.map((bar, i) => (
              <motion.div key={i}
                className={`w-[3px] rounded-full ${color} opacity-40`}
                animate={{ height: [4, bar.height, 4] }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: bar.duration, repeat: Infinity, delay: i * 0.05 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
