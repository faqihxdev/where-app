import { atom } from 'jotai'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { User } from '../types'
import { atomWithStorage } from 'jotai/utils'

// Store the user data for the current user
export const userDataAtom = atomWithStorage<User | null>('userData', null)

// Store the user data for the users of the listings
export const listingUsersAtom = atomWithStorage<Record<string, User>>('listingUsers', {})

/**
 * @description Fetch user data from Firestore
 * @param {string} uid - The ID of the user to fetch
 * @returns {Promise<User | null>} - A promise that resolves when the user data is fetched
 */
export const fetchUserDataAtom = atom(null, async (_, set, uid: string): Promise<User | null> => {
  console.log(`[userStore/fetchUserData]: uid: ${uid}`)
  try {
    // Fetch the user data from Firestore
    console.log('🔥 [userStore/fetchUserData]')
    const userDoc = await getDoc(doc(db, 'Users', uid))

    // If the user document exists, set the user data atom
    if (userDoc.exists()) {
      const userData = userDoc.data() as User
      console.log(`[userStore/fetchUserData]: User data fetched: ${userData}`)
      set(userDataAtom, userData)
      return userData
    } else {
      console.error(`[userStore/fetchUserData]: No user document found for uid: ${uid}`)
      set(userDataAtom, null)
      return null
    }
  } catch (error) {
    console.error(`[userStore/fetchUserData]: Error fetching user data: ${error}`)
    set(userDataAtom, null)
    throw error
  }
})

/**
 * @description Update user data in Firestore
 * @param {Partial<User>} userData - The user data to update
 * @returns {Promise<User | null>} - A promise that resolves when the user data is updated
 */
export const updateUserAtom = atom(
  null,
  async (get, set, userData: Partial<User>): Promise<User | null> => {
    console.log(`[userStore/updateUserAtom]: userData: ${userData}`)

    // Get the current user data
    const currentUser = get(userDataAtom)

    // If the current user data exists, update the user data in Firestore
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }
      try {
        console.log('🔥 [userStore/updateUserAtom]')
        await setDoc(doc(db, 'Users', currentUser.uid), updatedUser, { merge: true })
        set(userDataAtom, updatedUser)
        return updatedUser
      } catch (error) {
        console.error(`[userStore/updateUserAtom]: Error updating user data: ${error}`)
        throw error
      }
    }
    return null
  }
)

/**
 * @description Fetch user data for a listing from Firestore (get user data for listing card etc)
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<User | null>} - A promise that resolves when the user data is fetched
 */
export const fetchUserListingsAtom = atom(
  null,
  async (get, set, userId: string): Promise<User | null> => {
    console.log(`[userStore/fetchListingUserDataAtom]: userId: ${userId}`)

    // Get the listing users from the listing users atom
    const listingUsers = get(listingUsersAtom)

    // If the user data exists in the listing users atom, return it
    if (listingUsers[userId]) {
      return listingUsers[userId]
    }

    // If the user data does not exist in the listing users atom, fetch it from Firestore
    try {
      console.log('🔥 [userStore/fetchListingUserDataAtom]')
      const userDoc = await getDoc(doc(db, 'Users', userId))

      // If the user document exists, set the user data in the listing users atom
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        console.log(`[userStore/fetchListingUserDataAtom]: User data fetched: ${userData}`)
        set(listingUsersAtom, (prev) => ({ ...prev, [userId]: userData }))
        return userData
      }
    } catch (error) {
      console.error(`[userStore/fetchListingUserDataAtom]: Error fetching user data: ${error}`)
      throw error
    }
    return null
  }
)

/* ########## HELPER FUNCTIONS ########## */

/**
 * @description Get the avatar URL for the user
 * @param {string} name - The name of the user
 * @returns {string} - The avatar URL
 */
export const getAvatarUrl = (name: string): string => {
  if (name) {
    const encodedName = encodeURIComponent(name)
    return `https://api.dicebear.com/9.x/initials/svg?backgroundType=gradientLinear&seed=${encodedName}`
  } else {
    return 'https://api.dicebear.com/9.x/glass/svg?backgroundColor=1A5FFF'
  }
}
