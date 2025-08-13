"use client"

import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage} from "@/contexts/LanguageContext";

// Read parent profile from localStorage and schedule notifications.
// Uses timeouts to next occurrence; falls back to an in-app toast if Notifications are not granted [^2].
export function ReminderScheduler() {
  const { toast } = useToast()
  const { language, t } = useLanguage()
  const timers = useRef<number[]>([])

  useEffect(() => {
    function readProfile() {
      try {
        const raw = localStorage.getItem("parentProfileV2")
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }

    function clearTimers() {
      timers.current.forEach((id) => clearTimeout(id))
      timers.current = []
    }

    function scheduleAll() {
      const profile = readProfile()
      if (!profile || !profile.remindersEnabled) return
      const times: string[] = profile.reminderTimes || []
      if (!times.length) return

      times.forEach((HHMM) => {
        const id = scheduleAt(HHMM)
        if (id) timers.current.push(id)
      })
    }

    function scheduleAt(HHMM: string) {
      const [h, m] = HHMM.split(":").map((x: string) => Number.parseInt(x, 10))
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      const now = new Date()
      const next = new Date()
      next.setHours(h, m, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      const ms = next.getTime() - now.getTime()
      const id = window.setTimeout(() => {
        fireReminder()
        // reschedule for tomorrow
        scheduleAt(HHMM)
      }, ms)
      return id
    }

    function fireReminder() {
      const title = "Nimi"
      const body = t("learnReminderBody")
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body })
      } else {
        toast({ title, description: body })
      }
    }

    clearTimers()
    scheduleAll()

    const onStorage = (e: StorageEvent) => {
      if (e.key === "parentProfileV2") {
        clearTimers()
        scheduleAll()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("storage", onStorage)
      clearTimers()
    }
  }, [language, toast])

  return null
}
