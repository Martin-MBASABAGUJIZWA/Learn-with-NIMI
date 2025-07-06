'use client'

import { useState } from 'react'

export default function TestStudentForm() {
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const form = e.target
    const data = {
      name: form.name.value,
      email: form.email.value,
      age: parseInt(form.age.value),
      class_level: form.class_level.value,
      avatar_url: form.avatar_url.value
    }

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await res.json()
    if (res.ok) {
      setMessage(`✅ Student created: ${result.student.name}`)
    } else {
      setMessage(`❌ Error: ${result.error}`)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create Student</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Name" required className="w-full p-2 border rounded" />
        <input name="email" placeholder="Email" type="email" required className="w-full p-2 border rounded" />
        <input name="age" placeholder="Age" type="number" required className="w-full p-2 border rounded" />
        <input name="class_level" placeholder="Class Level" required className="w-full p-2 border rounded" />
        <input name="avatar_url" placeholder="Avatar URL" className="w-full p-2 border rounded" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Student</button>
      </form>
      <p className="mt-4 text-sm text-gray-700">{message}</p>
    </div>
  )
}
