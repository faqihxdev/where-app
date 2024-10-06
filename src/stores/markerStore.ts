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
export const addMarker = async (
  set: (
    atom: typeof markersAtom,
    update: (prev: Record<string, Marker>) => Record<string, Marker>
  ) => void,
  newMarker: Omit<Marker, 'id'>
): Promise<Marker> => {
  console.log(`[markerStore/addMarker]: Adding marker: ${newMarker}`);
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
    console.log('🔥 [markerStore/addMarker]');
    const docRef = await addDoc(collection(db, 'Markers'), newMarkerToAdd);

    // Update the markers atom with the new marker
    const marker: Marker = { id: docRef.id, ...newMarkerToAdd };
    set(markersAtom, (prev) => ({ ...prev, [docRef.id]: marker }));
    return marker;
  } catch (error) {
    console.error(`[markerStore/addMarker]: error: ${error}`);
    throw error;
  }
};

/**
 * @description Fetch a marker from Firestore by ID
 * @param {string} markerId - The ID of the marker to fetch
 * @param {Record<string, Marker>} existingMarkers - Existing markers from the atom
 * @returns {Promise<Marker | null>} - A promise that resolves to the fetched marker
 */
export const fetchMarkerById = async (
  markerId: string,
  existingMarkers: Record<string, Marker>
): Promise<Marker | null> => {
  console.log(`[markerStore/fetchMarkerById]: Fetching marker: ${markerId}`);

  // Check if the markerId is valid
  if (!markerId) {
    console.error('[markerStore/fetchMarkerById]: Invalid markerId');
    return null;
  }

  // Check if the marker already exists in the atom
  if (existingMarkers[markerId]) {
    return existingMarkers[markerId];
  }

  try {
    // Fetch the marker from Firestore
    console.log('🔥 [markerStore/fetchMarkerById]');
    const markerDoc = await getDoc(doc(db, 'Markers', markerId));

    // If the marker exists, update the markers atom with the new marker
    if (markerDoc.exists()) {
      const markerData = markerDoc.data() as Omit<Marker, 'id'>;
      const marker: Marker = { id: markerDoc.id, ...markerData };
      return marker;
    }
  } catch (error) {
    console.error(`[markerStore/fetchMarkerById]: error: ${error}`);
  }
  return null;
};

/**
 * @description Update a marker in Firestore
 * @param {Marker} updatedMarker - The updated marker data
 * @returns {Promise<void>} - A promise that resolves when the marker is updated
 */
export const updateMarker = async (
  updatedMarker: Marker,
  existingMarkers: Record<string, Marker>,
  set: (
    atom: typeof markersAtom,
    update: (prev: Record<string, Marker>) => Record<string, Marker>
  ) => void
): Promise<void> => {
  console.log(`[markerStore/updateMarker]: Updating marker: ${updatedMarker}`);

  // Check if the markerId is valid
  if (!updatedMarker.id) {
    console.error('[markerStore/updateMarker]: Invalid markerId');
    return;
  }

  // If the marker does not exist in the atom, return
  if (!existingMarkers[updatedMarker.id]) {
    console.error('[markerStore/updateMarker]: Marker not found');
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
    console.error(`[markerStore/updateMarker]: error: ${error}`);
  }
};

/**
 * @description Delete a marker from Firestore
 * @param {string} markerId - The ID of the marker to delete
 * @returns {Promise<void>} - A promise that resolves when the marker is deleted
 */
export const deleteMarker = async (
  markerId: string,
  existingMarkers: Record<string, Marker>,
  set: (
    atom: typeof markersAtom,
    update: (prev: Record<string, Marker>) => Record<string, Marker>
  ) => void
): Promise<void> => {
  console.log(`[markerStore/deleteMarker]: Deleting marker: ${markerId}`);

  // Check if the markerId is valid
  if (!markerId) {
    console.error('[markerStore/deleteMarker]: Invalid markerId');
    return;
  }

  // If the marker does not exist in the atom, return
  if (!existingMarkers[markerId]) {
    console.error('[markerStore/deleteMarker]: Marker not found');
    return;
  }

  try {
    // Delete the marker from Firestore
    console.log('🔥 [markerStore/deleteMarker]');
    await deleteDoc(doc(db, 'Markers', markerId));

    // Update the markers atom by removing the deleted marker
    set(markersAtom, (prev) => {
      const newMarkers = { ...prev };
      delete newMarkers[markerId];
      return newMarkers;
    });
  } catch (error) {
    console.error(`[markerStore/deleteMarker]: error: ${error}`);
  }
};

export const fetchAllMarkers = async (): Promise<Record<string, Marker>> => {
  console.log('[markerStore/fetchAllMarkers]: Fetching all markers');
  try {
    const markersSnapshot = await getDocs(collection(db, 'Markers'));
    const markers: Record<string, Marker> = {};

    markersSnapshot.forEach((doc) => {
      const markerData = doc.data() as Omit<Marker, 'id'>;
      const marker: Marker = { id: doc.id, ...markerData };
      markers[doc.id] = marker;
    });

    return markers;
  } catch (error) {
    console.error(`[markerStore/fetchAllMarkers]: error: ${error}`);
    throw error;
  }
};
