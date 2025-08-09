"use client"

import { useEffect, useState } from "react"

const KEY = "kidSafeWhitelistV1"

export function useKidSafeWhitelist() {
  const [whitelist, setWhitelistState] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setWhitelistState(JSON.parse(raw))
      else {
        const initial = [window.location.hostname]
        localStorage.setItem(KEY, JSON.stringify(initial))
        setWhitelistState(initial)
      }
    } catch {}
  }, [])

  const setWhitelist = (w: string[]) => {
    setWhitelistState(w)
    localStorage.setItem(KEY, JSON.stringify(w))
  }

  return { whitelist, setWhitelist }
}
