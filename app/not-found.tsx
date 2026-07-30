"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full">
        <p className="text-8xl mb-4 select-none">🌿</p>
        <h1 className="font-baloo font-black text-4.5xl text-[var(--ds-text-primary)] leading-tight">
          404
        </h1>
        <p className="text-xl font-bold text-[var(--ds-text-secondary)] mt-1 mb-2">
          Nimi got lost in the jungle!
        </p>
        <p className="text-sm text-[var(--ds-text-tertiary)] mb-8">
          This page doesn&apos;t exist — but there are amazing stories waiting for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/stories"
            className="text-white font-black px-7 py-3.5 shadow-md transition text-mbase"
            style={{ backgroundColor: 'var(--nimi-green)', borderRadius: 'var(--leaf-r)' }}
          >
            📖 Back to Stories
          </Link>
          <Link
            href="/"
            className="bg-[var(--ds-surface-card)] border border-[var(--ds-border-primary)] text-[var(--ds-text-secondary)] font-bold px-7 py-3.5 hover:bg-[var(--ds-surface-card)] transition text-mbase"
            style={{ borderRadius: 'var(--leaf-r)' }}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
