'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateEnrollmentPage() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [status, setStatus] = useState('enrolled')
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const [studentsRes, coursesRes] = await Promise.all([
        supabase.from('students').select('id, name'),
        supabase.from('courses').select('id, title'),
      ])
      if (studentsRes.data) setStudents(studentsRes.data)
      if (coursesRes.data) setCourses(coursesRes.data)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('enrollments').insert({
      student_id: studentId,
      course_id: courseId,
      status,
      progress: Number(progress),
    })
    if (!error) router.push('/admin/enrollments')
    else alert('Failed to create enrollment: ' + error.message)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Enrollment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Student</Label>
          <Select onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Course</Label>
          <Select onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select onValueChange={setStatus} defaultValue="enrolled">
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

        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Save Enrollment
        </Button>
      </form>
    </div>
  )
}
