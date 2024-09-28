import { atom } from 'jotai';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';

export const userDataAtom = atom<User | null>(null);

export const fetchUserDataAtom = atom(
  null,
  async (_, set, uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      set(userDataAtom, userDoc.data() as User);
    } else {
      console.log('No such user document!');
    }
  }
);

export const updateUserDataAtom = atom(
  null,
  async (get, set, userData: Partial<User>) => {
    const currentUser = get(userDataAtom);
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      await setDoc(doc(db, 'users', currentUser.uid), updatedUser, { merge: true });
      set(userDataAtom, updatedUser);
    }
  }
);