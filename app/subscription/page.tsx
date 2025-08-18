"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Gem, Shield, Sparkles, Trophy } from "lucide-react"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { t } from "@/lib/translations"
import { supabase } from "@/lib/supabase"

type PlanType = "monthly" | "yearly"

export default function SubscriptionPage({ parentId }: { parentId: string }) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<{
    plan: PlanType
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch subscription from Supabase
  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("parent_id", parentId)
        .single()

      if (error && error.code !== "PGRST116") { // ignore "no rows" error
        toast({ title: t(language, "error"), description: error.message })
      } else {
        setSubscription(data || null)
      }
      setLoading(false)
    }
    fetchSubscription()
  }, [parentId, language, toast])

  const subscribe = async (plan: PlanType) => {
    setLoading(true)
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
    setLoading(false)
  }

  const plans = [
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
      badge: t(language, "bestValue"),
      features: ["f1", "f2", "f3", "f4", "f5"],
      planId: "yearly" as PlanType,
      highlighted: true,
    },
  ]

  const isSubscribed = subscription?.status === "subscribed"

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
            <Gem className="h-4 w-4" />
            {t(language, "premiumTitle")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t(language, "premiumHeadline")}</h1>
          <p className="text-muted-foreground">{t(language, "premiumSubhead")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((p, idx) => (
            <Card key={idx} className={`${p.highlighted ? "border-purple-400 ring-2 ring-purple-200" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{t(language, p.nameKey)}</CardTitle>
                  {p.badge && (
                    <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 rounded px-2 py-1">
                      {p.badge}
                    </span>
                  )}
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
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => subscribe(p.planId)}
                  disabled={isSubscribed || loading}
                >
                  {loading
                    ? t(language, "loading")
                    : isSubscribed
                    ? t(language, "subscribed")
                    : t(language, "startTrial")}
                </Button>
                <p className="text-xs text-muted-foreground">{t(language, "trialNote")}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
        </div>

        <div className="text-center space-y-3">
          <Link href="/parent">
            <Button variant="outline">{t(language, "backToParentZone")}</Button>
          </Link>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}

function BenefitTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-purple-700 mb-2">
          {icon}
          <div className="font-semibold">{title}</div>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}
