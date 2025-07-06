'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEnrollments = async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, status, progress, students(name), courses(title)')
      if (error) console.error('Error fetching enrollments:', error)
      else setEnrollments(data)
      setLoading(false)
    }
    fetchEnrollments()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this enrollment?')
    if (!confirm) return
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (!error) {
      setEnrollments(enrollments.filter((e) => e.id !== id))
    } else {
      console.error('Error deleting enrollment:', error)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Enrollments</h1>
        <Button
          onClick={() => router.push('/admin/enrollments/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Enrollment
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {enrollments.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">Student: {e.students?.name}</h2>
                <p>Course: {e.courses?.title}</p>
                <p>Status: {e.status}</p>
                <p>Progress: {e.progress}%</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => router.push(`/admin/enrollments/${e.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDelete(e.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
