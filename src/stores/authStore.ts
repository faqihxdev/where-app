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
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { fetchUserDataAtom, listingUsersAtom, userDataAtom } from './userStore';
import { User } from '../types';
import { listingsAtom } from './listingStore';
import { deleteListingAtom } from './listingStore';
import { deleteNotificationsAtom, userNotificationsAtom } from './notificationStore';
import { matchesAtom } from './matchStore';
import { imagesAtom } from './imageStore';
import { markersAtom } from './markerStore';

// Store the auth user from Firebase
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
    // Sign out the user and set the auth user atom and user data atom to null
    await signOut(auth);
    set(authUserAtom, null);
    set(userDataAtom, null);
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
      // Ensure user is authenticated
      const user = auth.currentUser;
      if (!user || !user.email) {
        console.error('[authStore/changePassword]: User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('[authStore/changePassword]: Called');

      // Create credential for reauthentication
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      // Reauthenticate user
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (error) {
        console.error('[authStore/changePassword]: Reauthentication error', error);
        if (error instanceof Error && error.message.includes('auth/wrong-password')) {
          throw error;
        }
        throw error;
      }

      // Update password
      try {
        await updatePassword(user, newPassword);
        console.log('[authStore/changePassword]: Password updated successfully');
      } catch (error) {
        console.error('[authStore/changePassword]: Update password error', error);
        throw error;
      }
    } catch (error) {
      console.error('[authStore/changePassword]: ', error);
      throw error;
    }
  }
);

/**
 * @description Delete the account of the user
 * @param {string} password - The password of the user
 * @returns {Promise<void>} - A promise that resolves when the account is deleted
 */
export const deleteAccountAtom = atom(null, async (get, set, password: string): Promise<void> => {
  console.log('[authStore/deleteAccount]: Called');
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('User not authenticated');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete all associated listing with the current user
    const listings = Object.values(get(listingsAtom));
    for (const listing of listings) {
      if (listing.userId === user.uid) {
        await set(deleteListingAtom, listing.id);
      }
    }

    // Delete all associated notifications with the current user
    const notifications = Object.values(get(userNotificationsAtom));
    await set(
      deleteNotificationsAtom,
      notifications.map((notification) => notification.id)
    );

    // Delete the user in User collection
    await deleteDoc(doc(db, 'Users', user.uid));

    // Set all atoms to null
    set(authUserAtom, null);
    set(imagesAtom, {});
    set(listingsAtom, {});
    set(markersAtom, {});
    set(matchesAtom, {});
    set(userNotificationsAtom, {});
    set(userDataAtom, null);
    set(listingUsersAtom, {});

    // Delete the user from Firebase
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

/**
 * @description Send a password reset email to the user
 * @param {string} email - The email of the user
 * @returns {Promise<void>} - A promise that resolves when the email is sent
 */
export const sendPasswordResetEmailAtom = atom(
  null,
  async (_, __, email: string): Promise<void> => {
    console.log('[authStore/sendPasswordResetEmail]: Called');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('[authStore/sendPasswordResetEmail]: ', error);
      throw error;
    }
  }
);
