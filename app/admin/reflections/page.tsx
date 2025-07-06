'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchReflections() {
      const { data, error } = await supabase
        .from('student_reflections')
        .select(`
          id,
          day_number,
          favorite_mission_title,
          reflection,
          students(name)
        `)
      if (!error) setReflections(data || [])
      setLoading(false)
    }
    fetchReflections()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this reflection?')
    if (!confirm) return
    const { error } = await supabase.from('student_reflections').delete().eq('id', id)
    if (!error) setReflections(reflections.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Reflections</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push('/admin/reflections/create')}
        >
          Add Reflection
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {reflections.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">Student: {r.students?.name}</h2>
                <p>Day: {r.day_number}</p>
                <p>Favorite Mission: {r.favorite_mission_title}</p>
                <p>Reflection: {r.reflection}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="text-green-600 border border-green-600 hover:bg-green-50"
                    variant="outline"
                    onClick={() => router.push(`/admin/reflections/${r.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDelete(r.id)}
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
