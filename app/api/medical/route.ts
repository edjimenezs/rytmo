import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as DocumentType | null;

    const where: any = { userId };
    
    if (type) {
      where.type = type;
    }

      const documents = await prisma.medicalDocument.findMany({
      where,
      orderBy: {
        testDate: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        testDate: true,
        uploadedAt: true,
        processed: true,
      },
    });

    const totalCount = await prisma.medicalDocument.count({
      where,
    });

    // Group by type for easier frontend consumption
    const groupedByType = documents.reduce((acc, doc) => {
      if (!acc[doc.type]) {
        acc[doc.type] = [];
      }
      acc[doc.type].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);

    return NextResponse.json({
      documents,
      groupedByType,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error fetching medical documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Verify document belongs to user
    const document = await prisma.medicalDocument.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from storage (if using file system, otherwise S3)
    // For now, we'll just delete from database
    // TODO: Implement file deletion from storage

    await prisma.medicalDocument.delete({
      where: {
        id: documentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medical document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

