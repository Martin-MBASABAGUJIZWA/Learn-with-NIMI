'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function EditReflectionPage() {
  const router = useRouter()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    student_id: '',
    day_number: '',
    favorite_mission_title: '',
    reflection: ''
  })
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: reflection, error: reflectionError } = await supabase
        .from('student_reflections')
        .select('*')
        .eq('id', id)
        .single()

      const { data: studentData } = await supabase.from('students').select('id, name')

      if (reflection) setFormData(reflection)
      if (studentData) setStudents(studentData)
      setLoading(false)

      if (reflectionError) console.error(reflectionError)
    }
    fetchData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('student_reflections')
      .update(formData)
      .eq('id', id)

    if (error) {
      console.error('Update error:', error)
      alert('Failed to update reflection')
    } else {
      router.push('/admin/reflections')
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Student Reflection</h1>
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
          placeholder="Reflection"
          className="w-full border rounded p-2 min-h-[100px]"
          required
        />

        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 w-full"
        >
          Update Reflection
        </Button>
      </form>
    </div>
  )
}
