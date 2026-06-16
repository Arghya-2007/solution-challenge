const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const decodedString = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decodedString);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const db = getFirestore();

async function testQuery() {
    try {
        const history = await db.collectionGroup('history').get();
        history.forEach(doc => {
            const data = doc.data();
            console.log(doc.id, '->', data.type, data.date);
            if (data.date && data.date.toDate) {
                console.log('Valid date:', data.date.toDate().toISOString());
            } else {
                console.log('Invalid date field type:', typeof data.date, data.date);
            }
        });
    } catch (e) {
        console.error('Error querying:', e.message);
    }
}

testQuery();
