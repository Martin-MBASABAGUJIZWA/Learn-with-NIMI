"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { authedFetch } from "@/lib/authedFetch";

interface HealthData {
  tms: {
    likely_enabled: boolean;
    recent_cs_payments: number;
    with_token: number;
    without_token: number;
  };
  past_due_count: number;
  stale_order_count: number;
  recent_renewals: Array<{
    status: string;
    attempt_number: number;
    error_message: string | null;
    created_at: string;
  }>;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

function WarnBadge({ count, label }: { count: number; label: string }) {
  if (count === 0) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> {label}: 0
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <AlertTriangle className="w-3 h-3" /> {label}: {count}
    </span>
  );
}

export default function PaymentHealthManager() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/payment-health");
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Payment Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">CyberSource TMS status, renewal health, and ops checklist</p>
        </div>
        <button onClick={() => void load()} disabled={loading}
          className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:text-gray-800 transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="space-y-5">
          {/* TMS Status */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-[14px]">Token Management Service (TMS)</h2>
              <StatusBadge ok={data.tms.likely_enabled} label={data.tms.likely_enabled ? "Likely enabled" : "Not detected"} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-black text-gray-800">{data.tms.recent_cs_payments}</p>
                <p className="text-[11px] text-gray-500">Recent CS payments</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-2xl font-black text-green-700">{data.tms.with_token}</p>
                <p className="text-[11px] text-gray-500">With customer token</p>
              </div>
              <div className={`rounded-lg p-3 ${data.tms.without_token > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                <p className={`text-2xl font-black ${data.tms.without_token > 0 ? "text-red-700" : "text-gray-800"}`}>{data.tms.without_token}</p>
                <p className="text-[11px] text-gray-500">Without token (no auto-renewal)</p>
              </div>
            </div>
            {!data.tms.likely_enabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-[13px] font-bold text-amber-800">Enable TMS in CyberSource Business Center:</p>
                <ol className="text-[12px] text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Log in to Business Center → <strong>Payment Configuration</strong></li>
                  <li>Go to <strong>Tokenization</strong> → enable <strong>Token Management Service</strong></li>
                  <li>Save and wait 5 minutes for propagation</li>
                  <li>Test with a new subscription — the customer token will appear in the DB</li>
                </ol>
                <a href="https://businesscenter.cybersource.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-700 hover:text-amber-900 transition mt-1">
                  Open Business Center <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Subscription / Order Health */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-gray-800 text-[14px]">Subscription Health</h2>
            <div className="flex flex-wrap gap-2">
              <WarnBadge count={data.past_due_count} label="Past-due subscriptions" />
              <WarnBadge count={data.stale_order_count} label="Stale checkouts (>3h)" />
            </div>
            {data.past_due_count > 0 && (
              <p className="text-[12px] text-gray-500">
                Past-due parents received a &apos;Resubscribe&apos; email automatically. They can also update their card via the /parents page.
              </p>
            )}
            {data.stale_order_count > 0 && (
              <p className="text-[12px] text-gray-500">
                Stale orders are cleaned up nightly by the <code className="bg-gray-100 px-1 rounded text-[11px]">expire-checkouts</code> cron — parents receive a retry email.
              </p>
            )}
          </div>

          {/* Webhook Checklist */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-gray-800 text-[14px]">Webhook Configuration Checklist</h2>
            <p className="text-[12px] text-gray-500">
              These must be configured manually in CyberSource Business Center → Webhooks. The database cannot verify webhook registration status.
            </p>
            <div className="space-y-2">
              {[
                {
                  event: "dispute.*",
                  desc: "Chargeback handling — revokes content access and cancels subscription",
                  path: "/api/webhooks/cybersource",
                  required: true,
                },
                {
                  event: "payments.capture.completed",
                  desc: "Browser-close recovery — provisions subscriptions when the browser closed mid-payment",
                  path: "/api/webhooks/cybersource",
                  required: true,
                },
                {
                  event: "payments.order.completed",
                  desc: "Order completion fallback",
                  path: "/api/webhooks/cybersource",
                  required: false,
                },
              ].map(item => (
                <div key={item.event} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.required ? "bg-blue-400" : "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-800">
                      <code className="bg-white border border-gray-200 px-1.5 rounded text-[11px]">{item.event}</code>
                      {item.required && <span className="ml-1.5 text-[10px] text-blue-600 font-black">REQUIRED</span>}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">→ {item.path}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://businesscenter.cybersource.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-800 transition">
              Configure webhooks in Business Center <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Recent Renewals */}
          {data.recent_renewals.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-gray-800 text-[14px]">Recent Renewal Attempts</h2>
              <div className="divide-y divide-gray-50">
                {data.recent_renewals.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      r.status === "completed" ? "bg-green-400"
                      : r.status === "pending" ? "bg-amber-400"
                      : "bg-red-400"
                    }`} />
                    <span className="text-[12px] font-bold text-gray-700 w-20 shrink-0">{r.status}</span>
                    <span className="text-[11px] text-gray-500 flex-1 truncate">{r.error_message ?? "—"}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
