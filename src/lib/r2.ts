import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID || 'mock_account_id';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || 'mock_access_key';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'mock_secret_key';
const bucketName = process.env.R2_BUCKET_NAME || 'terrain-vault';

const isMock = accountId === 'mock_account_id' || accessKeyId === 'mock_access_key';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export type FolderPrefix = 'images' | 'videos' | 'gpx' | 'documents' | 'maps';

export async function generatePresignedUrl(fileName: string, fileType: string, folder: FolderPrefix) {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}-${cleanFileName}`;

  if (isMock) {
    // Return mock signed URL for local development when credentials are not supplied
    const isVideo = folder === 'videos';
    return {
      uploadUrl: `https://mock-r2-upload.example.com/upload?key=${encodeURIComponent(key)}`,
      key,
      publicUrl: isVideo
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80`, // Beautiful alpine fallback image/video for mock uploads
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
    publicUrl: `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`,
  };
}

export async function deleteR2Object(key: string) {
  if (isMock) return true;

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
  return true;
}
