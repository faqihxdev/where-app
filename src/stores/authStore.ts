import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { fetchUserDataAtom, userDataAtom } from './userStore';
import { User } from '../types';

export const authUserAtom = atomWithStorage<FirebaseUser | null>('authUser', null);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        throw new Error('Email not verified');
      }

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);

      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        preferences: {
          name: displayName,
        },
        createdAt: new Date(),
      };

      console.log('🔥[authStore/register]');
      await setDoc(doc(db, 'Users', userCredential.user.uid), newUser);
      await set(fetchUserDataAtom, userCredential.user.uid);

      // Send verification email
      await sendEmailVerification(userCredential.user);
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
    set(userDataAtom, null); // Explicitly set to null when logging out
  } catch (error) {
    console.error(`[authStore/logout]: Logout error: ${error}`);
    throw error;
  }
});

/**
 * @description Change the password of the user
 * @param {string} currentPassword - The current password of the user
 * @param {string} newPassword - The new password of the user
 * @returns {Promise<void>} - A promise that resolves when the password is changed
 */
export const changePasswordAtom = atom(
  null,
  async (
    _,
    __,
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string }
  ): Promise<void> => {
    console.log('[authStore/changePassword]: Called');
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('User not authenticated');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('[authStore/changePassword]: ', error);
      throw error;
    }
  }
);

/**
 * @TODO Remove all associated listings, matches, images, etc.
 * @description Delete the account of the user
 * @param {string} password - The password of the user
 * @returns {Promise<void>} - A promise that resolves when the account is deleted
 */
export const deleteAccountAtom = atom(null, async (_, __, password: string): Promise<void> => {
  console.log('[authStore/deleteAccount]: Called');
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('User not authenticated');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
  } catch (error) {
    console.error('[authStore/deleteAccount]: ', error);
    throw error;
  }
});

/**
 * @description Send a verification email to the user
 * @returns {Promise<void>} - A promise that resolves when the email is sent
 */
export const sendVerificationEmailAtom = atom(null, async (): Promise<void> => {
  console.log('[authStore/sendVerificationEmail]: Called');
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await sendEmailVerification(user);
  } catch (error) {
    console.error('[authStore/sendVerificationEmail]: ', error);
    throw error;
  }
});

/**
 * @description Check if the email exists
 * @param {string} email - The email of the user
 * @returns {Promise<boolean>} - A promise that resolves when the email is checked
 */
export const checkEmailExistsAtom = atom(null, async (_, __, email: string): Promise<boolean> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error('[authStore/checkEmailExists]: ', error);
    throw error;
  }
});
