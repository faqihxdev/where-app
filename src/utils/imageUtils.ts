import { db } from '../firebaseConfig';
import { collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

export interface ImageDocument {
  id: string;
  src: string;
}

/**
 * @description Add a new image to Firestore
 * @param {string} imageSrc - The source of the image
 * @returns {Promise<string>} - A promise that resolves when the image is added
 */
export const addImage = async (imageSrc: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'Images'), { src: imageSrc });
    return docRef.id;
  } catch (error) {
    console.error('[imageUtils/addImage]: ', error);
    throw error;
  }
};

/**
 * @description Get an image from Firestore
 * @param {string} imageId - The ID of the image to get
 * @returns {Promise<ImageDocument | null>} - A promise that resolves when the image is fetched
 */
export const getImage = async (imageId: string): Promise<ImageDocument | null> => {
  try {
    const docRef = doc(db, 'Images', imageId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, src: docSnap.data().src };
    }
    return null;
  } catch (error) {
    console.error('[imageUtils/getImage]: ', error);
    throw error;
  }
};

/**
 * @description Update an image in Firestore
 * @param {string} imageId - The ID of the image to update
 * @param {string} newSrc - The new source of the image
 * @returns {Promise<void>} - A promise that resolves when the image is updated
 */
export const updateImage = async (imageId: string, newSrc: string): Promise<void> => {
  try {
    const docRef = doc(db, 'Images', imageId);
    await updateDoc(docRef, { src: newSrc });
  } catch (error) {
    console.error('[imageUtils/updateImage]: ', error);
    throw error;
  }
};

/**
 * @description Delete an image from Firestore
 * @param {string} imageId - The ID of the image to delete
 * @returns {Promise<void>} - A promise that resolves when the image is deleted
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'Images', imageId));
  } catch (error) {
    console.error('[imageUtils/deleteImage]: ', error);
    throw error;
  }
};

/**
 * @description Compress an image
 * @param {File} file - The file to compress
 * @returns {Promise<File>} - A promise that resolves when the image is compressed
 */
export const compressImage = async (file: File): Promise<File> => {
  try {
    const options = {
      maxSizeMB: 0.67, // 670KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error('[imageUtils/compressImage]: ', error);
    throw error;
  }
};