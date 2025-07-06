'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function EditSubmissionPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split('/')[3] // assuming /admin/student_submissions/[id]/edit

  const [formData, setFormData] = useState({
    student_id: '',
    mission_id: '',
    type: '',
    title: '',
    url: '',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from('student_submissions')
        .select('*')
        .eq('id', id)
        .single()
      if (error) {
        alert('Failed to load submission')
        console.error(error)
      } else if (data) {
        setFormData({
          student_id: data.student_id,
          mission_id: data.mission_id || '',
          type: data.type,
          title: data.title,
          url: data.url,
        })
      }
    }
    fetchSubmission()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('student_submissions')
      .update({
        student_id: formData.student_id,
        mission_id: formData.mission_id || null,
        type: formData.type,
        title: formData.title,
        url: formData.url,
      })
      .eq('id', id)

    setLoading(false)

    if (error) {
      alert('Failed to update submission: ' + error.message)
      console.error(error)
    } else {
      alert('Submission updated successfully!')
      router.push('/admin/submissions')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Student Submission</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* You can add selects for student_id and mission_id here similar to create page */}

        <Input
          name="type"
          placeholder="Type (photo, drawing, audio, video)"
          value={formData.type}
          onChange={handleChange}
          required
        />

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

        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 w-full">
          {loading ? 'Updating...' : 'Update Submission'}
        </Button>
      </form>
    </div>
  )
}
