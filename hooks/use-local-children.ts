"use client"

import { useEffect, useState } from "react"
import type { ChildProfile } from "@/components/parent/child-types"

const STORAGE_KEY = "childrenDataV2"

function seedWeekly(n = 7) {
  return Array.from({ length: n }).map(() => (Math.random() > 0.35 ? 1 : 0))
}

function defaultChildren(): ChildProfile[] {
  return [
    {
      id: "c1",
      name: "Ava",
      age: "2-4 years",
      avatar: "",
      screenTimeLimit: 30,
      bedtimeMode: true,
      contentLock: true,
      theme: "ocean",
      activities: [
        { id: "a1", name: "ABCs", completed: true, weeklyRecord: seedWeekly() },
        { id: "a2", name: "Counting", completed: false, weeklyRecord: seedWeekly() },
        { id: "a3", name: "Shapes", completed: true, weeklyRecord: seedWeekly() },
      ],
    },
    {
      id: "c2",
      name: "Leo",
      age: "3-4 years",
      avatar: "",
      screenTimeLimit: 25,
      bedtimeMode: false,
      contentLock: true,
      theme: "space",
      activities: [
        { id: "a1", name: "ABCs", completed: false, weeklyRecord: seedWeekly() },
        { id: "a2", name: "Counting", completed: true, weeklyRecord: seedWeekly() },
        { id: "a3", name: "Shapes", completed: false, weeklyRecord: seedWeekly() },
      ],
    },
  ]
}

export function useLocalChildren() {
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setChildren(JSON.parse(saved))
      } else {
        const seed = defaultChildren()
        setChildren(seed)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      }
    } finally {
      setIsReady(true)
    }
  }, [])

  const persist = (next: ChildProfile[]) => {
    setChildren(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const updateChild = (id: string, updates: Partial<ChildProfile>) => {
    const next = children.map((c) => (c.id === id ? { ...c, ...updates } : c))
    persist(next)
  }

  const addChild = async (name: string) => {
    const newChild: ChildProfile = {
      id: Date.now().toString(),
      name,
      age: "2-4 years",
      avatar: "",
      screenTimeLimit: 30,
      bedtimeMode: true,
      contentLock: true,
      theme: "ocean",
      activities: [
        { id: crypto.randomUUID(), name: "ABCs", completed: false, weeklyRecord: seedWeekly() },
        { id: crypto.randomUUID(), name: "Counting", completed: false, weeklyRecord: seedWeekly() },
        { id: crypto.randomUUID(), name: "Shapes", completed: false, weeklyRecord: seedWeekly() },
      ],
    }
    const next = [...children, newChild]
    persist(next)
    return newChild.id
  }

  return { children, updateChild, addChild, isReady }
}
