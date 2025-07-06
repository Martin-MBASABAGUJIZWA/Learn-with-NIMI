'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function CreateResourcePage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    title: '',
    description: '',
    type: 'video',
    url: '',
  })

  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchStudentsAndCourses() {
      const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name')
      const { data: coursesData, error: coursesError } = await supabase.from('courses').select('id, title')
      if (studentsError) console.error('Error loading students:', studentsError)
      if (coursesError) console.error('Error loading courses:', coursesError)
      setStudents(studentsData || [])
      setCourses(coursesData || [])
    }
    fetchStudentsAndCourses()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('resources').insert([
      {
        student_id: formData.student_id,
        course_id: formData.course_id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.url,
      }
    ])

    setLoading(false)

    if (error) {
      alert('Failed to add resource: ' + error.message)
      console.error('Insert error:', error)
      return
    }

    router.push('/admin/resources')
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Resource</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="student_id"
          value={formData.student_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          name="course_id"
          value={formData.course_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <Input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <Textarea
          name="description"
          placeholder="Description (optional)"
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />

        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="audio">Audio</option>
        </select>

        <Input
          name="url"
          placeholder="Resource URL"
          value={formData.url}
          onChange={handleChange}
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Adding...' : 'Add Resource'}
        </Button>
      </form>
    </div>
  )
}
