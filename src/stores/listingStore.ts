import { atom } from 'jotai';
import { Listing, ListingImages } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { addImage, deleteImage } from '../utils/imageUtils';

// Updated listingsAtom
export const listingsAtom = atom<Record<string, Listing>>({});

/**
 * @description Fetch all listings from Firestore
 * @returns {Promise<void>} - A promise that resolves when the listings are fetched
 */
export const fetchListingsAtom = atom(
  null,
  async (get, set) => {
    console.log('[listingStore/fetchListingsAtom]: called');
    try {
      const querySnapshot = await getDocs(collection(db, 'Listings'));
      const listings: Record<string, Listing> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        listings[doc.id] = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiresAt: data.expiresAt.toDate()
        } as Listing;
      });
      set(listingsAtom, listings);
    } catch (error) {
      console.error('[listingStore/fetchListingsAtom]: error:', error);
    }
  }
);

/**
 * @description Add a new listing to Firestore
 * @param {Omit<Listing, 'id' | 'images'> & { images: File[] }} newListing - The new listing to add
 * @returns {Promise<Listing>} - A promise that resolves when the listing is added
 */
export const addListingAtom = atom(
  null,
  async (get, set, newListing: Omit<Listing, 'id' | 'images'> & { images: File[] }) => {
    console.log('[listingStore/addListingAtom]: newListing:', JSON.stringify(newListing));
    try {
      const imageIds: ListingImages = { main: { id: '' } };

      // Upload images and get their IDs
      for (let i = 0; i < newListing.images.length; i++) {
        const file = newListing.images[i];
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const imageId = await addImage(base64Image);
        if (i === 0) {
          imageIds.main.id = imageId;
        } else if (i === 1) {
          imageIds.alt1 = { id: imageId };
        } else if (i === 2) {
          imageIds.alt2 = { id: imageId };
        }
      }

      const listingData = {
        ...newListing,
        images: imageIds,
      };

      const docRef = await addDoc(collection(db, 'Listings'), listingData);
      const listing = { id: docRef.id, ...listingData } as Listing;
      set(listingsAtom, prev => ({ ...prev, [docRef.id]: listing }));
      return listing;
    } catch (error) {
      console.error('[listingStore/addListingAtom]: error:', error);
      throw error;
    }
  }
);

/**
 * @description Update a listing in Firestore
 * @param {Listing} updatedListing - The updated listing
 * @returns {Promise<void>} - A promise that resolves when the listing is updated
 */
export const updateListingAtom = atom(
  null,
  async (get, set, updatedListing: Listing) => {
    console.log('[listingStore/updateListingAtom]: updatedListing:', JSON.stringify(updatedListing));
    try {
      const { id, ...updateData } = updatedListing;
      await updateDoc(doc(db, 'Listings', id), updateData);
      set(listingsAtom, prev => ({ ...prev, [id]: updatedListing }));
    } catch (error) {
      console.error('[listingStore/updateListingAtom]: error:', error);
    }
  }
);

/**
 * @description Delete a listing from Firestore & delete the associated images
 * @param {string} listingId - The ID of the listing to delete
 * @returns {Promise<void>} - A promise that resolves when the listing is deleted
 */
export const deleteListingAtom = atom(
  null,
  async (get, set, listingId: string) => {
    console.log('[listingStore/deleteListingAtom]: listingId:', listingId);
    try {
      const listing = get(listingsAtom)[listingId];

      // Delete associated images
      if (listing.images.main.id) await deleteImage(listing.images.main.id);
      if (listing.images.alt1?.id) await deleteImage(listing.images.alt1.id);
      if (listing.images.alt2?.id) await deleteImage(listing.images.alt2.id);

      await deleteDoc(doc(db, 'Listings', listingId));
      set(listingsAtom, prev => {
        const newListings = { ...prev };
        delete newListings[listingId];
        return newListings;
      });
    } catch (error) {
      console.error('[listingStore/deleteListingAtom]: error:', error);
    }
  }
);
