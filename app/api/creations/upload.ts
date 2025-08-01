import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new formidable.IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // In production: Upload to Cloudinary/S3 here
    const fileUrl = `/uploads/${files.file.newFilename}`

    const creation = {
      id: Date.now(),
      childName: fields.childName,
      image: fileUrl,
      likes: 0,
      isPublic: fields.isPublic === 'true',
      createdAt: new Date().toISOString()
    }

    return res.status(200).json(creation)
  } catch (error: any) {
    console.error('Upload error:', error)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 5MB)' })
    }
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}