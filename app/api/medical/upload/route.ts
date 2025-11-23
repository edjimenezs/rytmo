import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const type = formData.get('type') as DocumentType;
    const testDate = formData.get('testDate') as string | null;

    if (!file || !title || !type) {
      return NextResponse.json(
        { error: 'File, title, and type are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: PDF, images, Word documents' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'medical');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userId}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL (relative to public folder)
    const fileUrl = `/uploads/medical/${fileName}`;

    // Save document to database
    const document = await prisma.medicalDocument.create({
      data: {
        userId,
        title,
        description: description || null,
        type: type as DocumentType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        testDate: testDate ? new Date(testDate) : null,
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        type: document.type,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        testDate: document.testDate,
        uploadedAt: document.uploadedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading medical document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}


