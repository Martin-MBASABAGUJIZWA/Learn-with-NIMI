'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabaseClient'

export default function EditMissionCompletionPage() {
  const router = useRouter()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    student_id: '',
    mission_id: '',
    completed_at: '',
    piko_victory_achieved: false,
    notes: '',
  })
  const [students, setStudents] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: studentData } = await supabase.from('students').select('id, name')
      const { data: missionData } = await supabase.from('daily_missions').select('id, activity_title')
      setStudents(studentData || [])
      setMissions(missionData || [])

      if (!id) return

      const { data: completionData, error } = await supabase
        .from('mission_completions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        alert('Failed to fetch mission completion')
        console.error(error)
        router.push('/admin/mission_completions')
      } else if (completionData) {
        setFormData({
          student_id: completionData.student_id,
          mission_id: completionData.mission_id,
          completed_at: completionData.completed_at ? new Date(completionData.completed_at).toISOString().slice(0, 16) : '',
          piko_victory_achieved: completionData.piko_victory_achieved,
          notes: completionData.notes || '',
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!id) {
      alert('Invalid mission completion ID')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('mission_completions')
      .update({
        student_id: formData.student_id,
        mission_id: formData.mission_id,
        completed_at: formData.completed_at ? new Date(formData.completed_at).toISOString() : new Date().toISOString(),
        piko_victory_achieved: formData.piko_victory_achieved,
        notes: formData.notes,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      alert('Failed to update mission completion')
      console.error(error)
    } else {
      router.push('/admin/mission_completions')
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Mission Completion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="student_id"
          value={formData.student_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          name="mission_id"
          value={formData.mission_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Mission</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>{m.activity_title}</option>
          ))}
        </select>

        <label className="block">
          <span>Completed At</span>
          <Input
            type="datetime-local"
            name="completed_at"
            value={formData.completed_at}
            onChange={handleChange}
            className="mt-1"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="piko_victory_achieved"
            checked={formData.piko_victory_achieved}
            onChange={handleChange}
          />
          <span>Piko Victory Achieved</span>
        </label>

        <Input
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="border p-2 rounded-md"
        />

        <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
