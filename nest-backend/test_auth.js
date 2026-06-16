const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const { auth } = require('google-auth-library');

async function test() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_BASE64="?([^"\n]+)"?/);
  const base64ServiceAccount = match ? match[1] : undefined;
  
  const decodedServiceAccount = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
  const credentials = JSON.parse(decodedServiceAccount);

  const sourceClient = auth.fromJSON(credentials);
  sourceClient.scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  const storage = new Storage({
    projectId: 'project-68c64ea9-e771-4bee-9f1',
  });

  const targetPrincipal = 'csv-upload-signer@project-68c64ea9-e771-4bee-9f1.iam.gserviceaccount.com';

  storage.authClient.getCredentials = async () => {
    return { client_email: targetPrincipal };
  };

  storage.authClient.sign = async (blobToSign) => {
    const res = await sourceClient.request({
      url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${targetPrincipal}:signBlob`,
      method: 'POST',
      data: {
        payload: Buffer.from(blobToSign).toString('base64'),
      }
    });
    return res.data.signedBlob;
  };

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
