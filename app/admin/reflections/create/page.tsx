'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function CreateReflectionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    student_id: '',
    day_number: '',
    favorite_mission_title: '',
    reflection: ''
  })
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase.from('students').select('id, name')
      if (!error) setStudents(data || [])
    }
    fetchStudents()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('student_reflections').insert([formData])

    setLoading(false)
    if (error) {
      console.error('Error:', error)
      alert('Failed to submit reflection')
    } else {
      router.push('/admin/reflections')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Student Reflection</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="student_id"
          value={formData.student_id}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <Input
          type="number"
          name="day_number"
          min={1}
          max={8}
          value={formData.day_number}
          onChange={handleChange}
          placeholder="Day number (1–8)"
          required
        />

        <Input
          name="favorite_mission_title"
          value={formData.favorite_mission_title}
          onChange={handleChange}
          placeholder="Favorite Mission Title"
          required
        />

        <textarea
          name="reflection"
          value={formData.reflection}
          onChange={handleChange}
          placeholder="Student's Reflection"
          className="w-full border rounded p-2 min-h-[100px]"
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </div>
  )
}
