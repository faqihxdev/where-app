import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Match } from '../types';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  or,
} from 'firebase/firestore';
import { generateId } from '../utils/utils';

// This matches atom is used to store the matches client-side
export const matchesAtom = atomWithStorage<Record<string, Match>>('matches', {});

/**
 * @description Add a new match to Firestore and update the matches atom
 * @param {Omit<Match, 'id'>} newMatch - The new match to add
 * @returns {Promise<Match>} - A promise that resolves to the new match
 */
export const addMatchAtom = atom(null, async (_, set, newMatch: Omit<Match, 'id'>) => {
  console.log(`[matchStore/addMatchAtom]: Adding match:`, { newMatch });

  try {
    // Generate a hash-based match ID
    const matchId = generateId(
      `${newMatch.listingId1}|${newMatch.listingId2}|${newMatch.userId1}|${newMatch.userId2}`
    );

    // Check if the match already exists in Firestore
    const docRef = doc(db, 'Matches', matchId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      console.log(`[matchStore/addMatchAtom]: Match already exists with ID: ${matchId}`);
      const existingMatch = docSnapshot.data() as Match;
      return existingMatch;
    }

    // Create a new match object to add to Firestore
    const newMatchToAdd: Omit<Match, 'id'> = {
      listingId1: newMatch.listingId1,
      listingId2: newMatch.listingId2,
      userId1: newMatch.userId1,
      userId2: newMatch.userId2,
      status: newMatch.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add the new match to Firestore using the generated ID
    console.log('🔥 [matchStore/addMatchAtom]');
    await setDoc(docRef, newMatchToAdd);

    // Update the matches atom
    const match: Match = { id: matchId, ...newMatchToAdd };
    set(matchesAtom, (prev) => ({ ...prev, [match.id]: match }));
    return match;
  } catch (error) {
    console.error(`[matchStore/addMatchAtom]: Error adding match: ${error}`);
    throw error;
  }
});

/**
 * @description Fetch matches for a user
 * @param {string} userId - The ID of the user to fetch matches for
 * @returns {Promise<Record<string, Match>>} - A promise that resolves to the matches
 */
export const fetchMatchesByUserAtom = atom(
  null,
  async (_, set, userId: string): Promise<Record<string, Match>> => {
    console.log(`[matchStore/fetchMatchesByUser]: Fetching matches for user: ${userId}`);
    try {
      // Create a query to get the matches for the user
      const q = query(
        collection(db, 'Matches'),
        or(where('userId1', '==', userId), where('userId2', '==', userId))
      );

      // Get the matches from Firestore
      console.log('🔥 [matchStore/fetchMatchesByUser]');
      const querySnapshot = await getDocs(q);
      const matches: Record<string, Match> = {};

      // Loop through each match and add it to the matches atom
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

      // Update the matches atom
      set(matchesAtom, matches);

      return matches;
    } catch (error) {
      console.error(`[matchStore/fetchMatchesByUser]: Error fetching matches: ${error}`);
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
    console.log(`[matchStore/updateMatchAtom]: Updating match: ${matchId}`);
    try {
      // Create a new match object to update in Firestore
      const updatedMatchToUpdate: Partial<Match> = {
        ...updatedMatch,
        updatedAt: new Date(),
      };

      // Update the match in Firestore
      console.log('🔥 [matchStore/updateMatchAtom]');
      await updateDoc(doc(db, 'Matches', matchId), updatedMatchToUpdate);

      // Update the matches atom
      set(matchesAtom, (prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], ...updatedMatchToUpdate },
      }));
    } catch (error) {
      console.error(`[matchStore/updateMatchAtom]: Error updating match: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Delete a match from Firestore and update the matches atom
 * @param {string} matchId - The ID of the match to delete
 * @returns {Promise<void>} - A promise that resolves when the match is deleted
 */
export const deleteMatchAtom = atom(null, async (_, set, matchId: string) => {
  console.log(`[matchStore/deleteMatchAtom]: Deleting match: ${matchId}`);
  try {
    // Delete the match from Firestore
    console.log('🔥 [matchStore/deleteMatchAtom]');
    await deleteDoc(doc(db, 'Matches', matchId));

    // Update the matches atom
    set(matchesAtom, (prev) => {
      const newMatches = { ...prev };
      delete newMatches[matchId];
      return newMatches;
    });
  } catch (error) {
    console.error(`[matchStore/deleteMatchAtom]: Error deleting match: ${error}`);
    throw error;
  }
});

// Add this new atom
export const fetchMatchByIdAtom = atom(
  null,
  async (get, set, matchId: string): Promise<Match | null> => {
    console.log(`[matchStore/fetchMatchById]: Fetching match with ID: ${matchId}`);
    try {
      // Check if the match is already in the atom
      const matches = get(matchesAtom);
      if (matches[matchId]) {
        return matches[matchId];
      }

      // If not in the atom, fetch from Firestore
      console.log('🔥 [matchStore/fetchMatchById]');
      const docRef = doc(db, 'Matches', matchId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const match: Match = {
          id: docSnap.id,
          listingId1: data.listingId1,
          listingId2: data.listingId2,
          userId1: data.userId1,
          userId2: data.userId2,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };

        // Update the matches atom
        set(matchesAtom, (prev) => ({ ...prev, [match.id]: match }));

        return match;
      }

      return null;
    } catch (error) {
      console.error(`[matchStore/fetchMatchById]: Error fetching match: ${error}`);
      throw error;
    }
  }
);
