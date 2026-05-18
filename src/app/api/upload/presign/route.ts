import { NextResponse } from 'next/server';
import { generatePresignedUrl, FolderPrefix } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const { fileName, fileType, folder } = await request.json();

    if (!fileName || !fileType || !folder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await generatePresignedUrl(fileName, fileType, folder as FolderPrefix);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Presign error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate presigned URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
