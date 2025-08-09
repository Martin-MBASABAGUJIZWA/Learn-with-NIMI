"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast"

type ParentProfile = {
  name: string
  email: string
  notifyEmail: boolean
  marketingOptIn: boolean
  remindersEnabled: boolean
  reminderTimes: string[] // "HH:MM"
}

const STORAGE_KEY = "parentProfileV2"
const AUTH_KEY = "parentAuth"
const SUB_KEY = "subscriptionStatus"


  export function ParentProfileMenu() {
  const { language, t } = useLanguage()
    const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<ParentProfile>({
    name: "Parent",
    email: "",
    notifyEmail: true,
    marketingOptIn: false,
    remindersEnabled: true,
    reminderTimes: ["17:00"],
  })
  const [loggedIn, setLoggedIn] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [newTime, setNewTime] = useState("17:00")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProfile(JSON.parse(saved))
      const auth = localStorage.getItem(AUTH_KEY)
      setLoggedIn(auth === "logged-in")
      const sub = localStorage.getItem(SUB_KEY)
      setIsSubscribed(sub === "subscribed")
    } catch {}
  }, [])

  const saveProfile = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setOpen(false)
    toast({ title: t(language, "saved"), description: t(language, "profileSaved") })
  }

  const login = () => {
    // Simulated login
    if (loginEmail.trim()) {
      localStorage.setItem(AUTH_KEY, "logged-in")
      setLoggedIn(true)
      setShowLogin(false)
      toast({ title: t(language, "loggedIn"), description: loginEmail })
    } else {
      toast({ title: t(language, "loginError"), description: t(language, "enterEmail"), variant: "destructive" })
    }
  }
  const logout = () => {
    localStorage.setItem(AUTH_KEY, "logged-out")
    setLoggedIn(false)
    toast({ title: t(language, "loggedOut") })
  }

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "granted") {
      toast({ title: t(language, "notificationsEnabled") })
      return
    }
    const res = await Notification.requestPermission()
    if (res === "granted") {
      toast({ title: t(language, "notificationsEnabled") })
    } else {
      toast({ title: t(language, "notificationsDenied"), variant: "destructive" })
    }
  }

  const initial = useMemo(() => (profile.name?.[0] || "P").toUpperCase(), [profile.name])

  const addReminderTime = () => {
    if (!newTime) return
    if (profile.reminderTimes.includes(newTime)) return
    setProfile((p) => ({ ...p, reminderTimes: [...p.reminderTimes, newTime] }))
  }
  const removeReminderTime = (tStr: string) => {
    setProfile((p) => ({ ...p, reminderTimes: p.reminderTimes.filter((x) => x !== tStr) }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-full h-9 w-9 border bg-white shadow-sm hover:bg-muted"
          aria-label="Parent Profile"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t(language, "parentProfileTitle")}</DialogTitle>
        </DialogHeader>

        {/* Auth status and actions */}
        <div className="rounded-md border p-3 bg-muted/30 space-y-2">
          <div className="text-sm">
            {t(language, "authStatus")}:{" "}
            <span className={loggedIn ? "text-green-700 font-medium" : "text-amber-700 font-medium"}>
              {loggedIn ? t(language, "loggedIn") : t(language, "loggedOut")}
            </span>
          </div>
          <div className="flex gap-2">
            {!loggedIn ? (
              <>
                <Button variant="outline" onClick={() => setShowLogin((v) => !v)}>
                  {t(language, "authLogin")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={logout}>
                {t(language, "authLogout")}
              </Button>
            )}
            <span className="text-xs text-muted-foreground self-center">
              {t(language, "subscriptionStatus")}:{" "}
              <b className={isSubscribed ? "text-purple-700" : ""}>
                {isSubscribed ? t(language, "subscribed") : t(language, "notSubscribed")}
              </b>
            </span>
          </div>
          {showLogin && !loggedIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <Input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Button onClick={login}>{t(language, "authLogin")}</Button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pp-name">{t(language, "parentName")}</Label>
            <Input
              id="pp-name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pp-email">{t(language, "parentEmail")}</Label>
            <Input
              id="pp-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t(language, "notifyEmail")}</div>
              <p className="text-xs text-muted-foreground">{t(language, "notifyEmailHint")}</p>
            </div>
            <Switch
              checked={profile.notifyEmail}
              onCheckedChange={(v) => setProfile((p) => ({ ...p, notifyEmail: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t(language, "marketingOptIn")}</div>
              <p className="text-xs text-muted-foreground">{t(language, "marketingOptInHint")}</p>
            </div>
            <Switch
              checked={profile.marketingOptIn}
              onCheckedChange={(v) => setProfile((p) => ({ ...p, marketingOptIn: v }))}
            />
          </div>
        </div>

        {/* Notifications / Reminders */}
        <div className="rounded-md border p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t(language, "remindersTitle")}</div>
            <Switch
              checked={profile.remindersEnabled}
              onCheckedChange={(v) => setProfile((p) => ({ ...p, remindersEnabled: v }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.reminderTimes.map((time) => (
              <span
                key={time}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full border bg-white text-xs"
              >
                {time}
                <button onClick={() => removeReminderTime(time)} className="text-red-600 hover:underline">
                  {t(language, "remove")}
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="max-w-[160px]" />
            <Button variant="outline" onClick={addReminderTime}>
              {t(language, "addReminder")}
            </Button>
            <Button variant="outline" onClick={requestNotificationPermission}>
              {t(language, "grantPermission")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t(language, "remindersHint")}</p>
        </div>

        <DialogFooter>
          <Button onClick={saveProfile}>{t(language, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
