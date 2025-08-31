// app/api/creations/upload/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface Creation {
  id: number;
  childName: string;
  age: number;
  creation: string;
  type: string;
  likes: number;
  image: string;
  mission: string;
  emoji: string;
  isPublic: boolean;
  createdAt: string;
  description?: string;
}

// Configuration
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function POST(request: Request) {
  try {
    // 1. Parse form data
    const formData = await request.formData();
    
    // 2. Validate required fields
    const file = formData.get('file') as File | null;
    const childName = formData.get('childName') as string | null;
    const description = formData.get('description') as string | null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded' }, { status: 400 });
    }

    if (!childName || childName.trim().length < 2) {
      return NextResponse.json({ error: 'Child name must be at least 2 characters' }, { status: 400 });
    }

    // 3. Validate file properties
    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxSize: MAX_FILE_SIZE,
        actualSize: file.size
      }, { status: 413 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Unsupported file type',
        allowedTypes: ALLOWED_MIME_TYPES,
        receivedType: file.type
      }, { status: 415 });
    }

    // 4. Prepare upload directory
    try {
      await fs.access(UPLOAD_DIR);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
      } else {
        throw err;
      }
    }

    // 5. Process and save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9-_.]/g, '').replace(/\s+/g, '-');
    const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    try {
      await fs.writeFile(filePath, buffer);

      // Verify file was written correctly
      const stats = await fs.stat(filePath);
      if (stats.size !== buffer.length) {
        await fs.unlink(filePath).catch(() => {});
        return NextResponse.json({ error: 'File write verification failed' }, { status: 500 });
      }
    } catch (err: any) {
      console.error('File system error:', err);
      if (err.code === 'ENOSPC') {
        return NextResponse.json({ error: 'Server storage is full. Please try again later.' }, { status: 507 });
      }
      return NextResponse.json({ error: 'Failed to save file to server' }, { status: 500 });
    }

    // 6. Create response data
    const creation: Creation = {
      id: Date.now(),
      childName: childName.trim(),
      age: 3, // Default age
      creation: description?.trim() || 'Artwork',
      type: fileExt,
      likes: 0,
      image: `/uploads/${uniqueFilename}`,
      mission: 'Share creativity',
      emoji: '🎨',
      isPublic,
      description: description?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(creation, {
      status: 201,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });

  } catch (err: any) {
    console.error('Server error during upload:', err);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
