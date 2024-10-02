import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Match } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, Timestamp, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const matchesAtom = atomWithStorage<Record<string, Match>>('matches', {});

/**
 * @description Fetch matches for a user
 * @param {string} userId - The ID of the user to fetch matches for
 * @returns {Promise<Record<string, Match>>} - A promise that resolves to the matches
 */
export const fetchMatchesAtom = atom(
  null,
  async (_, set, userId: string) => {
    console.log('[matchStore/fetchMatchesAtom] Fetching matches...');
    try {
      const matchesRef = collection(db, 'Matches');
      const q = query(
        matchesRef,
        where('userId1', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      console.log('[matchStore/fetchMatchesAtom] 🔥');
      
      const matches: Record<string, Match> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        matches[doc.id] = {
          id: doc.id,
          listingId1: data.listingId1,
          listingId2: data.listingId2,
          userId1: data.userId1,
          userId2: data.userId2,
          status: data.status,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate(),
        } as Match;
      });
      
      set(matchesAtom, matches);
      return matches;
    } catch (error) {
      console.error('[matchStore/fetchMatchesAtom] Error fetching matches:', error);
      throw error;
    }
  }
);

/**
 * @description Add a new match to Firestore and update the matches atom
 * @param {Omit<Match, 'id'>} newMatch - The new match to add
 * @returns {Promise<Match>} - A promise that resolves to the new match
 */
export const addMatchAtom = atom(
  null,
  async (_, set, newMatch: Omit<Match, 'id'>) => {
    console.log('[matchStore/addMatchAtom] Adding match...');
    try {
      const docRef = await addDoc(collection(db, 'Matches'), newMatch);
      console.log('[matchStore/addMatchAtom] 🔥');
      const match: Match = { id: docRef.id, ...newMatch };
      set(matchesAtom, (prev) => ({ ...prev, [docRef.id]: match }));
      return match;
    } catch (error) {
      console.error('[matchStore/addMatchAtom] Error adding match:', error);
      throw error;
    }
  }
);

/**
 * @description Update a match in Firestore and update the matches atom
 * @param {string} matchId - The ID of the match to update
 * @param {Partial<Match>} updatedMatch - The updated match data
 * @returns {Promise<void>} - A promise that resolves when the match is updated
 */
export const updateMatchAtom = atom(
  null,
  async (_, set, matchId: string, updatedMatch: Partial<Match>) => {
    console.log('[matchStore/updateMatchAtom] Updating match...');
    try {
      const docRef = doc(db, 'Matches', matchId);
      await updateDoc(docRef, updatedMatch);
      console.log('[matchStore/updateMatchAtom] 🔥');
      set(matchesAtom, (prev) => ({ ...prev, [matchId]: { ...prev[matchId], ...updatedMatch } }));
    } catch (error) {
      console.error('[matchStore/updateMatchAtom] Error updating match:', error);
      throw error;
    }
  }
);

/**
 * @description Delete a match from Firestore and update the matches atom
 * @param {string} matchId - The ID of the match to delete
 * @returns {Promise<void>} - A promise that resolves when the match is deleted
 */
export const deleteMatchAtom = atom(
  null,
  async (_, set, matchId: string) => {
    console.log('[matchStore/deleteMatchAtom] Deleting match...');
    try {
      const docRef = doc(db, 'Matches', matchId);
      await deleteDoc(docRef);
      console.log('[matchStore/deleteMatchAtom] 🔥');
      set(matchesAtom, (prev) => {
        const newMatches = { ...prev };
        delete newMatches[matchId];
        return newMatches;
      });
    } catch (error) {
      console.error('[matchStore/deleteMatchAtom] Error deleting match:', error);
      throw error;
    }
  }
);
