'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import supabase from '@/lib/supabaseClient'

export default function EditDailyMissionPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [formData, setFormData] = useState({
    day_number: '',
    title: '',
    mission_time: 'morning',
    activity_title: '',
    objectives: '',
    description: '',
    piko_victory: '',
    video_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const fetchMission = async () => {
      const { data, error } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        alert('Failed to load mission')
        console.error(error)
        router.push('/admin/daily_missions')
        return
      }

      if (data) {
        setFormData({
          day_number: data.day_number.toString(),
          title: data.title,
          mission_time: data.mission_time,
          activity_title: data.activity_title,
          objectives: data.objectives || '',
          description: data.description || '',
          piko_victory: data.piko_victory || '',
          video_url: data.video_url || '',
        })
      }
      setLoadingData(false)
    }
    fetchMission()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('daily_missions')
      .update({
        day_number: parseInt(formData.day_number),
        title: formData.title,
        mission_time: formData.mission_time,
        activity_title: formData.activity_title,
        objectives: formData.objectives,
        description: formData.description,
        piko_victory: formData.piko_victory,
        video_url: formData.video_url,
      })
      .eq('id', id)

    setLoading(false)

    if (error) {
      alert('Failed to update mission')
      console.error(error)
    } else {
      router.push('/admin/daily_missions')
    }
  }

  if (loadingData) return <p className="p-6">Loading mission data...</p>

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Daily Mission</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="day_number" type="number" placeholder="Day Number (1–8)" value={formData.day_number} onChange={handleChange} required />
        <Input name="title" placeholder="Mission Title" value={formData.title} onChange={handleChange} required />
        <select
          name="mission_time"
          value={formData.mission_time}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="morning">Morning</option>
          <option value="midday">Midday</option>
          <option value="afternoon">Afternoon</option>
        </select>
        <Input name="activity_title" placeholder="Activity Title" value={formData.activity_title} onChange={handleChange} required />
        <Textarea name="objectives" placeholder="Objectives" value={formData.objectives} onChange={handleChange} />
        <Textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
        <Input name="piko_victory" placeholder="Piko Victory Reward" value={formData.piko_victory} onChange={handleChange} />
        <Input name="video_url" placeholder="Video URL" value={formData.video_url} onChange={handleChange} />

        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 w-full">
          {loading ? 'Updating...' : 'Update Mission'}
        </Button>
      </form>
    </div>
  )
}
