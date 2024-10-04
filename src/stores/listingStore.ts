import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Listing, ListingDB, ListingImages, Marker, ImageType } from '../types';
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { addImage, deleteImage, getImage } from './imageStore';
import { markersAtom, addMarker, fetchMarkerById, deleteMarker, updateMarker } from './markerStore';

// The listings atom is used to store the listings in the client-side state
export const listingsAtom = atomWithStorage<Record<string, Listing>>('listings', {});

// The listingsFetched atom is used to store the boolean value indicating if the listings have been fetched from Firestore
export const listingsFetchedAtom = atomWithStorage<boolean>('listingsFetched', false);

/**
 * @TODO Add the MATCH and EXPIRY functionality
 * @description Fetch all listings from Firestore
 * @returns {Promise<void>} - A promise that resolves when the listings are fetched
 */
export const fetchAllListingsAtom = atom(
  null,
  async (get, set): Promise<Record<string, Listing>> => {
    console.log('[listingStore/fetchAllListingsAtom] Called');
    try {
      // Get all listings from the Listings collection
      console.log('🔥[listingStore/fetchAllListingsAtom]');
      const querySnapshot = await getDocs(collection(db, 'Listings'));
      const listings: Record<string, Listing> = {};

      // Loop through each listing and fetch the markers
      for (const doc of querySnapshot.docs) {
        const listingDB = doc.data() as ListingDB;
        const markerIds = listingDB.markerIds;

        // Fetch markers using the fetchMarkerById function & update the markersAtom
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await fetchMarkerById(markerId, get(markersAtom));
            if (marker) {
              set(markersAtom, (prev) => ({ ...prev, [markerId]: marker }));
            }
            return marker;
          })
        );

        // Convert the listingDB to a Listing
        const listing = convertListingDBToListing(
          { ...listingDB, id: doc.id },
          markers.filter((m) => m !== null) as Marker[]
        );

        // Fetch the main image if it's not already loaded
        for (const type of ['main', 'alt1', 'alt2'] as (keyof ListingImages)[]) {
          if (listing.images[type]?.id && !listing.images[type]?.data) {
            const imageDoc = await getImage(listing.images[type]!.id);
            if (imageDoc) {
              listing.images[type]!.data = imageDoc.data;
            }
          }
        }

        // Add the listing to the listingsAtom
        listings[doc.id] = listing;
      }

      // Check for matches and expiry
      await checkForMatchesAndExpiry(Object.values(listings));

      // Update the listingsAtom with the new listings
      set(listingsAtom, listings);
      set(listingsFetchedAtom, true);

      return listings;
    } catch (error) {
      console.error(`[listingStore] Error fetching listings: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Fetch a listing by id
 * @param {string} listingId - The ID of the listing to fetch
 * @returns {Promise<Listing | null>} - A promise that resolves when the listing is fetched
 */
export const fetchListingByIdAtom = atom(
  null,
  async (get, set, listingId: string): Promise<Listing | null> => {
    console.log(`[listingStore/fetchListingByIdAtom]: Fetching listing: ${listingId}`);
    try {
      // Get the listing from the Listings collection
      console.log('🔥[listingStore/fetchListingByIdAtom]');
      const docSnap = await getDoc(doc(db, 'Listings', listingId));
      let listing: Listing;

      // If the listing exists, convert it to a Listing and return it
      if (docSnap.exists()) {
        const listingDB = docSnap.data() as ListingDB;
        const markerIds = listingDB.markerIds;

        // Fetch markers using the fetchMarkerById function & update the markersAtom
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await fetchMarkerById(markerId, get(markersAtom));
            if (marker) {
              set(markersAtom, (prev) => ({ ...prev, [markerId]: marker }));
            }
            return marker;
          })
        );

        // Convert the listingDB to a Listing
        listing = convertListingDBToListing(
          { ...listingDB, id: docSnap.id },
          markers.filter((m) => m !== null) as Marker[]
        );

        // Fetch the main image if it's not already loaded
        for (const type of ['main', 'alt1', 'alt2'] as (keyof ListingImages)[]) {
          if (listing.images[type]?.id && !listing.images[type]?.data) {
            const imageDoc = await getImage(listing.images[type]!.id);
            if (imageDoc) {
              listing.images[type]!.data = imageDoc.data;
            }
          }
        }

        // Update the listingsAtom with the new listing
        set(listingsAtom, { ...get(listingsAtom), [listingId]: listing });

        return listing;
      }

      return null;
    } catch (error) {
      console.error(`[listingStore] Error fetching listing by id: ${error}`);
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
    console.log('[listingStore/fetchListingsByUserIdAtom] Called');
    try {
      // Get all listings from the Listings collection for the given userId
      console.log('🔥[listingStore/fetchListingsByUserIdAtom]');
      const querySnapshot = await getDocs(
        query(collection(db, 'Listings'), where('userId', '==', userId))
      );

      // Create an array to store the listings
      const listings: Listing[] = [];
      const existingListings = get(listingsAtom);

      // Loop through each listing and fetch the markers
      for (const doc of querySnapshot.docs) {
        const listingDB = doc.data() as ListingDB;
        const markerIds = listingDB.markerIds;

        // Fetch markers using the fetchMarkerById function & update the markersAtom
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await fetchMarkerById(markerId, get(markersAtom));
            if (marker) {
              set(markersAtom, (prev) => ({ ...prev, [markerId]: marker }));
            }
            return marker;
          })
        );

        // Convert the listingDB to a Listing
        const listing = convertListingDBToListing(
          { ...listingDB, id: doc.id },
          markers.filter((m) => m !== null) as Marker[]
        );

        // Fetch the main image if it's not already loaded
        for (const type of ['main', 'alt1', 'alt2'] as (keyof ListingImages)[]) {
          if (listing.images[type]?.id && !listing.images[type]?.data) {
            const imageDoc = await getImage(listing.images[type]!.id);
            if (imageDoc) {
              listing.images[type]!.data = imageDoc.data;
            }
          }
        }

        // Add the listing to the listingsAtom
        listings.push(listing);
        existingListings[doc.id] = listing;
      }

      // Update the listingsAtom with the new listings
      set(listingsAtom, existingListings);

      return listings;
    } catch (error) {
      console.error(`[listingStore] Error fetching listings by userId: ${error}`);
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
  async (
    get,
    set,
    params: {
      newListing: Omit<Listing, 'id' | 'images' | 'markers'>;
      imageFiles: File[];
      markers: Omit<Marker, 'id' | 'listingId'>[];
    }
  ): Promise<Record<string, Listing>> => {
    const { newListing, imageFiles, markers } = params;
    console.log(`[listingStore/addListing]: Adding Listing: ${newListing}`);
    try {
      // Create the listing document first to get the listingId
      const listingDB: Omit<ListingDB, 'id' | 'images' | 'markerIds'> = {
        type: newListing.type,
        userId: newListing.userId,
        title: newListing.title,
        description: newListing.description,
        status: newListing.status,
        category: newListing.category,
        createdAt: Timestamp.fromDate(newListing.createdAt),
        updatedAt: Timestamp.fromDate(newListing.updatedAt),
        expiresAt: Timestamp.fromDate(newListing.expiresAt),
      };

      // Add the listing to the Listings collection
      console.log('🔥[listingStore/addListing]');
      const docRef = await addDoc(collection(db, 'Listings'), listingDB);
      const listingId = docRef.id;

      // Create an object to store the image IDs
      const imageIds: {
        mainId: string;
        alt1Id?: string;
        alt2Id?: string;
      } = { mainId: '' };

      // Create an object to store the image
      const images: ListingImages = { main: { id: '', listingId, data: '' } };

      // Upload the images to the Images collection
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Add the image to the Images collection
        const imageId = await addImage(base64Image, listingId);

        if (i === 0) {
          imageIds.mainId = imageId;
          images.main = { id: imageId, listingId, data: base64Image };
        } else if (i === 1) {
          imageIds.alt1Id = imageId;
          images.alt1 = { id: imageId, listingId, data: base64Image };
        } else if (i === 2) {
          imageIds.alt2Id = imageId;
          images.alt2 = { id: imageId, listingId, data: base64Image };
        }
      }

      // Create an array to store the new markers
      const newMarkers: Marker[] = [];

      // Add markers and get their IDs
      const markerIds = await Promise.all(
        markers.map(async (marker) => {
          const newMarker: Omit<Marker, 'id'> = {
            listingId,
            name: marker.name,
            latitude: marker.latitude,
            longitude: marker.longitude,
            radius: marker.radius,
          };
          const addedMarker = await addMarker(set, newMarker);
          newMarkers.push(addedMarker);
          return addedMarker.id;
        })
      );

      // Update the listing with imageIds and markerIds
      await updateDoc(doc(db, 'Listings', listingId), {
        images: imageIds,
        markerIds,
      });

      // Create the full Listing object
      const listing: Listing = {
        id: listingId,
        type: newListing.type,
        userId: newListing.userId,
        title: newListing.title,
        description: newListing.description,
        status: newListing.status,
        category: newListing.category,
        createdAt: newListing.createdAt,
        updatedAt: newListing.updatedAt,
        expiresAt: newListing.expiresAt,
        images: images,
        markers: newMarkers,
      };

      // Update the listingsAtom with the new listing
      const updatedListings = { ...get(listingsAtom), [listingId]: listing };
      set(listingsAtom, updatedListings);
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
  async (
    get,
    set,
    payload: {
      updatedListing: Listing;
      imageUpdates: { [key in ImageType]?: { action: 'add' | 'delete' | 'keep'; file?: File } };
    }
  ): Promise<void> => {
    console.log(`[listingStore/updateListingAtom]: updatedListing: ${payload.updatedListing}`);
    const { updatedListing, imageUpdates } = payload;
    try {
      // Extract the listing id and the update data & get the original listing
      const { id, ...updateData } = updatedListing;
      const originalListing = get(listingsAtom)[id];

      // Get the original images
      const updatedImages: ListingImages = originalListing.images;

      for (const [type, update] of Object.entries(imageUpdates) as [
        ImageType,
        { action: 'add' | 'delete' | 'keep'; file?: File },
      ][]) {
        if (update.action === 'add' && update.file) {
          // If there's an existing image, delete it first
          if (updatedImages[type]?.id) {
            await deleteImage(updatedImages[type]!.id!);
          }

          const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(update.file!);
          });
          const imageId = await addImage(base64Image, id);
          updatedImages[type] = { id: imageId, listingId: id, data: base64Image };
        } else if (update.action === 'delete') {
          if (updatedImages[type]?.id) {
            await deleteImage(updatedImages[type]!.id!);
            delete updatedImages[type];
          }
        }
        // If action is 'keep', do nothing
      }

      // Handle marker updates
      const existingMarkers = get(markersAtom);

      // Update existing markers or add new markers
      const updatedMarkerIds = await Promise.all(
        updatedListing.markers.map(async (marker) => {
          if (marker.id) {
            // Update existing marker
            await updateMarker(
              {
                id: marker.id,
                listingId: id,
                name: marker.name,
                latitude: marker.latitude,
                longitude: marker.longitude,
                radius: marker.radius,
              },
              existingMarkers,
              set
            );
            return marker.id;
          } else {
            // Add new marker
            const addedMarker = await addMarker(set, {
              listingId: id,
              name: marker.name,
              latitude: marker.latitude,
              longitude: marker.longitude,
              radius: marker.radius,
            });
            return addedMarker.id;
          }
        })
      );

      // Remove markers that are no longer associated with the listing
      const markersToRemove = originalListing.markers.filter(
        (marker) => !updatedMarkerIds.includes(marker.id)
      );
      await Promise.all(
        markersToRemove.map((marker) => deleteMarker(marker.id, existingMarkers, set))
      );

      // Create an object to store the image IDs
      const listingImageIds: {
        mainId: string;
        alt1Id?: string;
        alt2Id?: string;
      } = { mainId: '' };

      if (updatedImages.main.id) {
        console.log('updatedImages.main.id', updatedImages.main.id);
        listingImageIds.mainId = updatedImages.main.id;
      }
      if (updatedImages.alt1?.id) {
        console.log('updatedImages.alt1?.id', updatedImages.alt1?.id);
        listingImageIds.alt1Id = updatedImages.alt1.id;
      }
      if (updatedImages.alt2?.id) {
        console.log('updatedImages.alt2?.id', updatedImages.alt2?.id);
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
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        markerIds: updatedMarkerIds,
        images: listingImageIds,
      };

      console.log('🔥 [listingStore/updateListingAtom] ');
      await updateDoc(doc(db, 'Listings', id), listingUpdate);

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
      console.error(`[listingStore/updateListingAtom]: error: ${error}`);
      throw error;
    }
  }
);

/**
 * @TODO Add the functionality to delete the associated match
 * @description Delete a listing from Firestore & delete the associated images
 * @param {string} listingId - The ID of the listing to delete
 * @returns {Promise<void>} - A promise that resolves when the listing is deleted
 */
export const deleteListingAtom = atom(null, async (get, set, listingId: string): Promise<void> => {
  console.log(`[listingStore/deleteListingAtom]: listingId: ${listingId}`);
  try {
    // Get the listing to delete
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

    // TODO: Delete associated match

    // Delete the listing document
    console.log('🔥 [listingStore/deleteListingAtom]');
    await deleteDoc(doc(db, 'Listings', listingId));

    // Update the client-side state
    set(listingsAtom, (prev) => {
      const newListings = { ...prev };
      delete newListings[listingId];
      return newListings;
    });
  } catch (error) {
    console.error(`[listingStore/deleteListingAtom]: error: ${error}`);
    throw error;
  }
});

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
    alt1: listingDB.images.alt1Id
      ? { id: listingDB.images.alt1Id, listingId: listingDB.id, data: '' }
      : undefined,
    alt2: listingDB.images.alt2Id
      ? { id: listingDB.images.alt2Id, listingId: listingDB.id, data: '' }
      : undefined,
  },
  markers,
});

/**
 * @TODO Complete the function
 * @description For all the listings, check for (1) matches and (2) expiry
 * @param {Listing[]} listings - The listings to check
 * @returns {Promise<void>} - A promise that resolves when the listings are checked
 */
const checkForMatchesAndExpiry = async (listings: Listing[]): Promise<void> => {
  console.log(`[listingStore/checkForMatchesAndExpiry] ${listings.length} listings to check`);
  return;
};


// FOR JACOB's MAP FUNCTION
// Function to fetch all listings and their markers
export const fetchListingsWithMarkers = async () => {
  try {
    // Fetch all listings
    const listingsSnapshot = await getDocs(collection(db, 'Listings'));
    const listings = listingsSnapshot.docs.map((listingDoc) => ({
      id: listingDoc.id,
      ...listingDoc.data(),
    }));

    const listingsWithMarkers = await Promise.all(
      listings.map(async (listing) => {
        // Fetch associated markers for each listing
        const markers = await Promise.all(
          listing.markerIds.map(async (markerId) => {
            const markerDoc = await getDoc(doc(db, 'Markers', markerId));
            return markerDoc.exists() ? { id: markerDoc.id, ...markerDoc.data() } : null;
          })
        );

        return {
          ...listing,
          markers: markers.filter((marker) => marker !== null),
        };
      })
    );

    return listingsWithMarkers;
  } catch (error) {
    console.error('Error fetching listings and markers:', error);
    throw error;
  }
};