import { atom } from 'jotai';
import { Listing, ListingCategory, ListingStatus } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';

// Updated listingsAtom
export const listingsAtom = atom<Record<string, Listing>>({});

// Dummy listings
const dummyListings: Record<string, Listing> = {
  '1': {
    id: '1',
    type: 'lost',
    userId: 'user1',
    title: 'Lost Black Wallet',
    description: 'Lost my black leather wallet near Central Park. It contains important documents.',
    images: ['https://picsum.photos/720'],
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15'),
    expiresAt: new Date('2023-07-15'),
    locations: [{
      name: 'Central Park, New York',
      latitude: 40.7829,
      longitude: -73.9654
    }],
    status: ListingStatus.ACTIVE,
    category: ListingCategory.BAGS_AND_WALLETS
  },
  '2': {
    id: '2',
    type: 'found',
    userId: 'user2',
    title: 'Found Golden Ring',
    description: 'Found a golden ring with initials "AB" engraved inside at Times Square.',
    images: ['https://picsum.photos/720'],
    createdAt: new Date('2023-06-14'),
    updatedAt: new Date('2023-06-14'),
    expiresAt: new Date('2023-07-14'),
    locations: [{
      name: 'Times Square, New York',
      latitude: 40.7580,
      longitude: -73.9855
    }],
    status: ListingStatus.ACTIVE,
    category: ListingCategory.CLOTHING_AND_ACCESSORIES
  },
  '3': {
    id: '3',
    type: 'lost',
    userId: 'user3',
    title: 'Missing Gray Cat',
    description: 'My gray cat "Whiskers" is missing. Last seen in Brooklyn Heights area.',
    images: ['https://picsum.photos/720'],
    createdAt: new Date('2023-06-13'),
    updatedAt: new Date('2023-06-13'),
    expiresAt: new Date('2023-07-13'),
    locations: [{
      name: 'Brooklyn Heights, New York',
      latitude: 40.6962,
      longitude: -73.9937
    }],
    status: ListingStatus.ACTIVE,
    category: ListingCategory.PETS
  }
};

export const fetchListingsAtom = atom(
  null,
  async (get, set) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'listings'));
      const listings: Record<string, Listing> = {};
      querySnapshot.docs.forEach(doc => {
        listings[doc.id] = { id: doc.id, ...doc.data() } as Listing;
      });
      // Add dummy listings for demonstration
      set(listingsAtom, { ...listings, ...dummyListings });
    } catch (error) {
      console.error('[listingStore/fetchListingsAtom]: ', error);
    }
  }
);

export const addListingAtom = atom(
  null,
  async (get, set, newListing: Omit<Listing, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'listings'), newListing);
      const listing = { id: docRef.id, ...newListing };
      set(listingsAtom, prev => ({ ...prev, [docRef.id]: listing }));
    } catch (error) {
      console.error('[listingStore/addListingAtom]: ', error);
    }
  }
);

export const updateListingAtom = atom(
  null,
  async (get, set, updatedListing: Listing) => {
    try {
      const { id, ...updateData } = updatedListing;
      await updateDoc(doc(db, 'listings', id), updateData);
      set(listingsAtom, prev => ({ ...prev, [id]: updatedListing }));
    } catch (error) {
      console.error('[listingStore/updateListingAtom]: ', error);
    }
  }
);

export const deleteListingAtom = atom(
  null,
  async (get, set, listingId: string) => {
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      set(listingsAtom, prev => {
        const newListings = { ...prev };
        delete newListings[listingId];
        return newListings;
      });
    } catch (error) {
      console.error('[listingStore/deleteListingAtom]: ', error);
    }
  }
);