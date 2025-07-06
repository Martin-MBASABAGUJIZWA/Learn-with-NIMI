'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabaseClient'

export default function CreateSubmissionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    student_id: '',
    mission_id: '',
    type: 'photo',
    title: '',
    url: '',
  })
  const [students, setStudents] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStudentsAndMissions = async () => {
      const { data: studentData, error: studentError } = await supabase.from('students').select('id, name')
      if (studentError) {
        alert('Error fetching students: ' + studentError.message)
        console.error(studentError)
      } else {
        setStudents(studentData || [])
      }

      const { data: missionData, error: missionError } = await supabase.from('daily_missions').select('id, activity_title')
      if (missionError) {
        alert('Error fetching missions: ' + missionError.message)
        console.error(missionError)
      } else {
        setMissions(missionData || [])
      }
    }
    fetchStudentsAndMissions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('student_submissions').insert([formData])

    setLoading(false)

    if (error) {
      alert('Failed to add submission: ' + (error.message || JSON.stringify(error)))
      console.error('Insert error:', error)
    } else {
      alert('Submission added successfully!')
      router.push('/admin/submissions')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Student Submission</h1>
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
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          name="mission_id"
          value={formData.mission_id}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Mission (optional)</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.activity_title}
            </option>
          ))}
        </select>

        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="photo">Photo</option>
          <option value="drawing">Drawing</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>

        <Input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <Input
          name="url"
          placeholder="URL to submission"
          value={formData.url}
          onChange={handleChange}
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
