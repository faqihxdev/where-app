import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchUserDataAtom } from './userStore';
import { User } from '../types/user';

export const authUserAtom = atomWithStorage<FirebaseUser | null>('authUser', null);

export const isAuthenticatedAtom = atom(
  (get) => get(authUserAtom) !== null
);

export const loginAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set(authUserAtom, userCredential.user);
      
      // Fetch user data
      set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
);

export const registerAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
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
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

      // Fetch user data
      set(fetchUserDataAtom, userCredential.user.uid);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
);

export const logoutAtom = atom(
  null,
  async (_, set) => {
    try {
      await signOut(auth);
      set(authUserAtom, null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
);