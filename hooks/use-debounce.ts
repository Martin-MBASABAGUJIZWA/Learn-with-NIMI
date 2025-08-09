"use client"

import { useMemo } from "react"

export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  const handle = useMemo(() => {
    let t: any
    return (...args: any[]) => {
      clearTimeout(t)
      t = setTimeout(() => fn(...args), delay)
    }
  }, [fn, delay])

  return handle as T
}
