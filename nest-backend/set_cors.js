const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const creds = JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
const storage = new Storage({ projectId: 'equilens-e21e9', credentials: creds });
storage.createBucket(env.GCS_BUCKET_NAME).then(([bucket]) => {
  console.log('Bucket created:', bucket.name);
  return bucket.setCorsConfiguration([
    { origin: ['*'], method: ['GET', 'PUT', 'POST', 'OPTIONS'], responseHeader: ['Content-Type'], maxAgeSeconds: 3600 }
  ]);
}).then(() => console.log('CORS set successfully!')).catch(console.error);
