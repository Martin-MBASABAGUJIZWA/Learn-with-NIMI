"use client"

import { useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"

export interface Activity {
  id: string
  child_id: string
  mission_id: string
  completed: boolean
  completed_at?: string
  created_at?: string
  mission?: { name: string; description?: string }
}

export function useChildActivities(childId?: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        let data: Activity[] = []

        if (childId) {
          // Fetch activities for a specific child
          const { data: fetchedData, error: fetchError } = await supabase
            .from("activities")
            .select("id, child_id, mission_id, completed, completed_at, created_at, missions(name, description)")
            .eq("child_id", childId)

          if (fetchError) throw fetchError
          data = fetchedData || []
        } else {
          // No childId provided (guest or fallback): fetch public activities or empty array
          const { data: publicData, error: publicError } = await supabase
            .from("activities")
            .select("id, child_id, mission_id, completed, completed_at, created_at, missions(name, description)")
            .limit(5) // optional: show sample/public activities
          
          if (publicError) throw publicError
          data = publicData || []
        }

        setActivities(data)
      } catch (err: any) {
        console.error("Failed to load activities:", err)
        setError(err.message || "Unknown error")
        setActivities([]) // fallback
      } finally {
        setIsReady(true)
      }
    }

    loadActivities()
  }, [childId])

  return { activities, isReady, error }
}
