'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from('students').select('*')
      if (error) console.error('Error fetching students:', error)
      else setStudents(data)
      setLoading(false)
    }
    fetchStudents()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button
          onClick={() => router.push('/admin/students/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Student
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {students.map((student: any) => (
            <Card key={student.id}>
              <CardContent className="space-y-2 p-4">
                <h2 className="font-semibold">{student.name}</h2>
                <p className="text-sm text-muted-foreground">{student.email}</p>
                <p className="text-sm">Class: {student.class_level}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/admin/students/${student.id}/edit`)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const confirm = window.confirm('Are you sure you want to delete this student?')
                      if (!confirm) return
                      const { error } = await supabase.from('students').delete().eq('id', student.id)
                      if (!error) setStudents(students.filter((s: any) => s.id !== student.id))
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
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
