"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Gem, Shield, Sparkles, Trophy } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/translations";
import supabase from "@/lib/supabaseClient";
import { useSession } from "@supabase/auth-helpers-react";

// Types
type PlanType = "monthly" | "yearly";

type Subscription = {
  plan: PlanType;
  status: string;
};

export default function SubscriptionPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const session = useSession();
  const parentId = session?.user?.id;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<PlanType | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  // Define Plans
  const plans = useMemo(
    () => [
      {
        nameKey: "planMonthly",
        price: "$6.99",
        periodKey: "perMonth",
        features: ["f1", "f2", "f3", "f4"],
        planId: "monthly" as PlanType,
        highlighted: false,
      },
      {
        nameKey: "planYearly",
        price: "$59.99",
        periodKey: "perYear",
        features: ["f1", "f2", "f3", "f4", "f5"],
        planId: "yearly" as PlanType,
        highlighted: true,
        badge: t(language, "bestValue"),
      },
    ],
    [language]
  );

  const isSubscribed = subscription?.status === "subscribed";

  // Fetch subscription from Supabase
  useEffect(() => {
    if (!parentId) return;

    const fetchSubscription = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("parent_id", parentId)
        .single();

      if (error && error.code !== "PGRST116") {
        toast({ title: t(language, "error"), description: error.message });
      } else {
        setSubscription(data || null);
      }
      setLoading(false);
    };

    fetchSubscription();

    const channel = supabase
      .channel(`subscription-updates-${parentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "subscriptions", filter: `parent_id=eq.${parentId}` },
        (payload) => setSubscription(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [parentId, language, toast]);

  // Stripe Checkout
  const subscribeStripe = async (plan: PlanType) => {
    if (!parentId) return;
    setChangingPlan(plan);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t(language, "error"), description: err.message });
      setChangingPlan(null);
    }
  };

  // Show manual MTN/Airtel modal
  const openManualPayment = (plan: PlanType, provider: string) => {
    setSelectedPlan(plan);
    setSelectedProvider(provider);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8 space-y-8">
        <Header />
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-300 rounded" />
          <div className="h-6 w-64 bg-gray-300 rounded" />
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="h-60 bg-gray-200 rounded" />
            <div className="h-60 bg-gray-200 rounded" />
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header />

      {isSubscribed && subscription?.plan && (
        <motion.div
          className="flex justify-center mt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium shadow-sm">
            <Gem className="h-4 w-4" /> 🎉 {t(language, "youAreOn")}{" "}
            {subscription.plan === "yearly" ? t(language, "planYearly") : t(language, "planMonthly")}
          </div>
        </motion.div>
      )}

      <main className="flex-1 container max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        {/* Header Section */}
        <motion.div className="text-center space-y-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium shadow-sm">
            <Gem className="h-4 w-4" />
            {t(language, "premiumTitle")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t(language, "premiumHeadline")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t(language, "premiumSubhead")}</p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((p, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.15 }} viewport={{ once: true }}>
              <Card className={`${p.highlighted ? "border-purple-400 ring-2 ring-purple-200 scale-[1.02]" : ""} transition-transform hover:scale-[1.03] cursor-pointer shadow-sm`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{t(language, p.nameKey)}</CardTitle>
                    {p.badge && <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 rounded px-2 py-1">{p.badge}</span>}
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{p.price}</div>
                    <div className="text-xs text-muted-foreground">{t(language, p.periodKey)}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{t(language, f)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Stripe Button */}
                  <Button
                    className={`w-full ${p.highlighted ? "bg-purple-700 hover:bg-purple-800" : "bg-purple-600 hover:bg-purple-700"} shadow-md`}
                    onClick={() => subscribeStripe(p.planId)}
                    disabled={changingPlan !== null}
                  >
                    {changingPlan === p.planId
                      ? t(language, "loading")
                      : subscription?.plan === p.planId
                      ? t(language, "subscribed")
                      : `${t(language, "pay")} ${p.price} (Card/Stripe)`}
                  </Button>

                  {/* MTN/Airtel Manual Button */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-yellow-400 hover:bg-yellow-50"
                      onClick={() => openManualPayment(p.planId, "MTN")}
                      disabled={changingPlan !== null}
                    >
                      <Image src="/mtn-logo.png" alt="MTN" width={24} height={24} />
                      <span>{t(language, "pay")} {p.price} (MTN)</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-red-400 hover:bg-red-50"
                      onClick={() => openManualPayment(p.planId, "Airtel")}
                      disabled={changingPlan !== null}
                    >
                      <Image src="/airtel-logo.jpeg" alt="Airtel" width={24} height={24} />
                      <span>{t(language, "pay")} {p.price} (Airtel)</span>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">{t(language, "trialNote")}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div className="grid md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } } }} viewport={{ once: true }}>
          <BenefitTile icon={<Trophy className="h-5 w-5" />} title={t(language, "benefit1Title")} desc={t(language, "benefit1Desc")} />
          <BenefitTile icon={<Sparkles className="h-5 w-5" />} title={t(language, "benefit2Title")} desc={t(language, "benefit2Desc")} />
          <BenefitTile icon={<Shield className="h-5 w-5" />} title={t(language, "benefit3Title")} desc={t(language, "benefit3Desc")} />
        </motion.div>

        <motion.div className="text-center space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Link href="/parent">
            <Button variant="outline">{t(language, "backToParentZone")}</Button>
          </Link>
        </motion.div>
      </main>

      <BottomNavigation />

      {/* Manual Payment Modal */}
      {showModal && selectedProvider && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg"
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h2 className="text-xl font-bold mb-4">{selectedProvider} Payment</h2>
            <p className="mb-2">Plan: {selectedPlan === "yearly" ? t(language, "planYearly") : t(language, "planMonthly")}</p>
            <p className="mb-2">Amount: {plans.find(p => p.planId === selectedPlan)?.price}</p>
            <p className="mb-4 font-semibold">Pay to number: {selectedProvider === "MTN" ? "078XXXXXXX" : "078YYYYYYY"}</p>
            <p className="text-sm mb-4">Open your MoMo app and send the above amount. Include your email in the message.</p>

            {/* Form Submission */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as typeof e.target & {
                phone: { value: string };
                transaction: { value: string };
              };
              const phone = target.phone.value;
              const transaction = target.transaction.value;

              if (!phone || !transaction) {
                toast({ title: t(language, "error"), description: "Please fill in all fields" });
                return;
              }

              try {
                const { error } = await supabase.from("manual_payments").insert([{
                  parent_id: parentId,
                  provider: selectedProvider,
                  plan: selectedPlan,
                  phone,
                  transaction_id: transaction,
                  created_at: new Date(),
                }]);
                if (error) throw error;
                toast({ title: "Success", description: "Payment info submitted for verification" });
                setShowModal(false);
              } catch (err: any) {
                toast({ title: t(language, "error"), description: err.message });
              }
            }}>
              <input name="phone" type="text" placeholder="Phone used" className="w-full mb-2 p-2 border rounded" />
              <input name="transaction" type="text" placeholder="Transaction ID / Reference" className="w-full mb-2 p-2 border rounded" />
              <Button type="submit" className="w-full mb-2">Submit Payment</Button>
              <Button variant="outline" className="w-full" onClick={() => setShowModal(false)}>Cancel</Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Benefit Tile Component
function BenefitTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}>
      <Card className="bg-muted/30 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-2">{icon}<div className="font-semibold">{title}</div></div>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
