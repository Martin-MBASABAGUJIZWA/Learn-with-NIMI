"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { authedFetch } from "@/lib/authedFetch";

type Step = "loading" | "card" | "processing" | "success" | "error" | "tms_not_enabled";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateCardModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const init = async () => {
      try {
        // Get tokenize-only capture context (no payment taken)
        const ctxRes = await authedFetch("/api/account/payment-method", { method: "POST" });
        const ctxData = await ctxRes.json();
        if (!ctxRes.ok || !ctxData.captureContext) {
          if (!cancelledRef.current) { setStep("error"); setErrorMsg(ctxData.error ?? "Failed to initialize card form"); }
          return;
        }

        // Extract SDK URL from capture context JWT
        const jwtParts = (ctxData.captureContext as string).split(".");
        const ctx = JSON.parse(atob(jwtParts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const sdkUrl = ctx.ctx?.[0]?.data?.clientLibrary || ctx.ctx?.[0]?.clientLibrary;
        if (!sdkUrl) {
          if (!cancelledRef.current) { setStep("error"); setErrorMsg("Invalid payment session"); }
          return;
        }

        // Load CyberSource Unified Payments SDK
        const scriptId = "cybersource-up-sdk";
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId; script.src = sdkUrl; script.async = true;
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("SDK load failed"));
          });
        }

        if (cancelledRef.current) return;

        // Wait for Accept to be available
        for (let i = 0; i < 30; i++) {
          if (typeof (window as unknown as { Accept?: unknown }).Accept === "function") break;
          await new Promise(r => setTimeout(r, 100));
        }
        if (typeof (window as unknown as { Accept?: unknown }).Accept !== "function") {
          setStep("error");
          setErrorMsg("Payment SDK failed to initialize — please reload and try again");
          return;
        }

        const accept = await (window as any).Accept(ctxData.captureContext);
        const up = await accept.unifiedPayments(false);

        if (cancelledRef.current) return;
        setStep("card");
        await new Promise(r => setTimeout(r, 50));

        const transientToken = await up.show({
          containers: { paymentSelection: "#cs-pm-list", paymentScreen: "#cs-pm-form" },
        });
        if (!transientToken || cancelledRef.current) return;

        const completionJwt = await up.complete(transientToken);
        setStep("processing");

        const confirmRes = await authedFetch("/api/account/payment-method", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completionJwt }),
        });
        const result = await confirmRes.json();

        if (result.success) {
          setStep("success");
          setTimeout(() => { onSuccess(); onClose(); }, 2000);
        } else if (result.code === "TMS_NOT_ENABLED") {
          setStep("tms_not_enabled");
        } else {
          setStep("error");
          setErrorMsg(result.error ?? "Card update failed — please try resubscribing.");
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setStep("error");
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
      }
    };

    void init();
    return () => { cancelledRef.current = true; };
  }, [onClose, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-[var(--ds-surface-card)] w-full max-w-md shadow-2xl" style={{ borderRadius: "var(--leaf-r-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ds-border">
          <h2 className="font-black text-ds-text text-base">Update Payment Card</h2>
          <button aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--ds-surface-card-hover)] transition text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-ds-brand-primary" />
              <p className="text-sm text-ds-muted">Loading card form…</p>
            </div>
          )}

          {/* Card form (rendered by CyberSource SDK) */}
          {step === "card" && (
            <div>
              <p className="text-sm text-ds-muted mb-4">Enter your new card details. No charge will be made — this only updates your saved card for future renewals.</p>
              <div id="cs-pm-list" />
              <div id="cs-pm-form" />
            </div>
          )}

          {/* Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-ds-brand-primary" />
              <p className="text-sm font-bold text-ds-text">Saving your card…</p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="w-12 h-12 text-[var(--ds-brand-primary)]" />
              <p className="text-base font-black text-ds-text">Card updated!</p>
              <p className="text-sm text-ds-muted text-center">Your new card will be used for future renewals. Your subscription is now active.</p>
            </div>
          )}

          {/* TMS not enabled — show resubscribe path */}
          {step === "tms_not_enabled" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm mb-1">Card update not available</p>
                  <p className="text-amber-700 text-sml leading-relaxed">
                    Our payment system is not yet configured for card-on-file updates. The quickest fix is to resubscribe — it only takes a moment and your child's progress is saved.
                  </p>
                </div>
              </div>
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full py-3 bg-ds-brand-primary text-white font-black text-sm rounded-xl hover:opacity-90 transition"
                style={{ backgroundColor: "var(--ds-brand-primary)" }}
              >
                Resubscribe now <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={onClose} className="w-full text-xs text-ds-muted hover:text-ds-text transition text-center">
                Cancel
              </button>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 text-sm mb-1">Something went wrong</p>
                  <p className="text-red-600 text-sml leading-relaxed">{errorMsg ?? "Please try resubscribing from the pricing page."}</p>
                </div>
              </div>
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full py-3 font-black text-sm rounded-xl border-2 border-ds-brand-primary hover:bg-[var(--ds-brand-subtle)] transition text-ds-brand-primary"
                style={{ borderColor: "var(--ds-brand-primary)", color: "var(--ds-brand-primary)" }}
              >
                Resubscribe instead
              </a>
              <button onClick={onClose} className="w-full text-xs text-ds-muted hover:text-ds-text transition text-center">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
