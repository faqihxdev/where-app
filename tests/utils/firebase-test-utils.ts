import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore, terminate } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'demo-test-project',
  apiKey: 'fake-api-key',
  appId: 'demo-app-id',
};

let testDb: Firestore | null = null;
let testAuth: Auth | null = null;

export const initializeTestEnvironment = async () => {
  let app: FirebaseApp;

  // Check if a Firebase app already exists
  if (getApps().length) {
    app = getApps()[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  // Initialize Firestore and Auth if they haven't been initialized
  if (!testDb) {
    testDb = getFirestore(app);
    connectFirestoreEmulator(testDb, 'localhost', 8181);
  }

  if (!testAuth) {
    testAuth = getAuth(app);
    connectAuthEmulator(testAuth, 'http://localhost:9099', { disableWarnings: true });
  }

  return { app, db: testDb, auth: testAuth };
};

export const cleanupTestEnvironment = async () => {
  if (testDb) {
    try {
      await terminate(testDb);
    } catch (error) {
      console.error('Error terminating Firestore:', error);
    }
    testDb = null;
  }

  // Only delete the app if it exists and we're not in a hot-reload situation
  const apps = getApps();
  if (apps.length) {
    try {
      await Promise.all(apps.map((app) => deleteApp(app)));
    } catch (error) {
      if (!/already-deleted/.test((error as Error).message)) {
        console.error('Error deleting Firebase app:', error);
      }
    }
  }

  testAuth = null;
};

// Updated clearAuthEmulator function
export const clearAuthEmulator = async () => {
  try {
    const response = await fetch(
      'http://localhost:9099/emulator/v1/projects/demo-test-project/accounts',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }, // Added Content-Type header
      }
    );

    console.log('🟩 Cleared Auth emulator');

    // Get all current users in the auth emulator
    const usersResponse = await fetch(
      'http://localhost:9099/emulator/v1/projects/demo-test-project/accounts'
    );
    console.log('🟩 Current users in Auth emulator:', await usersResponse.json());

    if (!response.ok) {
      throw new Error(`Failed to clear Auth emulator: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error clearing Auth emulator:', error);
    throw error; // Rethrow to ensure tests are aware of the failure
  }
};
