'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import supabase from '@/lib/supabaseClient'  // default import style
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    class_level: '',
    avatar_url: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchStudent = async () => {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single()
      if (error) {
        setError(error.message)
      } else if (data) {
        setFormData({
          name: data.name,
          email: data.email,
          age: data.age?.toString() || '',
          class_level: data.class_level || '',
          avatar_url: data.avatar_url || ''
        })
      }
    }

    fetchStudent()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsedAge = parseInt(formData.age)
    const { error } = await supabase
      .from('students')
      .update({
        ...formData,
        age: isNaN(parsedAge) ? null : parsedAge
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/students')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Edit Student</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" value={formData.email} onChange={handleChange} required type="email" />
            </div>
            <div>
              <Label>Age</Label>
              <Input name="age" value={formData.age} onChange={handleChange} required type="number" />
            </div>
            <div>
              <Label>Class Level</Label>
              <Input name="class_level" value={formData.class_level} onChange={handleChange} required />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input name="avatar_url" value={formData.avatar_url} onChange={handleChange} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Student'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
