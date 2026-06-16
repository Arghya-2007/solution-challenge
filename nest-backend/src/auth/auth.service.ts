import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase-admin/firestore';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (getApps().length > 0) {
      return;
    }

    const base64ServiceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    
    if (!base64ServiceAccount || base64ServiceAccount === '<YOUR_BASE64_ENCODED_JSON>') {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set or uses placeholder. Firebase Admin SDK will not initialize properly.');
      return;
    }

    try {
      const decodedServiceAccount = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
      const credentials = JSON.parse(decodedServiceAccount);

      initializeApp({
        credential: cert(credentials),
      });
      this.logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
      throw error;
    }
  }

  getAuth() {
    return getFirebaseAuth();
  }

  getFirestore() {
    return getFirebaseFirestore();
  }
}
