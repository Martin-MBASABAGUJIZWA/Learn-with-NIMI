'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditEnrollmentPage() {
  const router = useRouter()
  const params = useParams()
  const [enrollment, setEnrollment] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchEnrollment = async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', params.id)
        .single()
      if (error) console.error(error)
      else {
        setEnrollment(data)
        setStatus(data.status)
        setProgress(data.progress)
      }
    }
    if (params.id) fetchEnrollment()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('enrollments')
      .update({ status, progress: Number(progress) })
      .eq('id', params.id)
    if (!error) router.push('/admin/enrollments')
    else alert('Update failed: ' + error.message)
  }

  if (!enrollment) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Enrollment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Status</Label>
          <Select onValueChange={setStatus} defaultValue={status}>
            <SelectTrigger>
              <SelectValue placeholder="Choose status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Progress (%)</Label>
          <Input
            type="number"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            min={0}
            max={100}
            placeholder="0"
          />
        </div>

        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          Save Changes
        </Button>
      </form>
    </div>
  )
}
