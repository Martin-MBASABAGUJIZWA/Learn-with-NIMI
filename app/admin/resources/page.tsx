'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchResources() {
      const { data, error } = await supabase.from('resources').select('*')
      if (!error) setResources(data || [])
      setLoading(false)
    }
    fetchResources()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (!error) setResources(resources.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Learning Resources</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push('/admin/resources/create')}
        >
          Add Resource
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {resources.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">{r.title}</h2>
                <p>Type: {r.type}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View Resource
                </a>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="text-green-600 border border-green-600 hover:bg-green-50"
                    variant="outline"
                    onClick={() => router.push(`/admin/resources/${r.id}/edit`)}
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
