import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  Listing,
  ListingDB,
  ListingImages,
  Marker,
  ImageType,
  ListingStatus,
  Match,
  MatchStatus,
  NotificationType,
} from '../types';
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
import { addImageAtom, deleteImageAtom, getImageAtom } from './imageStore';
import {
  markersAtom,
  addMarkerAtom,
  fetchMarkerByIdAtom,
  deleteMarkerAtom,
  updateMarkerAtom,
} from './markerStore';
import { fetchListingUserAtom } from './userStore';
import { addMatchAtom, matchesAtom } from './matchStore';
import {
  addNotificationAtom,
  notificationsLoadedAtom,
  userNotificationsAtom,
} from './notificationStore';
import { cosineSimilarity, doMarkersOverlap } from '../utils/utils';

// The listings atom is used to store the listings in the client-side state
export const listingsAtom = atomWithStorage<Record<string, Listing>>('listings', {});

// The listingsFetched atom is used to store the boolean value indicating if the listings have been fetched from Firestore
export const listingsFetchedAtom = atomWithStorage<boolean>('listingsFetched', false);

// Add this new atom at the top of the file with other atom declarations
export const userListingsFetchedAtom = atomWithStorage<boolean>('userListingsFetched', false);

/**
 * @description Fetch all listings from Firestore
 * @returns {Promise<void>} - A promise that resolves when the listings are fetched
 */
export const fetchAllListingsAtom = atom(null, async (_, set): Promise<Record<string, Listing>> => {
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

      // Fetch markers using the fetchMarkerByIdAtom function & update the markersAtom
      const markers = await Promise.all(
        markerIds.map(async (markerId) => {
          const marker = await set(fetchMarkerByIdAtom, markerId);
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
          const imageDoc = await set(getImageAtom, listing.images[type]!.id);
          if (imageDoc) {
            listing.images[type]!.data = imageDoc.data;
          }
        }
      }

      // Fetch the listing user
      await set(fetchListingUserAtom, listing.userId);

      // Add the listing to the listingsAtom
      listings[doc.id] = listing;
    }

    // Check for matches and expiry
    await set(matchExpiryCheckAtom, Object.values(listings));

    // Update the listingsAtom with the new listings
    set(listingsAtom, listings);
    set(listingsFetchedAtom, true);

    return listings;
  } catch (error) {
    console.error(`[listingStore] Error fetching listings: ${error}`);
    throw error;
  }
});

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

        // Fetch markers using the fetchMarkerByIdAtom function & update the markersAtom
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await set(fetchMarkerByIdAtom, markerId);
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
            const imageDoc = await set(getImageAtom, listing.images[type]!.id);
            if (imageDoc) {
              listing.images[type]!.data = imageDoc.data;
            }
          }
        }

        // Fetch the listing user
        await set(fetchListingUserAtom, listing.userId);

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

        // Fetch markers using the fetchMarkerByIdAtom function & update the markersAtom
        const markers = await Promise.all(
          markerIds.map(async (markerId) => {
            const marker = await set(fetchMarkerByIdAtom, markerId);
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
            const imageDoc = await set(getImageAtom, listing.images[type]!.id);
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

      // Set userListingsFetched to true
      set(userListingsFetchedAtom, true);

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
        const imageId = await set(addImageAtom, base64Image, listingId);

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
          const addedMarker = await set(addMarkerAtom, newMarker);
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
            await set(deleteImageAtom, updatedImages[type]!.id!);
          }

          const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(update.file!);
          });
          const imageId = await set(addImageAtom, base64Image, id);
          updatedImages[type] = { id: imageId, listingId: id, data: base64Image };
        } else if (update.action === 'delete') {
          if (updatedImages[type]?.id) {
            await set(deleteImageAtom, updatedImages[type]!.id!);
            delete updatedImages[type];
          }
        }
        // If action is 'keep', do nothing
      }

      // Handle marker updates

      // Update existing markers or add new markers
      const updatedMarkerIds = await Promise.all(
        updatedListing.markers.map(async (marker) => {
          if (marker.id) {
            // Update existing marker
            await set(updateMarkerAtom, {
              id: marker.id,
              listingId: id,
              name: marker.name,
              latitude: marker.latitude,
              longitude: marker.longitude,
              radius: marker.radius,
            });
            return marker.id;
          } else {
            // Add new marker
            const addedMarker = await set(addMarkerAtom, {
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
        markersToRemove.map(async (marker) => await set(deleteMarkerAtom, marker.id))
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
    if (listing.images.main.id) await set(deleteImageAtom, listing.images.main.id);
    if (listing.images.alt1?.id) await set(deleteImageAtom, listing.images.alt1.id);
    if (listing.images.alt2?.id) await set(deleteImageAtom, listing.images.alt2.id);

    // Delete associated markers
    if (listing.markers.length > 0) {
      for (const marker of listing.markers) {
        await set(deleteMarkerAtom, marker.id);
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

/**
 * @description Set the status of a listing to expired
 * @param {string} listingId - The ID of the listing to set to expired
 * @returns {Promise<void>} - A promise that resolves when the listing is set to expired
 */
const setListingStatusToExpiredAtom = atom(
  null,
  async (_, set, listingId: string): Promise<void> => {
    console.log(`[listingStore/setListingStatusToExpiredAtom]: listingId: ${listingId}`);
    try {
      // Update the listing status to expired
      console.log('🔥 [listingStore/setListingStatusToExpiredAtom]');
      await updateDoc(doc(db, 'Listings', listingId), {
        status: ListingStatus.expired,
      });

      // Update the client-side state
      set(listingsAtom, (prev) => ({
        ...prev,
        [listingId]: { ...prev[listingId], status: ListingStatus.expired },
      }));
    } catch (error) {
      console.error(`[listingStore/setListingStatusToExpiredAtom]: error: ${error}`);
      throw error;
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
 * @description For all the listings, check for (1) expiry and (2) matches
 * @param {Listing[]} listings - The listings to check
 * @param {Record<string, Match>} existingMatches - The existing matches
 * @returns {Promise<void>} - A promise that resolves when the listings are checked
 */
const matchExpiryCheckAtom = atom(null, async (get, set, listings: Listing[]): Promise<void> => {
  console.log(`[listingStore/matchExpiryCheck] ${listings.length} listings to check`);

  if (!get(notificationsLoadedAtom)) {
    console.log('[listingStore/matchExpiryCheck] Notifications not loaded yet, skipping check');
    return;
  }

  // For every listing, check if it has expired
  for (const listing of listings) {
    if (listing.expiresAt < new Date()) {
      // Set the listing status to expired
      await set(setListingStatusToExpiredAtom, listing.id);

      // Notify the user that their listing has expired
      await set(addNotificationAtom, {
        userId: listing.userId,
        title: 'Listing Expired',
        message: 'Your listing has expired',
        type: NotificationType.expiry,
        listingId: listing.id,
      });

      // TODO: Push Notification to the user
    }
  }

  // For every listing, check if it has a match
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const listing1 = listings[i];
      const listing2 = listings[j];

      // Check if these listings have already been matched
      const existingMatch = Object.values(get(matchesAtom)).find(
        (match) =>
          (match.listingId1 === listing1.id && match.listingId2 === listing2.id) ||
          (match.listingId1 === listing2.id && match.listingId2 === listing1.id)
      );

      if (!existingMatch) {
        // If no existing match, check for a new match
        if (isMatch(listing1, listing2)) {
          console.warn('[listingStore/matchExpiryCheck] New match found', listing1, listing2);
          const newMatch: Omit<Match, 'id'> = {
            listingId1: listing1.id,
            listingId2: listing2.id,
            userId1: listing1.userId,
            userId2: listing2.userId,
            status: MatchStatus.new,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Use the addMatchAtom to add the new match
          await set(addMatchAtom, newMatch);

          // Notify the users that they have a new match
          console.log('Current notifications before adding:', get(userNotificationsAtom));

          for (const userId of new Set([listing1.userId, listing2.userId])) {
            await set(addNotificationAtom, {
              userId,
              title: 'New Match',
              message: 'You have a new match',
              type: NotificationType.match,
              listingId: userId === listing1.userId ? listing1.id : listing2.id,
            });
          }

          // TODO: Push Notification to the users

          console.log(
            `[listingStore/matchExpiryCheck] New match found: ${listing1.id} & ${listing2.id}`
          );
        }
      }
    }
  }
});

/**
 * @description Check if two listings match
 * @param {Listing} listing1 - The first listing
 * @param {Listing} listing2 - The second listing
 * @returns {boolean} - True if the listings match, false otherwise
 */
const isMatch = (listing1: Listing, listing2: Listing): boolean => {
  // Condition 1: Types must be opposite
  if (listing1.type === listing2.type) {
    return false;
  }

  // Condition 2: Same category
  if (listing1.category !== listing2.category) {
    return false;
  }

  // Condition 3: Status cannot be resolved
  if (listing1.status === ListingStatus.resolved || listing2.status === ListingStatus.resolved) {
    return false;
  }

  // Condition 4: Marker overlap
  const buffer = 100; // 100 meters additional buffer
  const markersOverlap = listing1.markers.some((marker1) =>
    listing2.markers.some((marker2) => doMarkersOverlap(marker1, marker2, buffer))
  );

  if (!markersOverlap) {
    console.log(
      "[listingStore/isMatch] Markers Don't Overlap:",
      listing1.markers,
      listing2.markers
    );
    return false;
  }

  // Condition 5: Cosine similarity > 0.8
  const combinedText1 = `${listing1.title}`;
  const combinedText2 = `${listing2.title}`;
  const similarity = cosineSimilarity(combinedText1, combinedText2);

  if (similarity < 0.8) {
    return false;
  }

  console.log(similarity);

  // All conditions are satisfied
  return true;
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