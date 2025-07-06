'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MissionCompletionsPage() {
  const [completions, setCompletions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchCompletions() {
      const { data, error } = await supabase
        .from('mission_completions')
        .select(`
          id,
          completed_at,
          piko_victory_achieved,
          notes,
          students (name),
          daily_missions (activity_title)
        `)
      if (error) {
        console.error('Error loading mission completions:', error)
      } else {
        setCompletions(data)
      }
      setLoading(false)
    }
    fetchCompletions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mission completion?')) return
    const { error } = await supabase.from('mission_completions').delete().eq('id', id)
    if (!error) setCompletions(completions.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mission Completions</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push('/admin/mission_completions/create')}
        >
          Add Completion
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completions.map(completion => (
            <Card key={completion.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">Student: {completion.students?.name}</h2>
                <p>Mission: {completion.daily_missions?.activity_title}</p>
                <p>Completed At: {new Date(completion.completed_at).toLocaleString()}</p>
                <p>
                  Piko Victory: {completion.piko_victory_achieved ? 'Yes' : 'No'}
                </p>
                <p>Notes: {completion.notes || 'None'}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => router.push(`/admin/mission_completions/${completion.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 border-none"
                    onClick={() => handleDelete(completion.id)}
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
