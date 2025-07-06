'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('student_submissions')
        .select('id, type, title, url, submitted_at, students(name), daily_missions(activity_title)')
      if (error) {
        console.error(error)
      } else {
        setSubmissions(data)
      }
      setLoading(false)
    }
    fetchSubmissions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return
    const { error } = await supabase.from('student_submissions').delete().eq('id', id)
    if (!error) setSubmissions(submissions.filter((s) => s.id !== id))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Submissions</h1>
        <Button onClick={() => router.push('/admin/student_submissions/create')} className="bg-blue-600 hover:bg-blue-700">
          Add Submission
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {submissions.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">Title: {sub.title}</h2>
                <p>Type: {sub.type}</p>
                <p>Student: {sub.students?.name || 'Unknown'}</p>
                <p>Mission: {sub.daily_missions?.activity_title || 'N/A'}</p>
                <p>
                  Submitted At: {new Date(sub.submitted_at).toLocaleString()}
                </p>
                <a
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Submission
                </a>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => router.push(`/admin/student_submissions/${sub.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(sub.id)}>
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
