import { NextRequest, NextResponse } from 'next/server';
import { DocumentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/auth/utils';

function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && Object.values(DocumentType).includes(value as DocumentType);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const formData = await request.formData();

    const fileEntry = formData.get('file');
    const titleEntry = formData.get('title');
    const descriptionEntry = formData.get('description');
    const typeEntry = formData.get('type');
    const testDateEntry = formData.get('testDate');

    if (!(fileEntry instanceof File) || typeof titleEntry !== 'string' || !titleEntry.trim()) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    if (!isDocumentType(typeEntry)) {
      return NextResponse.json(
        { error: 'Document type is required and must be valid' },
        { status: 400 }
      );
    }

    const file = fileEntry;
    const title = titleEntry;
    const description = typeof descriptionEntry === 'string' ? descriptionEntry : null;
    const type = typeEntry;
    const testDate = typeof testDateEntry === 'string' && testDateEntry.trim()
      ? new Date(testDateEntry)
      : null;

    if (testDate && Number.isNaN(testDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid test date format' },
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
