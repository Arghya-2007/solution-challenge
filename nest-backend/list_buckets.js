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

storage.getBuckets().then(([buckets]) => {
  console.log('Available buckets:');
  buckets.forEach(b => console.log(b.name));
}).catch(console.error);
