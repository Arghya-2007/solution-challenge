import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Validation schema for environment variables using Joi.
 */
export const gcsConfigSchema = Joi.object({
  GCS_BUCKET_NAME: Joi.string().required(),
  MAX_FILE_SIZE_BYTES: Joi.number().default(524288000), // 500MB default
  ALLOWED_ORIGIN: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  PORT: Joi.number().default(3000),
  IMPERSONATE_SERVICE_ACCOUNT: Joi.string().optional(),
});

/**
 * Configuration factory for Google Cloud Storage settings.
 */
export default registerAs('gcs', () => {
  let credentials;
  const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (base64ServiceAccount && base64ServiceAccount !== '<YOUR_BASE64_ENCODED_JSON>') {
    try {
      const cleanBase64 = base64ServiceAccount.replace(/^"|"$/g, '').trim();
      const decodedServiceAccount = Buffer.from(cleanBase64, 'base64').toString('utf-8');
      credentials = JSON.parse(decodedServiceAccount);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
    }
  }

  return {
    bucketName: process.env.GCS_BUCKET_NAME,
    projectId: process.env.GCS_PROJECT_ID || 'equilens-e21e9',
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '524288000', 10),
    credentials,
    impersonatedServiceAccount: process.env.IMPERSONATE_SERVICE_ACCOUNT || 'csv-upload-signer@project-68c64ea9-e771-4bee-9f1.iam.gserviceaccount.com'
  };
});
