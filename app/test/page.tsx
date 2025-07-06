"use client"

import { useEffect } from "react"
import supabase from "@/lib/supabaseClient";
export default function TestPage() {
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("daily_missions").select("*")
      console.log("✅ DATA:", data)
      console.log("❌ ERROR:", error)
    }
    fetchData()
  }, [])

  return (
    <div className="p-6">
      <h1>Supabase Test Page</h1>
      <p>Check your console for data or error output.</p>
    </div>
  )
}