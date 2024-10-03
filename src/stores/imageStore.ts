import { db } from '../firebaseConfig'
import { collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import imageCompression from 'browser-image-compression'
import { ImageDB } from '../types'

/**
 * @description Add a new image to Firestore
 * @param {string} imageData - The base64 data of the image
 * @param {string} listingId - The ID of the listing this image belongs to
 * @returns {Promise<string>} - A promise that resolves with the image id when the image is added
 */
export const addImage = async (imageData: string, listingId: string): Promise<string> => {
  console.log(`[imageStore/addImage]: Adding image to listing: ${listingId}`)
  try {
    const newImage: Omit<ImageDB, 'id'> = {
      listingId,
      data: imageData,
    }

    // Add the image to the Images collection
    console.log('🔥[imageStore/addImage]')
    const docRef = await addDoc(collection(db, 'Images'), newImage)
    return docRef.id
  } catch (error) {
    console.error(`[imageStore/addImage]: ${error}`)
    throw error
  }
}

/**
 * @description Get an image from Firestore
 * @param {string} imageId - The ID of the image to get
 * @returns {Promise<ImageDB | null>} - A promise that resolves when the image is fetched
 */
export const getImage = async (imageId: string): Promise<ImageDB | null> => {
  console.log(`[imageStore/getImage]: Getting image: ${imageId}`)
  try {
    // Get the image from the Images collection
    console.log('🔥[imageStore/getImage]')
    const docRef = doc(db, 'Images', imageId)
    const docSnap = await getDoc(docRef)

    // Return the image if it exists
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ImageDB
    }
    return null
  } catch (error) {
    console.error(`[imageStore/getImage]: ${error}`)
    throw error
  }
}

/**
 * @description Update an image in Firestore
 * @param {string} imageId - The ID of the image to update
 * @param {string} newData - The new data of the image
 * @returns {Promise<void>} - A promise that resolves when the image is updated
 */
export const updateImage = async (imageId: string, newData: string): Promise<void> => {
  console.log(`[imageStore/updateImage]: Updating image: ${imageId}`)
  try {
    // Update the image in the Images collection
    console.log('🔥[imageStore/updateImage]')
    const docRef = doc(db, 'Images', imageId)
    await updateDoc(docRef, { data: newData })
  } catch (error) {
    console.error('[imageStore/updateImage]: ', error)
    throw error
  }
}

/**
 * @description Delete an image from Firestore
 * @param {string} imageId - The ID of the image to delete
 * @returns {Promise<void>} - A promise that resolves when the image is deleted
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  console.log(`[imageStore/deleteImage]: Deleting image: ${imageId}`)
  try {
    // Delete the image from the Images collection
    console.log('🔥[imageStore/deleteImage]')
    await deleteDoc(doc(db, 'Images', imageId))
  } catch (error) {
    console.error(`[imageStore/deleteImage]: ${error}`)
    throw error
  }
}

/**
 * @description Compress an image
 * @param {File} file - The file to compress
 * @returns {Promise<File>} - A promise that resolves when the image is compressed
 */
export const compressImage = async (file: File): Promise<File> => {
  console.log(`[imageStore/compressImage]: Compressing image: ${file.name}`)
  try {
    // Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.67,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })

    // Return the compressed image
    return new File([compressedFile], file.name, { type: compressedFile.type })
  } catch (error) {
    console.error(`[imageStore/compressImage]: ${error}`)
    throw error
  }
}
