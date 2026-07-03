import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { initializeApp, cert, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { MockAuth, MockFirestore, MockStorage } from './mock-providers';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App | null = null;
  private isMockMode = true;

  private mockAuthInstance!: MockAuth;
  private mockFirestoreInstance!: MockFirestore;
  private mockStorageInstance!: MockStorage;

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      try {
        const formattedKey = privateKey.replace(/\\n/g, '\n');
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedKey,
          }),
          storageBucket: `${projectId}.appspot.com`,
        });
        this.isMockMode = false;
        this.logger.log('Firebase Admin SDK initialized successfully.');
      } catch (err: any) {
        this.logger.error(`Failed to initialize Firebase Admin SDK: ${err.message}. Falling back to mock database.`);
      }
    } else {
      this.logger.warn('Firebase credentials missing in backend environment (.env). Instantiating Local Mock Database...');
    }

    if (this.isMockMode) {
      const dbPath = path.join(process.cwd(), '.db');
      this.mockAuthInstance = new MockAuth(dbPath);
      this.mockFirestoreInstance = new MockFirestore(dbPath);
      this.mockStorageInstance = new MockStorage();
      this.logger.log(`Mock JSON database running locally at: ${dbPath}`);
    }
  }

  get isMock(): boolean {
    return this.isMockMode;
  }

  auth(): any {
    if (this.isMockMode) {
      return this.mockAuthInstance;
    }
    return getAuth(this.firebaseApp!);
  }

  db(): any {
    if (this.isMockMode) {
      return this.mockFirestoreInstance;
    }
    return getFirestore(this.firebaseApp!);
  }

  storage(): any {
    if (this.isMockMode) {
      return this.mockStorageInstance;
    }
    return getStorage(this.firebaseApp!);
  }
}
