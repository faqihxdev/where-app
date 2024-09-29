import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchUserDataAtom } from './userStore';
import { User } from '../types';

export const authUserAtom = atomWithStorage<FirebaseUser | null>('authUser', null);
export const authLoadingAtom = atom(true);

export const isAuthenticatedAtom = atom(
  (get) => {
    console.log('[authStore/isAuthenticatedAtom]: called');
    return get(authUserAtom) !== null;
  }
);

/**
 * @description Initialize the auth state and fetch user data
 * @returns {Function} - The unsubscribe function
 */
export const initializeAuthAtom = atom(null, (_, set) => {
  console.log('[authStore/initializeAuthAtom]: called');
  set(authLoadingAtom, true);
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    set(authUserAtom, user);
    if (user) {
      set(fetchUserDataAtom, user.uid);
    }
    set(authLoadingAtom, false);
  });
  return unsubscribe;
});

/**
 * @description Login with email and password & set the auth user atom
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<void>} - A promise that resolves when the login is successful
 */
export const loginAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
    console.log('[authStore/loginAtom]: email:', email, 'password:', password);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);
      
      // Fetch user data
      set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error('[authStore/loginAtom]: Login error:', error);
      throw error;
    }
  }
);

/**
 * @description Register with email and password & set the auth user atom
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<void>} - A promise that resolves when the registration is successful
 */
export const registerAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
    console.log('[authStore/registerAtom]: email:', email, 'password:', password);
    try {
      console.log('Registering user:', email, password);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);

      // Create user document in Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'Users', userCredential.user.uid), newUser);

      // Fetch user data
      set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error('[authStore/registerAtom]: Registration error:', error);
      throw error;
    }
  }
);

/**
 * @description Logout the user & set the auth user atom to null
 * @returns {Promise<void>} - A promise that resolves when the logout is successful
 */
export const logoutAtom = atom(
  null,
  async (_, set) => {
    console.log('[authStore/logoutAtom]: called');
    try {
      await signOut(auth);
      set(authUserAtom, null);
    } catch (error) {
      console.error('[authStore/logoutAtom]: Logout error:', error);
      throw error;
    }
  }
);