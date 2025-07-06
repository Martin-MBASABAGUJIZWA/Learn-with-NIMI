'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import supabase from '@/lib/supabaseClient'

export default function CreateResourcePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    url: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.title.trim()) {
      alert('Title is required')
      setLoading(false)
      return
    }
    const allowedTypes = ['video', 'pdf', 'image', 'audio']
    if (!allowedTypes.includes(formData.type)) {
      alert('Invalid resource type')
      setLoading(false)
      return
    }
    try {
      new URL(formData.url)
    } catch {
      alert('Invalid URL format')
      setLoading(false)
      return
    }

    // Insert
    const { error } = await supabase.from('resources').insert([formData])

    setLoading(false)

    if (error) {
      alert(`Failed to add resource: ${error.message || JSON.stringify(error)}`)
      console.error('Insert error details:', error)
    } else {
      router.push('/admin/resources')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Resource</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <Textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          required
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
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
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </div>
  )
}
