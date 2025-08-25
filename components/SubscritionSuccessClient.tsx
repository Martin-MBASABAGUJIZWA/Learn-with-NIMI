"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import supabase from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SubscriptionSuccessClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { language } = useLanguage();
  const session = useSession();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session) return;

    const verifyPayment = async () => {
      setLoading(true);
      try {
        const parentId = session.user.id;
        if (!parentId) throw new Error("User session not found");

        const stripeSessionId = searchParams.get("session_id");
        const flutterwaveTxRef = searchParams.get("tx_ref");
        const pesapalRef = searchParams.get("pesapal_reference");

        let plan: "monthly" | "yearly" | null = null;

        if (stripeSessionId) {
          const res = await fetch(`/api/subscription?session_id=${stripeSessionId}`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          plan = data.plan ?? null;
        }

        if (flutterwaveTxRef) {
          const res = await fetch(`/api/verify-flutterwave?tx_ref=${flutterwaveTxRef}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Flutterwave verification failed");
          plan = data.plan ?? plan;
        }

        if (pesapalRef) {
          const res = await fetch(`/api/verify-pesapal?reference=${pesapalRef}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Pesapal verification failed");
          plan = data.plan ?? plan;
        }

        if (!plan) throw new Error("Could not determine subscription plan");

        const { error } = await supabase
          .from("subscriptions")
          .upsert({ parent_id: parentId, plan, status: "subscribed" });

        if (error) throw new Error(error.message);

        setSuccess(true);
        toast({ title: t(language, "success"), description: t(language, "subscriptionUpdated") });
      } catch (err: any) {
        console.error(err);
        toast({ title: t(language, "error"), description: err.message });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [session, searchParams, toast, language]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {loading && <div className="text-xl text-gray-700">Verifying your payment...</div>}

      {!loading && success && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700">🎉 Payment Successful!</h1>
          <p className="mt-4 text-gray-700">Your subscription has been updated successfully.</p>
        </div>
      )}

      {!loading && !success && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">❌ Payment Verification Failed</h1>
          <p className="mt-4 text-gray-700">Please contact support if this persists.</p>
        </div>
      )}
    </div>
  );
}
