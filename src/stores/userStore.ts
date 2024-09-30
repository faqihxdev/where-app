import { atom } from 'jotai';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';
import { atomWithStorage } from 'jotai/utils';

// Store the user data for the current user
export const userDataAtom = atomWithStorage<User | null>('userData', null);

// Store the user data for the users of the listings
export const listingUsersAtom = atom<Record<string, User>>({});

/**
 * @description Fetch user data from Firestore
 * @param {string} uid - The ID of the user to fetch
 * @returns {Promise<User | null>} - A promise that resolves when the user data is fetched
 */
export const fetchUserDataAtom = atom(
  null,
  async (_, set, uid: string): Promise<User | null> => {
    console.log('[userStore/fetchUserData]: uid:', uid);
    try {
      const userDoc = await getDoc(doc(db, 'Users', uid));
      console.log('[userStore/fetchUserData] 🔥');
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('[userStore/fetchUserData]: User data fetched:', userData);
        set(userDataAtom, userData);
        return userData;
      } else {
        console.error('[userStore/fetchUserData]: No user document found for uid:', uid);
        set(userDataAtom, null);
        return null;
      }
    } catch (error) {
      console.error('[userStore/fetchUserData]: Error fetching user data:', error);
      set(userDataAtom, null);
      throw error;
    }
  }
);

/**
 * @description Update user data in Firestore
 * @param {Partial<User>} userData - The user data to update
 * @returns {Promise<User | null>} - A promise that resolves when the user data is updated
 */
export const updateListingUsersAtom = atom(
  null,
  async (get, set, userData: Partial<User>): Promise<User | null> => {
    console.log('[userStore/updateListingUsersAtom]: userData:', JSON.stringify(userData));
    const currentUser = get(userDataAtom);
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      try {
        await setDoc(doc(db, 'Users', currentUser.uid), updatedUser, { merge: true });
        console.log('[userStore/updateListingUsersAtom] 🔥');
        set(userDataAtom, updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('[userStore/updateListingUsersAtom]: Error updating user data:', error);
        throw error;
      }
    }
    return null;
  }
);

/**
 * @description Fetch user data for a listing from Firestore
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<User | null>} - A promise that resolves when the user data is fetched
 */
export const fetchUserListingsAtom = atom(
  null,
  async (get, set, userId: string): Promise<User | null> => {
    console.log('[userStore/fetchListingUserDataAtom]: userId:', userId);
    const listingUsers = get(listingUsersAtom);
    if (listingUsers[userId]) {
      return listingUsers[userId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'Users', userId));
      console.log('[userStore/fetchListingUserDataAtom] 🔥');
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set(listingUsersAtom, (prev) => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (error) {
      console.error('[userStore/fetchListingUserDataAtom]: ', error);
      throw error;
    }
    return null;
  }
);