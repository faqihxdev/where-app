import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { getDefaultStore } from 'jotai';
import { collection, deleteDoc, Firestore, getDocs, doc, getDoc } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  clearAuthEmulator,
} from '../utils/firebase-test-utils';
import {
  registerAtom,
  authUserAtom,
  changePasswordAtom,
  deleteAccountAtom,
  loginAtom,
} from '../../src/stores/authStore';
import { userDataAtom } from '../../src/stores/userStore';

describe('authStore', () => {
  const store = getDefaultStore();
  let db: Firestore;
  let auth: Auth;

  beforeAll(async () => {
    const env = await initializeTestEnvironment();
    db = env.db;
    auth = env.auth;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    try {
      // Clear Auth emulator
      await clearAuthEmulator();

      // Clean up Users collection
      const users = await getDocs(collection(db, 'Users'));
      await Promise.all(users.docs.map((doc) => deleteDoc(doc.ref)));

      // Reset the Jotai store
      store.set(authUserAtom, null);
      store.set(userDataAtom, null);

      // Sign out any existing user
      await auth.signOut();
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  });

  describe('registerAtom', () => {
    it('should register a new user and create user document', async () => {
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      await store.set(registerAtom, testUser);

      // Check auth state
      const authUser = store.get(authUserAtom);
      expect(authUser).toBeDefined();
      expect(authUser?.email).toBe(testUser.email);

      // Check user data in Firestore
      const userDoc = await getDoc(doc(db, 'Users', authUser!.uid));
      expect(userDoc.exists()).toBe(true);

      const userData = userDoc.data();
      expect(userData).toEqual({
        uid: authUser!.uid,
        email: testUser.email,
        preferences: {
          name: testUser.displayName,
        },
        // Instead of directly comparing the date, we'll check if it exists and is a Timestamp
        createdAt: expect.any(Object),
      });

      // Optional: Add additional checks for the timestamp if needed
      expect(userData?.createdAt).toHaveProperty('seconds');
      expect(userData?.createdAt).toHaveProperty('nanoseconds');

      // Check local user data state
      const localUserData = store.get(userDataAtom);
      expect(localUserData).toEqual({
        uid: authUser!.uid,
        email: testUser.email,
        preferences: {
          name: testUser.displayName,
        },
        createdAt: expect.any(Date),
      });
    });

    it('should throw error when registering with invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
        displayName: 'Test User',
      };

      await expect(store.set(registerAtom, invalidUser)).rejects.toThrow();
    });

    it('should throw error when registering with weak password', async () => {
      const weakPasswordUser = {
        email: 'test@example.com',
        password: '123', // too short
        displayName: 'Test User',
      };

      await expect(store.set(registerAtom, weakPasswordUser)).rejects.toThrow();
    });
  });

  describe('changePasswordAtom', () => {
    it('should successfully change user password', async () => {
      // First register a user
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      await store.set(registerAtom, testUser);

      // Try changing the password
      const passwordChange = {
        currentPassword: 'password123',
        newPassword: 'newPassword123',
      };

      await expect(store.set(changePasswordAtom, passwordChange)).resolves.not.toThrow();

      // Verify we can login with new password
      await auth.signOut();
      await expect(
        store.set(loginAtom, { email: testUser.email, password: 'newPassword123' })
      ).resolves.not.toThrow();
    });

    it('should throw error when current password is incorrect', async () => {
      // First register a user
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      await store.set(registerAtom, testUser);

      // Try changing the password with wrong current password
      const passwordChange = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      await expect(store.set(changePasswordAtom, passwordChange)).rejects.toThrow();
    });

    it('should throw error when new password is too weak', async () => {
      // First register a user
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      await store.set(registerAtom, testUser);

      // Try changing to a weak password
      const passwordChange = {
        currentPassword: 'password123',
        newPassword: '123',
      };

      await expect(store.set(changePasswordAtom, passwordChange)).rejects.toThrow();
    });
  });

  describe('deleteAccountAtom', () => {
    it('should successfully delete user account and all associated data', async () => {
      // First register a user
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      await store.set(registerAtom, testUser);

      const authUser = store.get(authUserAtom);
      const uid = authUser!.uid;

      // Delete the account
      await store.set(deleteAccountAtom, testUser.password);

      // Verify auth state is cleared
      expect(store.get(authUserAtom)).toBeNull();
      expect(store.get(userDataAtom)).toBeNull();

      // Verify user document is deleted from Firestore
      const userDoc = await getDoc(doc(db, 'Users', uid));
      expect(userDoc.exists()).toBe(false);

      // Verify we can't login with deleted account
      await expect(
        store.set(loginAtom, { email: testUser.email, password: testUser.password })
      ).rejects.toThrow();
    });

    it('should throw error when password is incorrect', async () => {
      // First register a user
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      await store.set(registerAtom, testUser);

      // Try deleting with wrong password
      await expect(store.set(deleteAccountAtom, 'wrongPassword')).rejects.toThrow();

      // Verify user still exists
      const authUser = store.get(authUserAtom);
      expect(authUser).not.toBeNull();

      const userDoc = await getDoc(doc(db, 'Users', authUser!.uid));
      expect(userDoc.exists()).toBe(true);
    });

    it('should throw error when user is not authenticated', async () => {
      // Try deleting without being logged in
      await auth.signOut();
      store.set(authUserAtom, null);

      await expect(store.set(deleteAccountAtom, 'anyPassword')).rejects.toThrow(
        'User not authenticated'
      );
    });
  });
});
