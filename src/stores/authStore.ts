import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { fetchUserDataAtom, userDataAtom } from './userStore';
import { User } from '../types';

export const authUserAtom = atomWithStorage<FirebaseUser | null>('authUser', null);
export const isAuthenticatedAtom = atom((get) => get(authUserAtom) !== null);

/**
 * @description Initialize the auth state and fetch user data
 * @returns {Promise<void>} - A promise that resolves when the auth state is initialized
 */
export const initializeAuthAtom = atom(null, async (_, set): Promise<void> => {
  console.log('[authStore/initializeAuth]: Called');

  return new Promise((resolve) => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // If user is logged in, set the auth user atom and fetch user data
        if (user) {
          set(authUserAtom, user);
          await set(fetchUserDataAtom, user.uid);
        } else {
          // If user is logged out, set the auth user atom to null and clear user data
          set(authUserAtom, null);
          set(userDataAtom, null);
        }
      } catch (error) {
        console.error('[authStore/initializeAuth]: Error:', error);
      } finally {
        resolve();
      }
    });

    // Don't unsubscribe immediately to keep listening for auth state changes
    return () => unsubscribe();
  });
});

/**
 * @description Login with email and password & set the auth user atom
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<void>} - A promise that resolves when the login is successful
 */
export const loginAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }): Promise<void> => {
    console.log(`[authStore/login]: Logging in with: ${email} & ${password}`);

    try {
      // Sign in with email and password, then set the auth user atom and fetch user data
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);
      await set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error(`[authStore/login]: Login error: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Register with email and password & set the auth user atom
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @param {string} displayName - The display name of the user
 * @returns {Promise<void>} - A promise that resolves when the registration is successful
 */
export const registerAtom = atom(
  null,
  async (
    _,
    set,
    { email, password, displayName }: { email: string; password: string; displayName: string }
  ): Promise<void> => {
    console.log(`[authStore/register]: Registering with: ${email} & ${password} & ${displayName}`);
    try {
      // Create user with email and password, then set the auth user atom
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);

      // Create user document in Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        preferences: {
          name: displayName,
        },
        createdAt: new Date(),
      };

      // Set the user document in Firestore and fetch user data
      console.log('🔥[authStore/register]');
      await setDoc(doc(db, 'Users', userCredential.user.uid), newUser);
      await set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error(`[authStore/register]: Registration error: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Logout the user & set the auth user atom to null
 * @returns {Promise<void>} - A promise that resolves when the logout is successful
 */
export const logoutAtom = atom(null, async (_, set): Promise<void> => {
  console.log('[authStore/logout]: Called');
  try {
    // Sign out the user and set the auth user atom to null
    await signOut(auth);
    set(authUserAtom, null);
  } catch (error) {
    console.error(`[authStore/logout]: Logout error: ${error}`);
    throw error;
  }
});
