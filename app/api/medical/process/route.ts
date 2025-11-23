import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { extractTextFromFile } from '@/lib/medical/pdfExtractor';
import { parseLabResults } from '@/lib/medical/labParser';
import { join } from 'path';

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
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document
    const document = await prisma.medicalDocument.findFirst({
      where: {
        id: documentId,
        userId,
        type: 'LAB_RESULT',
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or not a lab result' },
        { status: 404 }
      );
    }

    // Allow re-processing - delete old lab values first
    if (document.processed) {
      // Delete existing lab values for this document
      await prisma.labValue.deleteMany({
        where: {
          documentId,
        },
      });
    }

    // Extract text from file
    const filePath = join(process.cwd(), 'public', document.fileUrl);
    let extractedText: string;
    
    try {
      extractedText = await extractTextFromFile(filePath, document.mimeType);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to extract text from document' },
        { status: 400 }
      );
    }

    // Parse lab results
    const labValues = parseLabResults(extractedText);
    
    // Log extracted text for debugging (first 1000 chars)
    console.log('Extracted text (first 1000 chars):', extractedText.substring(0, 1000));
    console.log('Parsed lab values:', JSON.stringify(labValues, null, 2));

    if (labValues.length === 0) {
      // Update document with extracted text but mark as processed even if no values found
      await prisma.medicalDocument.update({
        where: { id: documentId },
        data: {
          extractedText,
          processed: true,
        },
      });

      return NextResponse.json({
        message: 'Text extracted but no lab values found',
        extractedText: extractedText.substring(0, 2000), // Return first 2000 chars for debugging
        labValues: [],
        debug: {
          textLength: extractedText.length,
          firstLines: extractedText.split('\n').slice(0, 20),
        },
      });
    }

    // Save extracted text and lab values
    await prisma.$transaction(async (tx) => {
      // Update document
      await tx.medicalDocument.update({
        where: { id: documentId },
        data: {
          extractedText,
          processed: true,
        },
      });

      // Create lab values
      for (const labValue of labValues) {
        await tx.labValue.create({
          data: {
            documentId,
            userId,
            testName: labValue.testName,
            value: labValue.value,
            unit: labValue.unit || null,
            referenceRange: labValue.referenceRange || null,
            status: labValue.status || null,
            testDate: document.testDate,
          },
        });
      }
    });

    return NextResponse.json({
      message: 'Document processed successfully',
      labValuesCount: labValues.length,
      labValues,
    });
  } catch (error) {
    console.error('Error processing medical document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}

