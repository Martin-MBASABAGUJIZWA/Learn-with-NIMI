"use client";

import { useEffect, useState } from "react";
import { Gift, CheckCircle, Clock } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface GiftRecord {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  redeemed_at: string | null;
  created_at: string;
  products: { name: string } | null;
}

export default function SentGiftsCard() {
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("gift_subscriptions")
        .select("id, recipient_email, recipient_name, redeemed_at, created_at, products(name)")
        .eq("giver_parent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setGifts((data ?? []) as unknown as GiftRecord[]);
      setLoading(false);
    })();
  }, []);

  if (loading || gifts.length === 0) return null;

  return (
    <div className="bg-ds-card border border-ds-border shadow-ds-card p-5" style={{ borderRadius: "var(--leaf-r-lg)" }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
          <Gift className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h3 className="font-baloo font-black text-ds-text text-mbase leading-tight">Gifts Sent</h3>
          <p className="text-[var(--ds-text-tertiary)] text-2xs">{gifts.length} gift{gifts.length !== 1 ? "s" : ""} sent</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {gifts.map(g => (
          <div key={g.id} className="flex items-center gap-3 bg-[var(--ds-surface-card)] rounded-xl p-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${g.redeemed_at ? "bg-[var(--ds-brand-soft)]" : "bg-amber-100"}`}>
              {g.redeemed_at
                ? <CheckCircle className="w-4 h-4 text-[var(--ds-text-brand)]" />
                : <Clock className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ds-text font-bold text-sml truncate">
                {g.recipient_name ?? g.recipient_email}
              </p>
              <p className="text-[var(--ds-text-tertiary)] text-2xs">
                {g.products?.name ?? "Nimipiko Club"} ·{" "}
                {g.redeemed_at ? "Claimed ✓" : "Awaiting claim"}
              </p>
            </div>
            <p className="text-[var(--ds-text-tertiary)] text-3xs flex-shrink-0">
              {new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
