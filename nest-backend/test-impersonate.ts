import { Storage } from '@google-cloud/storage';
import { auth, Impersonated } from 'google-auth-library';
import * as fs from 'fs';

async function test() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_BASE64="?([^"\n]+)"?/);
  const base64ServiceAccount = match ? match[1] : undefined;
  
  let credentials;
  if (base64ServiceAccount) {
    const decodedServiceAccount = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
    credentials = JSON.parse(decodedServiceAccount);
  }

  console.log("Credentials parsed:", !!credentials);

  const sourceClient = auth.fromJSON(credentials);
  (sourceClient as any).scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  const authClient = new Impersonated({
    sourceClient: sourceClient as any,
    targetPrincipal: 'csv-upload-signer@project-68c64ea9-e771-4bee-9f1.iam.gserviceaccount.com',
    targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    lifetime: 3600,
  });

  const storage = new Storage({
    projectId: 'equilens-e21e9',
    authClient: authClient as any,
  });

  const bucket = storage.bucket('equilens--csv-uploads-prod');
  const file = bucket.file('test.csv');
  try {
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: 'text/csv',
    });
    console.log("SUCCESS:", url);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();

