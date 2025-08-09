"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage} from "@/contexts/LanguageContext";

// Blocks external navigation when kid-safe is enabled unless host is whitelisted.
// Whitelist entries are hostnames like "example.com".
export function SafeNavigationGuard({ enabled, whitelist }: { enabled: boolean; whitelist: string[] }) {
  const { toast } = useToast()
  const { language } = useLanguage()

  useEffect(() => {
    if (!enabled) return

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target?.closest?.("a") as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute("href") || ""
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("/") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return
      }
      try {
        const url = new URL(href, window.location.href)
        const host = url.hostname.toLowerCase()
        const allowed = whitelist.map((w) => w.toLowerCase())
        if (host === window.location.hostname.toLowerCase()) return
        if (!allowed.includes(host)) {
          e.preventDefault()
          e.stopPropagation()
          toast({ title: "Kid-Safe", description: t(language, "blockedExternal"), variant: "destructive" })
        }
      } catch {
        // if URL parse fails, block
        e.preventDefault()
        e.stopPropagation()
        toast({ title: "Kid-Safe", description: t(language, "blockedExternal"), variant: "destructive" })
      }
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [enabled, whitelist, language, toast])

  return null
}
