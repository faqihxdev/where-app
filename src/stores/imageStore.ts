import { db } from '../firebaseConfig';
import { collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { ImageDB } from '../types';
import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
// Store the images in client side
export const imagesAtom = atomWithStorage<Record<string, ImageDB>>('images', {});

/**
 * @description Add a new image to Firestore
 * @param {string} imageData - The base64 data of the image
 * @param {string} listingId - The ID of the listing this image belongs to
 * @returns {Promise<string>} - A promise that resolves with the image id when the image is added
 */
export const addImageAtom = atom(
  null,
  async (_, set, imageData: string, listingId: string): Promise<string> => {
    console.log(`[imageStore/addImageAtom]: Adding image to listing: ${listingId}`);
    try {
      // Create a new image object to add to Firestore
      const newImage: Omit<ImageDB, 'id'> = {
        listingId,
        data: imageData,
      };

      // Add the image to the Images collection
      console.log('🔥[imageStore/addImageAtom]');
      const docRef = await addDoc(collection(db, 'Images'), newImage);

      // Update the images atom with the new image
      set(imagesAtom, (prev) => ({ ...prev, [docRef.id]: { id: docRef.id, ...newImage } }));

      return docRef.id;
    } catch (error) {
      console.error(`[imageStore/addImageAtom]: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Get an image from Firestore
 * @param {string} imageId - The ID of the image to get
 * @returns {Promise<ImageDB | null>} - A promise that resolves when the image is fetched
 */
export const getImageAtom = atom(
  null,
  async (get, set, imageId: string): Promise<ImageDB | null> => {
    console.log(`[imageStore/getImageAtom]: Getting image: ${imageId}`);
    try {
      // Check if the image is already in the images atom
      const existingImage = get(imagesAtom)[imageId];
      if (existingImage) {
        return existingImage;
      }

      // Get the image from the Images collection
      console.log('🔥[imageStore/getImageAtom]');
      const docRef = doc(db, 'Images', imageId);
      const docSnap = await getDoc(docRef);

      // Return the image if it exists
      if (docSnap.exists()) {
        const image = { id: docSnap.id, ...docSnap.data() } as ImageDB;
        set(imagesAtom, (prev) => ({ ...prev, [docSnap.id]: image }));
        return image;
      }
      return null;
    } catch (error) {
      console.error(`[imageStore/getImageAtom]: ${error}`);
      throw error;
    }
  }
);

/**
 * TODO: UNUSED
 * @description Update an image in Firestore
 * @param {string} imageId - The ID of the image to update
 * @param {string} newData - The new data of the image
 * @returns {Promise<void>} - A promise that resolves when the image is updated
 */
export const updateImageAtom = atom(
  null,
  async (get, set, imageId: string, newData: string): Promise<void> => {
    console.log(`[imageStore/updateImageAtom]: Updating image: ${imageId}`);
    try {
      // Update the image in the Images collection
      console.log('🔥[imageStore/updateImageAtom]');
      const docRef = doc(db, 'Images', imageId);
      await updateDoc(docRef, { data: newData });

      // Update the images atom with the new image
      const existingImage = get(imagesAtom)[imageId];
      set(imagesAtom, (prev) => ({ ...prev, [imageId]: { ...existingImage, data: newData } }));
    } catch (error) {
      console.error('[imageStore/updateImageAtom]: ', error);
      throw error;
    }
  }
);

/**
 * @description Delete an image from Firestore
 * @param {string} imageId - The ID of the image to delete
 * @returns {Promise<void>} - A promise that resolves when the image is deleted
 */
export const deleteImageAtom = atom(null, async (_, set, imageId: string): Promise<void> => {
  console.log(`[imageStore/deleteImageAtom]: Deleting image: ${imageId}`);
  try {
    // Delete the image from the Images collection
    console.log('🔥[imageStore/deleteImageAtom]');
    await deleteDoc(doc(db, 'Images', imageId));

    // Delete the image from the images atom
    set(imagesAtom, (prev) => {
      const newImages = { ...prev };
      delete newImages[imageId];
      return newImages;
    });
  } catch (error) {
    console.error(`[imageStore/deleteImageAtom]: ${error}`);
    throw error;
  }
});

/* ########## HELPER FUNCTIONS ########## */

/**
 * @description Compress an image
 * @param {File} file - The file to compress
 * @returns {Promise<File>} - A promise that resolves when the image is compressed
 */
export const compressImage = async (file: File): Promise<File> => {
  console.log(`[imageStore/compressImage]: Compressing image: ${file.name}`);
  try {
    // Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.67,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    // Return the compressed image
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error(`[imageStore/compressImage]: ${error}`);
    throw error;
  }
};
