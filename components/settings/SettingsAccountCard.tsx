"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KeyRound, Trash2, ChevronRight, Crown, CheckCircle2, XCircle, Pencil, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getParent } from "@/lib/queries";
import { getActiveSubscription } from "@/lib/payments/products";
import type { Subscription } from "@/lib/payments/types";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";
import UpdateCardModal from "@/components/parents/UpdateCardModal";
import supabase from "@/lib/supabaseClient";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SettingsAccountCard() {
  const { t } = useLanguage();
  const [email, setEmail] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showUpdateCard, setShowUpdateCard] = useState(false);

  useEffect(() => {
    void (async () => {
      const [parent, { data: { user } }] = await Promise.all([
        getParent(),
        supabase.auth.getUser(),
      ]);
      setEmail(parent?.email ?? null);
      setParentName(parent?.name ?? null);
      if (user?.id) {
        const sub = await getActiveSubscription(user.id);
        setSubscription(sub);
      }
    })();
  }, []);

  function startEditName() {
    setNameInput(parentName ?? "");
    setNameError(null);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameError(null);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError("Name cannot be empty."); return; }
    if (trimmed === parentName) { setEditingName(false); return; }
    setSavingName(true);
    setNameError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingName(false); return; }
    const { error } = await supabase
      .from("parents")
      .upsert({ id: user.id, name: trimmed }, { onConflict: "id" });
    setSavingName(false);
    if (error) { setNameError("Could not save. Please try again."); return; }
    setParentName(trimmed);
    setEditingName(false);
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/account/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCancelError((body as { error?: string }).error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true } : null);
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="bg-[var(--ds-surface-card)] border border-ds-border shadow-ds-card p-4" style={{ borderRadius: 'var(--leaf-r)' }}>
      <h3 className="font-black text-ds-text mb-2">{t("accountTitle")}</h3>

      {/* Plan status */}
      <div className="mb-3 pb-3 border-b border-ds-border">
        {subscription?.status === "past_due" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sml text-ds-text">NIMIPIKO Club</span>
                  <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-3xs font-black px-1.5 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Payment failed
                  </span>
                </div>
                <p className="text-2xs text-red-500 mt-0.5 font-medium">
                  Your access is on hold — please update your payment to continue
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-0.5">
              <Link href="/pricing"
                className="flex-1 text-center py-1.5 text-2xs font-black text-white rounded-lg transition"
                style={{ backgroundColor: "var(--nimi-green, #22c55e)" }}>
                Resubscribe →
              </Link>
              {subscription?.payment_provider === "cybersource" && (
                <button
                  onClick={() => setShowUpdateCard(true)}
                  className="flex-1 py-1.5 text-2xs font-black text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition">
                  Update card
                </button>
              )}
            </div>
          </div>
        ) : subscription ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sml text-ds-text">NIMIPIKO Club</span>
                  <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-3xs font-black px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
                <p className="text-2xs text-[var(--ds-text-tertiary)] mt-0.5">
                  {subscription.cancel_at_period_end
                    ? `✓ Cancels ${formatDate(subscription.current_period_end)} — access until then`
                    : `Renews ${formatDate(subscription.current_period_end)}`}
                </p>
              </div>
            </div>
            {!subscription.cancel_at_period_end && !showCancelConfirm && (
              <button onClick={() => setShowCancelConfirm(true)}
                className="w-full text-2xs font-bold text-[var(--ds-text-tertiary)] hover:text-red-500 transition-colors text-left px-1">
                Cancel subscription
              </button>
            )}
            {showCancelConfirm && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-2">
                <p className="text-xs font-bold text-red-700">Cancel your NIMIPIKO Club?</p>
                <p className="text-2xs text-red-500">You&apos;ll keep access until {formatDate(subscription.current_period_end)}. Your child&apos;s progress is saved forever.</p>
                {cancelError && (
                  <p className="text-2xs font-bold text-red-600">{cancelError}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white font-bold text-2xs px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                    <XCircle className="w-3 h-3" /> {cancelling ? "Cancelling…" : "Yes, cancel"}
                  </button>
                  <button onClick={() => { setShowCancelConfirm(false); setCancelError(null); }}
                    className="text-2xs font-bold text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] px-3 py-1.5 transition">
                    Keep Club
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/pricing" className="flex items-center gap-3 hover:bg-yellow-50 rounded-lg transition px-1 -mx-1 py-2 group">
            <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sml text-ds-text block">Free Plan</span>
              <span className="text-2xs text-[var(--ds-text-tertiary)]">Upgrade for full story access</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ds-text-tertiary)] group-hover:text-yellow-500 transition-colors" />
          </Link>
        )}
      </div>

      {/* Display name */}
      <div className="flex items-center gap-3 py-3 border-b border-ds-border px-1 -mx-1">
        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <Pencil className="w-4 h-4 text-emerald-600" />
        </div>
        {editingName ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void saveName(); if (e.key === "Escape") cancelEditName(); }}
              placeholder="Your name"
              maxLength={80}
              className="flex-1 min-w-0 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ds-text focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            />
            <button onClick={() => void saveName()} disabled={savingName}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-60 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelEditName} disabled={savingName}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-ds-border hover:bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-secondary)] transition disabled:opacity-60 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-ds-text block">Display name</span>
              {nameError && <span className="text-2xs text-red-500 font-medium">{nameError}</span>}
              {!nameError && <span className="text-2xs text-[var(--ds-text-tertiary)]">{parentName ?? "Not set"}</span>}
            </div>
            <button onClick={startEditName}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--ds-surface-card-active)] text-[var(--ds-text-tertiary)] hover:text-emerald-600 transition shrink-0">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setShowPasswordModal(true)}
        className="flex items-center gap-3 py-3 border-b border-ds-border w-full text-left hover:bg-[var(--ds-surface-card-hover)] rounded-lg transition px-1 -mx-1"
      >
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <KeyRound className="w-4 h-4 text-blue-600" />
        </div>
        <span className="font-bold text-sm flex-1 text-ds-text">{t("changePasswordLabel")}</span>
        <ChevronRight className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
      </button>

      <button
        onClick={() => email && setShowDeleteModal(true)}
        disabled={!email}
        className="flex items-center gap-3 py-3 w-full text-left disabled:opacity-60 hover:bg-red-50 rounded-lg transition px-1 -mx-1"
      >
        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <Trash2 className="w-4 h-4 text-red-500" />
        </div>
        <span className="font-bold text-sm flex-1 text-red-600">{t("deleteAccountLabel")}</span>
        <ChevronRight className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
      </button>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showDeleteModal && email && <DeleteAccountModal email={email} onClose={() => setShowDeleteModal(false)} />}
      {showUpdateCard && (
        <UpdateCardModal
          onClose={() => setShowUpdateCard(false)}
          onSuccess={() => setSubscription(prev => prev ? { ...prev, status: "active" } : null)}
        />
      )}
    </div>
  );
}
