"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Gem, Shield, Sparkles, Trophy } from "lucide-react"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useEffect, useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { t } from "@/lib/translations"
import supabase from "@/lib/supabaseClient"

// Types
type PlanType = "monthly" | "yearly"

type Subscription = {
  plan: PlanType
  status: string
}

// Main Component
export default function SubscriptionPage({ parentId }: { parentId: string }) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState<PlanType | null>(null)

  // Define Plans
  const plans = useMemo(() => [
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
      badge: t(language, "bestValue")
    },
  ], [language])

  const isSubscribed = subscription?.status === "subscribed"

  // Fetch subscription from Supabase
  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("parent_id", parentId)
        .single()
  
      if (error && error.code !== "PGRST116") {
        toast({ title: t(language, "error"), description: error.message })
      } else {
        setSubscription(data || null)
      }
      setLoading(false)
    }
  
    fetchSubscription()
  
    // --- Supabase v2 Realtime ---
    const channel = supabase
      .channel(`subscription-updates-${parentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "subscriptions", filter: `parent_id=eq.${parentId}` },
        (payload) => {
          setSubscription(payload.new)
        }
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [parentId, language, toast])
  

  // Subscribe / Switch Plan
  const subscribe = async (plan: PlanType) => {
    if (subscription?.plan && subscription.plan !== plan) {
      if (!confirm(t(language, "confirmSwitchPlan"))) return
    }

    setChangingPlan(plan)
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          parent_id: parentId,
          plan,
          status: "subscribed",
          renewed_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" }
      )

    if (error) {
      toast({ title: t(language, "error"), description: error.message })
    } else {
      setSubscription({ plan, status: "subscribed" })
      toast({ title: t(language, "subscribed"), description: t(language, "premiumBenefits") })
    }
    setChangingPlan(null)
  }

  // Skeleton loader
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
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header />

      {/* Subscription Status Badge */}
      {isSubscribed && subscription?.plan && (
        <motion.div
          className="flex justify-center mt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium shadow-sm">
            <Gem className="h-4 w-4" /> 🎉 {t(language, "youAreOn")}{" "}
            {subscription.plan === "yearly"
              ? t(language, "planYearly")
              : t(language, "planMonthly")}
          </div>
        </motion.div>
      )}

      <main className="flex-1 container max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        {/* Premium Banner */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium shadow-sm">
            <Gem className="h-4 w-4" />
            {t(language, "premiumTitle")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t(language, "premiumHeadline")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(language, "premiumSubhead")}
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((p, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              viewport={{ once: true }}
            >
              <Card
                className={`${
                  p.highlighted ? "border-purple-400 ring-2 ring-purple-200 scale-[1.02]" : ""
                } transition-transform hover:scale-[1.03] cursor-pointer shadow-sm`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">
                      {t(language, p.nameKey)}
                    </CardTitle>
                    {p.badge && (
                      <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 rounded px-2 py-1">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{p.price}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(language, p.periodKey)}
                    </div>
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
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-md"
                    onClick={() => subscribe(p.planId)}
                    disabled={changingPlan !== null}
                  >
                    {changingPlan === p.planId
                      ? t(language, "loading")
                      : subscription?.plan === p.planId
                      ? t(language, "subscribed")
                      : t(language, "startTrial")}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t(language, "trialNote")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.2 },
            },
          }}
          viewport={{ once: true }}
        >
          <BenefitTile
            icon={<Trophy className="h-5 w-5" />}
            title={t(language, "benefit1Title")}
            desc={t(language, "benefit1Desc")}
          />
          <BenefitTile
            icon={<Sparkles className="h-5 w-5" />}
            title={t(language, "benefit2Title")}
            desc={t(language, "benefit2Desc")}
          />
          <BenefitTile
            icon={<Shield className="h-5 w-5" />}
            title={t(language, "benefit3Title")}
            desc={t(language, "benefit3Desc")}
          />
        </motion.div>

        {/* Back */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/parent">
            <Button variant="outline">{t(language, "backToParentZone")}</Button>
          </Link>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  )
}

// Benefit Tile Component
function BenefitTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
    >
      <Card className="bg-muted/30 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            {icon}
            <div className="font-semibold">{title}</div>
          </div>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
