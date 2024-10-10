import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Marker } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';

// This marker atom is used to store the markers client-side
export const markersAtom = atomWithStorage<Record<string, Marker>>('markers', {});

/**
 * @description Add a new marker to Firestore and update the markers atom
 * @param {Omit<Marker, 'id'>} newMarker - The new marker to add
 * @returns {Promise<Marker>} - A promise that resolves when the marker is added
 */
export const addMarkerAtom = atom(
  null,
  async (_, set, newMarker: Omit<Marker, 'id'>): Promise<Marker> => {
    console.log(`[markerStore/addMarkerAtom]: Adding marker: ${newMarker}`);
    try {
      // Create a new marker object to add to Firestore
      const newMarkerToAdd: Omit<Marker, 'id'> = {
        listingId: newMarker.listingId,
        name: newMarker.name,
        latitude: newMarker.latitude,
        longitude: newMarker.longitude,
        radius: newMarker.radius,
      };

      // Add the new marker to Firestore
      console.log('🔥 [markerStore/addMarkerAtom]');
      const docRef = await addDoc(collection(db, 'Markers'), newMarkerToAdd);

      // Update the markers atom with the new marker
      const marker: Marker = { id: docRef.id, ...newMarkerToAdd };
      set(markersAtom, (prev) => ({ ...prev, [docRef.id]: marker }));
      return marker;
    } catch (error) {
      console.error(`[markerStore/addMarkerAtom]: error: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Fetch a marker from Firestore by ID
 * @param {string} markerId - The ID of the marker to fetch
 * @returns {Promise<Marker | null>} - A promise that resolves to the fetched marker
 */
export const fetchMarkerByIdAtom = atom(
  null,
  async (get, set, markerId: string): Promise<Marker | null> => {
    console.log(`[markerStore/fetchMarkerByIdAtom]: Fetching marker: ${markerId}`);

    // Check if the markerId is valid
    if (!markerId) {
      console.error('[markerStore/fetchMarkerByIdAtom]: Invalid markerId');
      return null;
    }

    // Check if the marker already exists in the atom
    const existingMarker = get(markersAtom)[markerId];
    if (existingMarker) {
      return existingMarker;
    }

    try {
      // Fetch the marker from Firestore
      console.log('🔥 [markerStore/fetchMarkerByIdAtom]');
      const markerDoc = await getDoc(doc(db, 'Markers', markerId));

      // If the marker exists, update the markers atom with the new marker
      if (markerDoc.exists()) {
        const markerData = markerDoc.data() as Omit<Marker, 'id'>;
        const marker: Marker = { id: markerDoc.id, ...markerData };
        set(markersAtom, (prev) => ({ ...prev, [markerDoc.id]: marker }));
        return marker;
      }
    } catch (error) {
      console.error(`[markerStore/fetchMarkerByIdAtom]: error: ${error}`);
    }
    return null;
  }
);

/**
 * @description Update a marker in Firestore
 * @param {Marker} updatedMarker - The updated marker data
 * @returns {Promise<void>} - A promise that resolves when the marker is updated
 */
export const updateMarkerAtom = atom(
  null,
  async (get, set, updatedMarker: Marker): Promise<void> => {
    console.log(`[markerStore/updateMarker]: Updating marker: ${updatedMarker}`);

    // Check if the markerId is valid
    if (!updatedMarker.id) {
      console.error('[markerStore/updateMarkerAtom]: Invalid markerId');
      return;
    }

    // If the marker does not exist in the atom, return
    const existingMarkers = get(markersAtom);
    if (!existingMarkers[updatedMarker.id]) {
      console.error('[markerStore/updateMarkerAtom]: Marker not found');
      return;
    }

    try {
      console.log('🔥 [markerStore/updateMarker]');
      await updateDoc(doc(db, 'Markers', updatedMarker.id), {
        listingId: updatedMarker.listingId,
        name: updatedMarker.name,
        latitude: updatedMarker.latitude,
        longitude: updatedMarker.longitude,
        radius: updatedMarker.radius,
      });

      // Update the markers atom with the new marker
      set(markersAtom, (prev) => {
        const newMarkers = { ...prev };
        newMarkers[updatedMarker.id] = updatedMarker;
        return newMarkers;
      });
    } catch (error) {
      console.error(`[markerStore/updateMarkerAtom]: error: ${error}`);
    }
  }
);

/**
 * @description Delete a marker from Firestore
 * @param {string} markerId - The ID of the marker to delete
 * @returns {Promise<void>} - A promise that resolves when the marker is deleted
 */
export const deleteMarkerAtom = atom(null, async (get, set, markerId: string): Promise<void> => {
  console.log(`[markerStore/deleteMarkerAtom]: Deleting marker: ${markerId}`);

  // Check if the markerId is valid
  if (!markerId) {
    console.error('[markerStore/deleteMarkerAtom]: Invalid markerId');
    return;
  }

  // If the marker does not exist in the atom, return
  const existingMarkers = get(markersAtom);
  if (!existingMarkers[markerId]) {
    console.error('[markerStore/deleteMarkerAtom]: Marker not found');
    return;
  }

  try {
    // Delete the marker from Firestore
    console.log('🔥 [markerStore/deleteMarkerAtom]');
    await deleteDoc(doc(db, 'Markers', markerId));

    // Update the markers atom by removing the deleted marker
    set(markersAtom, (prev) => {
      const newMarkers = { ...prev };
      delete newMarkers[markerId];
      return newMarkers;
    });
  } catch (error) {
    console.error(`[markerStore/deleteMarkerAtom]: error: ${error}`);
  }
});

export const fetchAllMarkersAtom = atom(null, async (_, set): Promise<Record<string, Marker>> => {
  console.log('[markerStore/fetchAllMarkersAtom]: Fetching all markers');
  try {
    console.log('🔥 [markerStore/fetchAllMarkersAtom]');
    const markersSnapshot = await getDocs(collection(db, 'Markers'));
    const markers: Record<string, Marker> = {};

    markersSnapshot.forEach((doc) => {
      const markerData = doc.data() as Omit<Marker, 'id'>;
      const marker: Marker = { id: doc.id, ...markerData };
      markers[doc.id] = marker;
    });

    set(markersAtom, markers);
    return markers;
  } catch (error) {
    console.error(`[markerStore/fetchAllMarkersAtom]: error: ${error}`);
    throw error;
  }
});