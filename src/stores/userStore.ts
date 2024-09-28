import { atom } from 'jotai';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';

export const userDataAtom = atom<User | null>(null);

/**
 * @description Fetch user data from Firestore
 * @param {string} uid - The ID of the user to fetch
 * @returns {Promise<void>} - A promise that resolves when the user data is fetched
 */
export const fetchUserDataAtom = atom(
  null,
  async (_, set, uid: string) => {
    console.log('[userStore/fetchUserDataAtom]: uid:', uid);
    const userDoc = await getDoc(doc(db, 'Users', uid));
    if (userDoc.exists()) {
      set(userDataAtom, userDoc.data() as User);
    } else {
      console.log('[userStore/fetchUserDataAtom]: No such user document!');
    }
  }
);

/**
 * @description Update user data in Firestore
 * @param {Partial<User>} userData - The user data to update
 * @returns {Promise<void>} - A promise that resolves when the user data is updated
 */
export const updateUserDataAtom = atom(
  null,
  async (get, set, userData: Partial<User>) => {
    console.log('[userStore/updateUserDataAtom]: userData:', JSON.stringify(userData));
    const currentUser = get(userDataAtom);
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      await setDoc(doc(db, 'Users', currentUser.uid), updatedUser, { merge: true });
      set(userDataAtom, updatedUser);
    }
  }
);