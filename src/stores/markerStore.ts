import { atomWithStorage } from 'jotai/utils';
import { Marker } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export const markersAtom = atomWithStorage<Record<string, Marker>>('markers', {});

/**
 * @description Add a new marker to Firestore and update the markers atom
 * @param {Omit<Marker, 'id'>} newMarker - The new marker to add
 * @returns {Promise<Marker>} - A promise that resolves when the marker is added
 */
export const addMarker = async (
  set: (atom: typeof markersAtom, update: (prev: Record<string, Marker>) => Record<string, Marker>) => void,
  newMarker: Omit<Marker, 'id'>
): Promise<Marker> => {
  console.log('[markerStore/addMarker]: newMarker:', newMarker);
  try {
    const newMarkerToAdd: Omit<Marker, 'id'> = {
      name: newMarker.name,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
      radius: newMarker.radius,
      listingId: newMarker.listingId,
    };
    const docRef = await addDoc(collection(db, 'Markers'), newMarkerToAdd);
    console.log('[markerStore/addMarker] 🔥');
    const marker: Marker = { id: docRef.id, ...newMarkerToAdd };
    set(markersAtom, (prev) => ({ ...prev, [docRef.id]: marker }));
    return marker;
  } catch (error) {
    console.error('[markerStore/addMarker]: error:', error);
    throw error;
  }
};


/**
 * @description Fetch a marker from Firestore by ID
 * @param {string} markerId - The ID of the marker to fetch
 * @param {Record<string, Marker>} existingMarkers - Existing markers from the atom
 * @returns {Promise<Marker | null>} - A promise that resolves to the fetched marker
 */
export const fetchMarker = async (
  markerId: string,
  existingMarkers: Record<string, Marker>
): Promise<Marker | null> => {
  console.log('[markerStore/fetchMarker]: markerId:', markerId);
  if (!markerId) {
    console.error('[markerStore/fetchMarker]: Invalid markerId');
    return null;
  }

  if (existingMarkers[markerId]) {
    return existingMarkers[markerId];
  }

  try {
    const markerDoc = await getDoc(doc(db, 'Markers', markerId));
    console.log('[markerStore/fetchMarker] 🔥');
    if (markerDoc.exists()) {
      const markerData = markerDoc.data() as Omit<Marker, 'id'>;
      const marker: Marker = { id: markerDoc.id, ...markerData };
      return marker;
    }
  } catch (error) {
    console.error('[markerStore/fetchMarker]: error:', error);
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
  set: (atom: typeof markersAtom, update: (prev: Record<string, Marker>) => Record<string, Marker>) => void
): Promise<void> => {
  console.log('[markerStore/updateMarker]: markerId:', updatedMarker.id);
  if (!updatedMarker.id) {
    console.error('[markerStore/updateMarker]: Invalid markerId');
    return;
  }

  if (!existingMarkers[updatedMarker.id]) {
    console.error('[markerStore/updateMarker]: Marker not found');
    return;
  }

  try {
    await updateDoc(doc(db, 'Markers', updatedMarker.id), {
      name: updatedMarker.name,
      latitude: updatedMarker.latitude,
      longitude: updatedMarker.longitude,
      radius: updatedMarker.radius,
      listingId: updatedMarker.listingId,
    });
    console.log('[markerStore/updateMarker] 🔥');
    set(markersAtom, (prev) => {
      const newMarkers = { ...prev };
      newMarkers[updatedMarker.id] = updatedMarker;
      return newMarkers;
    });
  } catch (error) {
    console.error('[markerStore/updateMarker]: error:', error);
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
  set: (atom: typeof markersAtom, update: (prev: Record<string, Marker>) => Record<string, Marker>) => void
): Promise<void> => {
  console.log('[markerStore/deleteMarker]: markerId:', markerId);
  if (!markerId) {
    console.error('[markerStore/deleteMarker]: Invalid markerId');
    return;
  }

  if (!existingMarkers[markerId]) {
    console.error('[markerStore/deleteMarker]: Marker not found');
    return;
  }

  try {
    await deleteDoc(doc(db, 'Markers', markerId));
    console.log('[markerStore/deleteMarker] 🔥');
    set(markersAtom, (prev) => {
      const newMarkers = { ...prev };
      delete newMarkers[markerId];
      return newMarkers;
    });
  } catch (error) {
    console.error('[markerStore/deleteMarker]: error:', error);
  }
};

