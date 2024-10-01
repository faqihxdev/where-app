import { atomWithStorage } from 'jotai/utils';
import { Marker } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

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
    const docRef = await addDoc(collection(db, 'Markers'), newMarker);
    console.log('[markerStore/addMarker] 🔥');
    const marker: Marker = { id: docRef.id, ...newMarker };
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
