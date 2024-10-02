import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Listing, ListingDB, ListingImages, Marker } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { addImage, deleteImage, getImage } from './imageStore';
import { markersAtom, addMarker, fetchMarker, deleteMarker, updateMarker } from './markerStore';

export const listingsAtom = atomWithStorage<Record<string, Listing>>('listings', {});
export const listingsFetchedAtom = atomWithStorage<boolean>('listingsFetched', false);

/**
 * @description Fetch all listings from Firestore
 * @returns {Promise<void>} - A promise that resolves when the listings are fetched
 */
export const fetchAllListingsAtom = atom(
  null,
  async (get, set): Promise<Record<string, Listing>> => {
    console.log("[listingStore/fetchAllListingsAtom] called");
    try {
      const querySnapshot = await getDocs(collection(db, 'Listings'));
      console.log('[listingStore/fetchAllListingsAtom] 🔥');
      const listings: Record<string, Listing> = {};
      const existingMarkers = get(markersAtom);

      for (const doc of querySnapshot.docs) {
        const listingDB = doc.data() as ListingDB;
        const markerIds = listingDB.markerIds;

        // Fetch markers using the fetchMarker function
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await fetchMarker(markerId, existingMarkers);
            if (marker) {
              // Update markersAtom with the new marker
              set(markersAtom, (prev) => ({ ...prev, [markerId]: marker }));
            }
            return marker;
          })
        );

        const listing = convertListingDBToListing({ ...listingDB, id: doc.id }, markers.filter(m => m !== null) as Marker[]);

        // Fetch the main image if it's not already loaded
        if (listing.images.main.id && !listing.images.main.data) {
          const imageDoc = await getImage(listing.images.main.id);
          if (imageDoc) {
            listing.images.main.data = imageDoc.data;
          }
        }

        listings[doc.id] = listing;
      }
      
      set(listingsAtom, listings);
      set(listingsFetchedAtom, true);
      
      return listings;
    } catch (error) {
      console.error('[listingStore] Error fetching listings:', error);
      throw error;
    }
  }
);

/**
 * @description Fetch listings by userId
 * @param {string} userId - The ID of the user to fetch listings for
 * @returns {Promise<Listing[]>} - A promise that resolves when the listings are fetched
 */
export const fetchListingsByUserIdAtom = atom(
  null,
  async (get, set, userId: string): Promise<Listing[]> => {
    console.log('[listingStore/fetchListingsByUserIdAtom] called');
    try {
      const querySnapshot = await getDocs(query(collection(db, 'Listings'), where('userId', '==', userId)));
      console.log('[listingStore/fetchListingsByUserIdAtom] 🔥');
      const listings: Listing[] = [];
      const existingMarkers = get(markersAtom);
      const existingListings = get(listingsAtom);

      for (const doc of querySnapshot.docs) {
        const listingDB = doc.data() as ListingDB;
        const markerIds = listingDB.markerIds;

        // Fetch markers using the fetchMarker function
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await fetchMarker(markerId, existingMarkers);
            if (marker) {
              // Update markersAtom with the new marker
              set(markersAtom, (prev) => ({ ...prev, [markerId]: marker }));
            }
            return marker;
          })
        );

        const listing = convertListingDBToListing({ ...listingDB, id: doc.id }, markers.filter(m => m !== null) as Marker[]);

        // Fetch the main image if it's not already loaded
        if (listing.images.main.id && !listing.images.main.data) {
          const imageDoc = await getImage(listing.images.main.id);
          if (imageDoc) {
            listing.images.main.data = imageDoc.data;
          }
        }

        listings.push(listing);
        existingListings[doc.id] = listing;
      }
      
      set(listingsAtom, existingListings);
      
      return listings;
    } catch (error) {
      console.error('[listingStore] Error fetching listings by userId:', error);
      throw error;
    }
  }
);

/**
 * @description Add a new listing to Firestore
 * @param {Omit<Listing, 'id' | 'images' | 'markers'>} newListing - The new listing to add
 * @param {File[]} imageFiles - The image files to upload
 * @param {Omit<Marker, 'id' | 'listingId'>[]} markers - The markers to add
 * @returns {Promise<Record<string, Listing>>} - A promise that resolves when the listing is added
 */
export const addListingAtom = atom(
  null,
  async (get, set, params: {
    newListing: Omit<Listing, 'id' | 'images' | 'markers'>,
    imageFiles: File[],
    markers: Omit<Marker, 'id' | 'listingId'>[]
  }): Promise<Record<string, Listing>> => {
    const { newListing, imageFiles, markers } = params;
    console.log('[listingStore/addListing]: newListing:', JSON.stringify(newListing));
    try {
      const imageIds: { mainId: string; alt1Id?: string; alt2Id?: string } = { mainId: '' };

      // Create the listing document first to get the listingId
      const listingDB: Omit<ListingDB, 'id' | 'images' | 'markerIds'> = {
        ...newListing,
        createdAt: Timestamp.fromDate(newListing.createdAt),
        updatedAt: Timestamp.fromDate(newListing.updatedAt),
        expiresAt: Timestamp.fromDate(newListing.expiresAt),
      };
      const docRef = await addDoc(collection(db, 'Listings'), listingDB);
      console.log('[listingStore/addListing] 🔥');
      const listingId = docRef.id;

      // Upload images and get their IDs
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const imageId = await addImage(base64Image, listingId);
        if (i === 0) {
          imageIds.mainId = imageId;
        } else if (i === 1) {
          imageIds.alt1Id = imageId;
        } else if (i === 2) {
          imageIds.alt2Id = imageId;
        }
      }

      // Add markers and get their IDs
      const markerIds = await Promise.all(
        markers.map(async (marker) => {
          const newMarker = { ...marker, listingId };
          const addedMarker = await addMarker(set, newMarker);
          return addedMarker.id;
        })
      );

      // Update the listing with imageIds and markerIds
      await updateDoc(doc(db, 'Listings', listingId), {
        images: imageIds,
        markerIds,
      });
      console.log('[listingStore/addListing] 🔥');

      // Create the full Listing object
      const listing: Listing = {
        ...newListing,
        id: listingId,
        images: {
          main: {
            id: imageIds.mainId,
            listingId,
            data: await getImage(imageIds.mainId).then((img) => img?.data || ''),
          },
          alt1: imageIds.alt1Id
            ? {
                id: imageIds.alt1Id,
                listingId,
                data: await getImage(imageIds.alt1Id).then((img) => img?.data || ''),
              }
            : undefined,
          alt2: imageIds.alt2Id
            ? {
                id: imageIds.alt2Id,
                listingId,
                data: await getImage(imageIds.alt2Id).then((img) => img?.data || ''),
              }
            : undefined,
        },
        markers: await Promise.all(markerIds.map(async (id) => {
          const marker = await fetchMarker(id, get(markersAtom));
          return marker as Marker;
        })),
      };

      console.log('[listingStore/addListing]: listingsAtom:', get(listingsAtom));
      const updatedListings = { ...get(listingsAtom), [listingId]: listing };
      set(listingsAtom, updatedListings);
      console.log('[listingStore/addListing]: updatedListings:', updatedListings);
      return updatedListings;
    } catch (error) {
      console.error('[listingStore/addListing]: error:', error);
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
  async (get, set, payload: { updatedListing: Listing; imageFiles?: File[] }): Promise<void> => {
    const { updatedListing, imageFiles } = payload;
    console.log('[listingStore/updateListingAtom]: updatedListing:', JSON.stringify(updatedListing));
    try {
      const { id, ...updateData } = updatedListing;
      const originalListing = get(listingsAtom)[id];

      // Handle image updates
      const updatedImages: ListingImages = { ...originalListing.images };
      if (imageFiles && imageFiles.length > 0) {
        // Delete old images that are not in the new set
        if (updatedImages.main && !imageFiles.includes(updatedImages.main as unknown as File)) {
          await deleteImage(updatedImages.main.id);
          updatedImages.main = { id: '', listingId: id, data: '' };
        }
        if (updatedImages.alt1 && !imageFiles.includes(updatedImages.alt1 as unknown as File)) {
          await deleteImage(updatedImages.alt1.id as string);
          updatedImages.alt1 = undefined;
        }
        if (updatedImages.alt2 && !imageFiles.includes(updatedImages.alt2 as unknown as File)) {
          await deleteImage(updatedImages.alt2.id as string);
          updatedImages.alt2 = undefined;
        }

        // Add new images
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const imageId = await addImage(imageData, id);
          if (i === 0) {
            updatedImages.main = { id: imageId, listingId: id, data: imageData };
          } else if (i === 1) {
            updatedImages.alt1 = { id: imageId, listingId: id, data: imageData };
          } else if (i === 2) {
            updatedImages.alt2 = { id: imageId, listingId: id, data: imageData };
          }
        }
      }

      // Handle marker updates
      const existingMarkers = get(markersAtom);
      const updatedMarkerIds = await Promise.all(
        updatedListing.markers.map(async (marker) => {
          if (marker.id) {
            // Update existing marker
            await updateMarker(marker, existingMarkers, set);
            return marker.id;
          } else {
            // Add new marker
            const addedMarker = await addMarker(set, { ...marker, listingId: id });
            return addedMarker.id;
          }
        })
      );

      // Remove markers that are no longer associated with the listing
      const markersToRemove = originalListing.markers.filter(
        (marker) => !updatedMarkerIds.includes(marker.id)
      );
      await Promise.all(markersToRemove.map((marker) => deleteMarker(marker.id, existingMarkers, set)));

      const listingImageIds: {
        mainId: string;
        alt1Id?: string;
        alt2Id?: string;
      } = { mainId: '' };

      if (updatedImages.main) {
        listingImageIds.mainId = updatedImages.main.id;
      }
      if (updatedImages.alt1) {
        listingImageIds.alt1Id = updatedImages.alt1.id;
      }
      if (updatedImages.alt2) {
        listingImageIds.alt2Id = updatedImages.alt2.id;
      }

      // Update the listing with new markerIds and images
      const listingUpdate: Partial<ListingDB> = {
        type: updateData.type,
        userId: updateData.userId,
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        category: updateData.category,
        updatedAt: Timestamp.fromDate(new Date()),
        markerIds: updatedMarkerIds,
        images: listingImageIds,
      };

      console.log('[listingStore/updateListingAtom]: listingUpdate:', listingUpdate);

      await updateDoc(doc(db, 'Listings', id), listingUpdate);
      console.log('[listingStore/updateListingAtom] 🔥');

      // Update the client-side state
      set(listingsAtom, (prev) => ({
        ...prev,
        [id]: {
          ...updatedListing,
          images: updatedImages,
          markers: updatedListing.markers.map((marker, index) => ({
            ...marker,
            id: updatedMarkerIds[index],
            listingId: id,
          })),
        },
      }));
    } catch (error) {
      console.error('[listingStore/updateListingAtom]: error:', error);
      throw error;
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
  async (get, set, listingId: string): Promise<void> => {
    console.log('[listingStore/deleteListingAtom]: listingId:', listingId);
    try {
      const listing = get(listingsAtom)[listingId];

      // Delete associated images
      if (listing.images.main.id) await deleteImage(listing.images.main.id);
      if (listing.images.alt1?.id) await deleteImage(listing.images.alt1.id);
      if (listing.images.alt2?.id) await deleteImage(listing.images.alt2.id);

      // Delete associated markers
      if (listing.markers.length > 0) {
        for (const marker of listing.markers) {
          await deleteMarker(marker.id, get(markersAtom), set);
        }
      }

      // Delete associated match

      // Delete the listing document
      await deleteDoc(doc(db, 'Listings', listingId));
      console.log('[listingStore/deleteListingAtom] 🔥');
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
  async (get, set, payload: { listingId: string; imageKey: keyof ListingImages; imageSrc: string }): Promise<void> => {
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

      try {
        // Update the listing in Firestore
        await updateDoc(doc(db, 'Listings', listingId), {
          [`images.${imageKey}.src`]: imageSrc
        });
        console.log('[listingStore/updateListingImageAtom] 🔥');

        // Update the client-side state
        set(listingsAtom, {
          ...listings,
          [listingId]: updatedListing
        });
      } catch (error) {
        console.error('[listingStore/updateListingImage]: error:', error);
        throw error;
      }
    } else {
      throw new Error(`Listing with id ${listingId} not found`);
    }
  }
);



/* ########## HELPER FUNCTIONS ########## */

/**
 * @description Convert a ListingDB to a Listing
 * @param {ListingDB} listingDB - The ListingDB object
 * @param {Marker[]} markers - The markers for the listing
 * @returns {Listing} - The converted Listing object
 */
const convertListingDBToListing = (listingDB: ListingDB, markers: Marker[]): Listing => ({
  ...listingDB,
  createdAt: listingDB.createdAt.toDate(),
  updatedAt: listingDB.updatedAt.toDate(),
  expiresAt: listingDB.expiresAt.toDate(),
  images: {
    main: { id: listingDB.images.mainId, listingId: listingDB.id, data: '' },
    alt1: listingDB.images.alt1Id ? { id: listingDB.images.alt1Id, listingId: listingDB.id, data: '' } : undefined,
    alt2: listingDB.images.alt2Id ? { id: listingDB.images.alt2Id, listingId: listingDB.id, data: '' } : undefined,
  },
  markers,
});

/**
 * @description Check if 2 listings 
 */