import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!base64ServiceAccount) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is missing.',
      );
    }

    let serviceAccount;
    try {
      const decodedString = Buffer.from(
        base64ServiceAccount,
        'base64',
      ).toString('utf-8');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      serviceAccount = JSON.parse(decodedString);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is malformed or not a valid base64-encoded JSON string.',
      );
    }

    try {
      if (!getApps().length) {
        initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized successfully.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  get auth(): Auth {
    return getAuth();
  }

  get firestore(): Firestore {
    return getFirestore();
  }
}
