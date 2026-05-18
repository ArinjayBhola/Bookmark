import { NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const bucketName = process.env.R2_BUCKET_NAME || 'terrain-vault';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'No key provided' }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'Object body empty' }, { status: 404 });
    }

    // Convert S3 stream to web stream
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: unknown) {
    console.error('Media proxy error:', error);
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }
}
