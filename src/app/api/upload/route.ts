import { NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const bucketName = process.env.R2_BUCKET_NAME || 'terrain-vault';
const accountId = process.env.R2_ACCOUNT_ID || 'mock_account_id';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'documents';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${cleanFileName}`;

    if (process.env.R2_ACCOUNT_ID === 'mock_account_id' || !process.env.R2_ACCOUNT_ID) {
      return NextResponse.json({
        url: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80`,
        key,
        size: file.size,
        mimeType: file.type,
        name: file.name,
      });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    return NextResponse.json({
      url: `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`,
      key,
      size: file.size,
      mimeType: file.type,
      name: file.name,
    });
  } catch (error: unknown) {
    console.error('Direct upload error:', error);
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
