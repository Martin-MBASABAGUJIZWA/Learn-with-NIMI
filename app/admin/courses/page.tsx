'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('courses').select('*')
      if (error) console.error('Error fetching courses:', error)
      else setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this course?')
    if (!confirm) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (!error) setCourses(courses.filter((c: any) => c.id !== id))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button
          onClick={() => router.push('/admin/courses/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Course
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card key={course.id}>
              <CardContent className="space-y-2 p-4">
                <h2 className="font-semibold">{course.title}</h2>
                <p className="text-sm text-muted-foreground">{course.description}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDelete(course.id)}
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
