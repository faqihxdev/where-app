import { atom, SetStateAction } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Match } from '../types';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// This matches atom is used to store the matches client-side
export const matchesAtom = atomWithStorage<Record<string, Match>>('matches', {});

/**
 * @description Add a new match to Firestore and update the matches atom
 * @param {Omit<Match, 'id'>} newMatch - The new match to add
 * @returns {Promise<Match>} - A promise that resolves to the new match
 */
export const addMatchAtom = async (
  newMatch: Omit<Match, 'id'>,
  setMatches: (update: SetStateAction<Record<string, Match>>) => void
) => {
  console.log(`[matchStore/addMatchAtom]: Adding match: ${newMatch}`);

  try {
    // Check if the match already exists in Firestore
    const q = query(
      collection(db, 'Matches'),
      where('listingId1', '==', newMatch.listingId1),
      where('listingId2', '==', newMatch.listingId2)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      console.log(`[matchStore/addMatchAtom]: Match already exists: ${newMatch}`);
      return;
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

    // Add the new match to Firestore
    console.log('🔥 [matchStore/addMatchAtom]');
    const docRef = await addDoc(collection(db, 'Matches'), newMatchToAdd);

    // Update the matches atom
    const match: Match = { id: docRef.id, ...newMatch };
    setMatches((prev) => ({ ...prev, [match.id]: match }));
    return match;
  } catch (error) {
    console.error(`[matchStore/addMatchAtom]: Error adding match: ${error}`);
    throw error;
  }
};

/**
 * @description Fetch matches for a user
 * @param {string} userId - The ID of the user to fetch matches for
 * @returns {Promise<Record<string, Match>>} - A promise that resolves to the matches
 */
export const fetchMatchesByUserAtom = atom(
  null,
  async (get, set, userId: string): Promise<Record<string, Match>> => {
    console.log(`[matchStore/fetchMatchesByUser]: Fetching matches for user: ${userId}`);
    try {
      // Create a query to get the matches for the user
      const q = query(collection(db, 'Matches'), where('userId1', '==', userId));

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
