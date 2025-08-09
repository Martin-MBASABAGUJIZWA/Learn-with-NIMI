"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Baby, CalendarCheck, Clock, Gem, Lock, Moon, Plus, Settings, Shield, Star } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalChildren } from "@/hooks/use-local-children"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { StickerPreviewCard } from "@/components/parent/sticker-preview-card"
import { ParentProfileMenu } from "@/components/parent/parent-profile"
import { ReminderScheduler } from "@/components/parent/reminder-scheduler"
import { SafeNavigationGuard } from "@/components/parent/safe-navigation-guard"
import { useKidSafeWhitelist } from "@/hooks/use-kid-safe"
import type { Activity, ChildProfile } from "@/components/parent/child-types"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"

function ChildChip({
  child,
  isActive,
  onClick,
}: {
  child: ChildProfile
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      role="button"
      onClick={onClick}
      className={`flex items-center gap-2 min-w-fit rounded-md border px-4 py-2 cursor-pointer ${
        isActive ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={child.avatar || ""} />
        <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="text-sm">{child.name}</span>
    </div>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const completed = activity.completed
  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${completed ? "bg-green-500" : "bg-gray-300"}`} />
      <span className={completed ? "font-medium" : "text-gray-500"}>{activity.name}</span>
    </div>
  )
}

export default function ParentPage() {
  const { language, t } = useLanguage()
  const { children, updateChild, addChild, isReady } = useLocalChildren()
  const [currentChildId, setCurrentChildId] = useState<string | null>(null)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const currentChild = children.find((c) => c.id === currentChildId) || children[0]

  const { whitelist, setWhitelist } = useKidSafeWhitelist()

  useEffect(() => {
    if (!currentChildId && children.length > 0) {
      setCurrentChildId(children[0].id)
    }
  }, [children, currentChildId])

  const handleScreenTimeChange = useDebouncedCallback((value: number) => {
    if (currentChild) {
      updateChild(currentChild.id, { screenTimeLimit: value })
    }
  }, 300)

  const progressPercent = useMemo(() => {
    if (!currentChild) return 0
    const completed = currentChild.activities.filter((a) => a.completed).length
    const total = currentChild.activities.length || 1
    return (completed / total) * 100
  }, [currentChild])

  const badge = useMemo(() => {
    if (!currentChild) return t("badgeLittleStarter")
    const weeklyScore =
      currentChild.activities.reduce((acc, a) => acc + (a.weeklyRecord?.reduce((s, v) => s + v, 0) || 0), 0) /
      Math.max(currentChild.activities.length * 7, 1)
    return weeklyScore >= 0.8
      ? t("badgeStarExplorer")
      : weeklyScore >= 0.6
        ? t("badgeCuriousLearner")
        : weeklyScore >= 0.4
          ? t("badgeBrightBeginner")
          : t("badgeLittleStarter")
  }, [currentChild, t])

  if (!isReady) {
    return (
      <div className="flex flex-col min-h-screen bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
        <div
            className="h-12 w-12 animate-spin border-4 border-blue-300 border-t-transparent rounded-full"
            aria-label="Loading"
            suppressHydrationWarning // Add this to suppress the warning if needed
          />
        </main>
      </div>
    )
  }

  const grayTheme = currentChild?.bedtimeMode ? "filter grayscale contrast-90" : ""

  return (
    <div className={`flex flex-col min-h-screen bg-blue-50 ${grayTheme}`}>
      <Header />
      <ReminderScheduler />
      <SafeNavigationGuard enabled={!!currentChild?.contentLock} whitelist={whitelist} />

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 relative">
        <div className="absolute top-4 right-4 z-10">
          <ParentProfileMenu />
        </div>

        <div className="text-center pt-2 md:pt-4">
          <div className="flex justify-center items-center gap-3">
            <Baby className="text-pink-500 h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentChild ? `${currentChild.name}${t("parentZoneTitleSuffix")}` : t("child")}
            </h1>
          </div>
          <p className="text-blue-400 mt-1 text-sm">{t("subtitleAgeRange")}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <ChildChip
              key={child.id}
              child={child}
              isActive={currentChildId === child.id}
              onClick={() => setCurrentChildId(child.id)}
            />
          ))}
          <Button
            variant="outline"
            onClick={() => setIsAddingChild(true)}
            className="flex items-center gap-2 min-w-fit"
          >
            <Plus className="h-4 w-4" />
            {t("addChild")}
          </Button>
        </div>

        {isAddingChild && (
          <AddChildForm
            onCancel={() => setIsAddingChild(false)}
            onSubmit={async (name) => {
              const newId = await addChild(name)
              if (newId) {
                setCurrentChildId(newId)
                setIsAddingChild(false)
              }
            }}
            t={t}
          />
        )}

        {!isAddingChild && currentChild && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <ChildProfileCard
              child={currentChild}
              onUpdate={(updates) => updateChild(currentChild.id, updates)}
              t={t}
            />

            <WeeklyReportCard child={currentChild} progressPercent={progressPercent} t={t} />

            <StickerPreviewCard child={currentChild} badge={badge} t={t} />

            <ControlsCard
              child={currentChild}
              onUpdate={(updates) => updateChild(currentChild.id, updates)}
              onScreenTimeChange={handleScreenTimeChange}
              t={t}
              whitelist={whitelist}
              setWhitelist={setWhitelist}
            />

            <PremiumCard t={t} />
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">{t("footerTagline")}</p>
      </main>
      <BottomNavigation />
    </div>
  )
}

function AddChildForm({
  onCancel,
  onSubmit,
  t,
}: {
  onCancel: () => void
  onSubmit: (name: string) => void
  t: (key: string) => string
}) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardHeader>
        <CardTitle>{t("addNewChild")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="childName">{t("childName")}</Label>
          <Input
            id="childName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("childNamePlaceholder")}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              if (!name.trim()) return
              setIsSubmitting(true)
              await onSubmit(name.trim())
              setIsSubmitting(false)
            }}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? t("saving") : t("save")}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ChildProfileCard({
  child,
  onUpdate,
  t,
}: {
  child: ChildProfile
  onUpdate: (updates: Partial<ChildProfile>) => void
  t: (key: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(child.name)
  const [age, setAge] = useState(child.age)
  const [avatar, setAvatar] = useState(child.avatar)
  const [theme, setTheme] = useState(child.theme || "ocean")

  useEffect(() => {
    setName(child.name)
    setAge(child.age)
    setAvatar(child.avatar)
    setTheme(child.theme || "ocean")
  }, [child])

  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={child.avatar || ""} alt={`${child.name}'s avatar`} />
            <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{child.name}</CardTitle>
            <p className="text-blue-500 flex items-center gap-1 text-sm">
              <CalendarCheck className="h-4 w-4" />
              <span>{child.age}</span>
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                {t("editProfile")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>{t("editProfile")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("childName")}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">{t("ageRange")}</Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger id="age">
                      <SelectValue placeholder={t("selectAge")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3 years">2-3</SelectItem>
                      <SelectItem value="3-4 years">3-4</SelectItem>
                      <SelectItem value="2-4 years">2-4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatar">{t("avatarUrl")}</Label>
                  <Input
                    id="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="theme">{t("favoriteTheme")}</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder={t("selectTheme")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ocean">{t("themeOcean")}</SelectItem>
                      <SelectItem value="space">{t("themeSpace")}</SelectItem>
                      <SelectItem value="safari">{t("themeSafari")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    onUpdate({ name, age, avatar, theme })
                    setOpen(false)
                  }}
                  disabled={!name.trim()}
                >
                  {t("save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{t("profileTip")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WeeklyReportCard({
  child,
  progressPercent,
  t,
}: {
  child: ChildProfile
  progressPercent: number
  t: (key: string) => string
}) {
  return (
    <Card className="bg-yellow-50 border-2 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <Star className="h-5 w-5" />
          {t("weeklyAdventures")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {child.activities.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">{t("thisWeek")}</span>
            </div>
            <div className="flex gap-1">
              {item.weeklyRecord?.map((v, i) => (
                <div
                  key={i}
                  className={`h-4 w-6 rounded ${v ? "bg-green-500" : "bg-yellow-200"} border border-yellow-300`}
                  aria-label={`${t("day")} ${i + 1}: ${v ? t("done") : t("missed")}`}
                />
              ))}
            </div>
          </div>
        ))}
        <Progress value={progressPercent} className="h-3 mt-4 bg-yellow-100" />
        <p className="text-sm text-yellow-700 text-center mt-1">
          {Math.round(progressPercent)}% {t("activitiesCompleted")}
        </p>
      </CardContent>
    </Card>
  )
}

function ControlsCard({
  child,
  onUpdate,
  onScreenTimeChange,
  t,
  whitelist,
  setWhitelist,
}: {
  child: ChildProfile
  onUpdate: (updates: Partial<ChildProfile>) => void
  onScreenTimeChange: (value: number) => void
  t: (key: string) => string
  whitelist: string[]
  setWhitelist: (w: string[]) => void
}) {
  const [newDomain, setNewDomain] = useState("")

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase()
    if (!d) return
    if (whitelist.includes(d)) {
      setNewDomain("")
      return
    }
    setWhitelist([...whitelist, d])
    setNewDomain("")
  }

  const removeDomain = (d: string) => {
    setWhitelist(whitelist.filter((x) => x !== d))
  }

  return (
    <Card className="bg-pink-50 border-2 border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-700 flex items-center gap-2">{t("safetySettings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-pink-500" />
              <span className="font-medium">{t("screenTime")}</span>
            </div>
            <span className="font-bold text-pink-600">
              {child.screenTimeLimit} {t("min")}
            </span>
          </div>
          <Slider
            value={[child.screenTimeLimit]}
            max={120}
            step={5}
            onValueChange={([val]) => onScreenTimeChange(val)}
            className="[&_[role=slider]]:bg-pink-500"
          />
          <p className="text-xs text-muted-foreground">{t("screenTimeHint")}</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-purple-500" />
            <span className="font-medium">{t("bedtimeMode")}</span>
          </div>
          <Switch
            checked={child.bedtimeMode}
            onCheckedChange={(val) => onUpdate({ bedtimeMode: val })}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("bedtimeHint")}</p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{t("kidSafeOnly")}</span>
          </div>
          <Switch
            checked={child.contentLock}
            onCheckedChange={(val) => onUpdate({ contentLock: val })}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("kidSafeHint")}</p>

        {child.contentLock && (
          <div className="space-y-2 rounded-md border bg-white/60 p-3">
            <div className="font-medium">{t("whitelistTitle")}</div>
            <div className="flex gap-2 items-center">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder={t("domainPlaceholder")}
              />
              <Button variant="outline" onClick={addDomain}>
                {t("addDomain")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {whitelist.map((d) => (
                <span key={d} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border bg-white text-xs">
                  {d}
                  <button onClick={() => removeDomain(d)} className="text-red-600 hover:underline">
                    {t("remove")}
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("whitelistNote")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PremiumCard({ t }: { t: (key: string) => string }) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [prefStorybook, setPrefStorybook] = useState(true)
  const [prefColoring, setPrefColoring] = useState(true)
  const [deliveryDay, setDeliveryDay] = useState("Friday")

  useEffect(() => {
    const sub = localStorage.getItem("subscriptionStatus") === "subscribed"
    setIsSubscribed(sub)
    const prefs = localStorage.getItem("deliveryPrefs")
    if (prefs) {
      try {
        const p = JSON.parse(prefs)
        setPrefStorybook(!!p.storybook)
        setPrefColoring(!!p.coloring)
        setDeliveryDay(p.day || "Friday")
      } catch {}
    }
  }, [])

  const savePrefs = () => {
    localStorage.setItem(
      "deliveryPrefs",
      JSON.stringify({ storybook: prefStorybook, coloring: prefColoring, day: deliveryDay }),
    )
  }

  const bullets = [
    t("premiumBullet1"),
    t("premiumBullet2"),
    t("premiumBullet3"),
    t("premiumBullet4"),
    t("premiumBullet5"),
  ]

  return (
    <Card className="bg-purple-50 border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Gem className="h-5 w-5" />
          {t("premiumBenefits")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-purple-700 list-disc pl-5">
          {bullets.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>

        <div className="rounded-md bg-white/70 border border-purple-200 p-3 text-sm text-purple-800">
          {t("premiumGuarantee")}
        </div>

        <div className="rounded-md border bg-white/60 p-3 space-y-3">
          <div className="font-semibold">{t("premiumDeliveriesTitle")}</div>
          <div className={`grid sm:grid-cols-2 gap-3 ${!isSubscribed ? "opacity-60 pointer-events-none" : ""}`}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefStorybook} onChange={(e) => setPrefStorybook(e.target.checked)} />
              <span>{t("weeklyHardStorybook")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefColoring} onChange={(e) => setPrefColoring(e.target.checked)} />
              <span>{t("weeklyColoringBook")}</span>
            </label>
            <div className="sm:col-span-2">
              <Label htmlFor="deliveryDay">{t("chooseDeliveryDay")}</Label>
              <Select value={deliveryDay} onValueChange={setDeliveryDay}>
                <SelectTrigger id="deliveryDay" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isSubscribed && (
            <p className="text-xs text-muted-foreground">{t("subscribeToUnlockDeliveries")}</p>
          )}
          <div className="flex gap-2">
            <Link href="/subscription" className="block mt-1">
              <Button className="bg-purple-600 hover:bg-purple-700">{t("manageSubscription")}</Button>
            </Link>
            <Button variant="outline" onClick={savePrefs}>
              {t("savePreferences")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}