import { atom } from 'jotai';
import { Listing, ListingImages } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { addImage, deleteImage, getImage } from '../utils/imageUtils';

// Updated listingsAtom
export const listingsAtom = atom<Record<string, Listing>>({});
export const listingsLoadingAtom = atom<boolean>(false);
export const listingsFetchedAtom = atom<boolean>(false);

/**
 * @description Fetch all listings from Firestore
 * @returns {Promise<void>} - A promise that resolves when the listings are fetched
 */
export const fetchListingsAtom = atom(
  null,
  async (_, set) => {
    console.log('[listingStore/fetchListingsAtom]: called');
    set(listingsLoadingAtom, true);
    try {
      const querySnapshot = await getDocs(collection(db, 'Listings'));
      const listings: Record<string, Listing> = {};
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const listing: Listing = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiresAt: data.expiresAt.toDate()
        } as Listing;

        // Fetch the main image if it's not already loaded
        if (listing.images.main.id && !listing.images.main.src) {
          const imageDoc = await getImage(listing.images.main.id);
          if (imageDoc) {
            listing.images.main.src = imageDoc.src;
          }
        }

        listings[doc.id] = listing;
      }
      set(listingsAtom, listings);
      set(listingsFetchedAtom, true);
    } catch (error) {
      console.error('[listingStore/fetchListingsAtom]: error:', error);
    } finally {
      set(listingsLoadingAtom, false);
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
  async (_, set, newListing: Omit<Listing, 'id' | 'images'> & { images: File[] }) => {
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
  async (_, set, updatedListing: Listing) => {
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

/**
 * @description Update a listing's image
 * @param {string} listingId - The ID of the listing to update
 * @param {keyof ListingImages} imageKey - The key of the image to update
 * @param {string} imageSrc - The new source of the image
 * @returns {Promise<void>} - A promise that resolves when the listing's image is updated
 */
export const updateListingImageAtom = atom(
  null,
  async (get, set, payload: { listingId: string; imageKey: keyof ListingImages; imageSrc: string }) => {
    const { listingId, imageKey, imageSrc } = payload;
    const listings = get(listingsAtom);
    const listing = listings[listingId];

    if (listing) {
      const updatedListing = {
        ...listing,
        images: {
          ...listing.images,
          [imageKey]: {
            ...listing.images[imageKey],
            src: imageSrc
          }
        }
      };

      set(listingsAtom, {
        ...listings,
        [listingId]: updatedListing
      });
    }
  }
);
