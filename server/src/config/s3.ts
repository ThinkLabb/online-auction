// src/config/s3.ts
import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AAWS_REGION,
  credentials: {
    accessKeyId: process.env.AAWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AAWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.AAWS_BUCKET_NAME!;
