import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Notification } from '../types';
import { Timestamp } from 'firebase/firestore/lite';

// Store user notifications in AtomStorage
export const userNotificationsAtom = atomWithStorage<Record<string, Notification>>(
  'userNotifications',
  {}
);

// Store notificationsLoaded in AtomStorage
export const notificationsLoadedAtom = atomWithStorage<boolean>('notificationsLoaded', false);

/**
 * @description Add a new notification to Firestore and update the userNotifications atom
 * @param {Omit<Notification, 'id'>} newNotification - The new notification to add
 * @returns {Promise<Notification>} - A promise that resolves when the notification is added
 */
export const addNotificationAtom = atom(
  null,
  async (
    get,
    set,
    newNotification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'>
  ) => {
    console.log(
      `[notificationStore/addNotificationAtom]: Adding: ${JSON.stringify(newNotification)}`
    );

    const existingNotifications = get(userNotificationsAtom);
    if (Object.keys(existingNotifications).length === 0) {
      console.warn(
        '[notificationStore/addNotificationAtom]: Existing notifications are empty. This might be an error.'
      );
    }

    try {
      // Generate a hash-based notification ID asynchronously
      const notificationId = await generateNotificationId(
        newNotification.userId,
        newNotification.title,
        newNotification.message,
        newNotification.type
      );

      // Check if the notification already exists client side
      const existingNotification = existingNotifications[notificationId];
      if (existingNotification) {
        console.log(
          `[notificationStore/addNotificationAtom]: Notification already exists: ${existingNotification.id}`
        );
        return existingNotification;
      }

      // Create a new notification object with default values
      const newNotificationToAdd: Omit<Notification, 'id'> = {
        userId: newNotification.userId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        status: 'unread',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      // Check if listingId or matchId is provided
      if (newNotification.listingId) {
        newNotificationToAdd.listingId = newNotification.listingId;
      }
      if (newNotification.matchId) {
        newNotificationToAdd.matchId = newNotification.matchId;
      }

      // Check Firestore to see if a document with this ID already exists
      const docRef = doc(db, 'Notifications', notificationId);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        console.log(
          `[notificationStore/addNotificationAtom]: Notification with ID ${notificationId} already exists in Firestore.`
        );
        const existingFirestoreNotification = docSnapshot.data() as Notification;

        // Update Recoil state with the existing notification
        set(userNotificationsAtom, (prev) => ({
          ...prev,
          [notificationId]: existingFirestoreNotification,
        }));

        return existingFirestoreNotification;
      } else {
        // Add the new notification to Firestore using the generated ID
        await setDoc(docRef, newNotificationToAdd); // Uses `setDoc` to create/update a doc with a custom ID

        // Update the userNotifications atom with the new notification
        const notification: Notification = { id: notificationId, ...newNotificationToAdd };
        set(userNotificationsAtom, (prev) => ({ ...prev, [notificationId]: notification }));

        console.log(
          `[notificationStore/addNotificationAtom]: New notification added with ID ${notificationId}.`
        );
        return notification;
      }
    } catch (error) {
      console.error(`[notificationStore/addNotification]: error: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Fetch all notifications for a user from Firestore
 * @param {string} userId - The ID of the user to fetch notifications for
 * @returns {Promise<Record<string, Notification>>} - A promise that resolves to the fetched notifications
 */
export const fetchAllUserNotificationsAtom = atom(null, async (_, set, userId: string) => {
  console.log(
    `[notificationStore/fetchAllUserNotificationsAtom]: Fetching notifications for user: ${userId}`
  );
  try {
    console.log('🔥 [notificationStore/fetchAllUserNotificationsAtom]');
    const q = query(collection(db, 'Notifications'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const notifications: Record<string, Notification> = {};
    // const currentTime = new Date();

    querySnapshot.forEach((doc) => {
      const notificationData = doc.data() as Omit<
        Notification,
        'id' | 'expiresAt' | 'createdAt' | 'updatedAt'
      > & {
        expiresAt: Timestamp;
        createdAt: Timestamp;
        updatedAt: Timestamp;
      };

      const notification: Notification = {
        id: doc.id,
        ...notificationData,
        expiresAt: notificationData.expiresAt.toDate(),
        createdAt: notificationData.createdAt.toDate(),
        updatedAt: notificationData.updatedAt.toDate(),
      };

      // Check if the notification has expired and is not removed
      notifications[doc.id] = notification;
    });

    // Update the userNotifications atom with the fetched notifications
    set(userNotificationsAtom, notifications);
    set(notificationsLoadedAtom, true);

    return notifications;
  } catch (error) {
    console.error(`[notificationStore/fetchAllUserNotificationsAtom]: error: ${error}`);
    throw error;
  }
});

/**
 * @description Fetch a notification from Firestore by ID
 * @param {string} notificationId - The ID of the notification to fetch
 * @returns {Promise<Notification | null>} - A promise that resolves to the fetched notification
 */
export const fetchNotificationByIdAtom = atom(null, async (get, set, notificationId: string) => {
  console.log(
    `[notificationStore/fetchNotificationByIdAtom]: Fetching notification: ${notificationId}`
  );

  // Check if the notification already exists in the atom
  const existingNotifications = get(userNotificationsAtom);
  if (existingNotifications[notificationId]) {
    return existingNotifications[notificationId];
  }

  try {
    // Fetch the notification from Firestore
    console.log('🔥 [notificationStore/fetchNotificationByIdAtom]');
    const notificationDoc = await getDoc(doc(db, 'Notifications', notificationId));

    // If the notification exists, update the userNotifications atom with the new notification
    if (notificationDoc.exists()) {
      const notificationData = notificationDoc.data() as Omit<Notification, 'id'>;
      const notification: Notification = { id: notificationDoc.id, ...notificationData };
      set(userNotificationsAtom, (prev) => ({ ...prev, [notificationId]: notification }));
      return notification;
    }
  } catch (error) {
    console.error(`[notificationStore/fetchNotificationByIdAtom]: error: ${error}`);
  }
  return null;
});

/**
 * @description Mark notifications with a specific status in Firestore and update the userNotifications atom
 * @param {string[]} notificationIds - The IDs of the notifications to mark
 * @param {'read' | 'unread' | 'removed'} status - The status to set for the notifications
 * @returns {Promise<void>} - A promise that resolves when the notifications are marked
 */
export const markNotificationsAtom = atom(
  null,
  async (_, set, notificationIds: string[], status: 'read' | 'unread' | 'removed') => {
    console.log(
      `[notificationStore/markNotificationsAtom]: Marking notifications as ${status}: ${notificationIds}`
    );
    try {
      const batch = writeBatch(db);

      notificationIds.forEach((id) => {
        const notificationRef = doc(db, 'Notifications', id);
        batch.update(notificationRef, { status, updatedAt: new Date() });
      });

      console.log('🔥 [notificationStore/markNotificationsAtom]');
      await batch.commit();

      // Update the userNotifications atom
      set(userNotificationsAtom, (prev) => {
        const updated = { ...prev };
        notificationIds.forEach((id) => {
          if (updated[id]) {
            updated[id] = { ...updated[id], status, updatedAt: new Date() };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error(`[notificationStore/markNotificationsAtom]: error: ${error}`);
      throw error;
    }
  }
);

/**
 * @description Delete multiple notifications from Firestore and update the userNotifications atom
 * @param {string[]} notificationIds - The IDs of the notifications to delete
 * @returns {Promise<void>} - A promise that resolves when the notifications are deleted
 */
export const deleteNotificationsAtom = atom(null, async (_, set, notificationIds: string[]) => {
  console.log(
    `[notificationStore/deleteNotificationsAtom]: Deleting notifications: ${notificationIds}`
  );
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const notificationRef = doc(db, 'Notifications', id);
      batch.delete(notificationRef);
    });

    // Delete the notifications from Firestore
    console.log('🔥 [notificationStore/deleteNotificationsAtom]');
    await batch.commit();

    // Update the userNotifications atom by removing the deleted notifications
    set(userNotificationsAtom, (prev) => {
      const updated = { ...prev };
      notificationIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });
  } catch (error) {
    console.error(`[notificationStore/deleteNotificationsAtom]: error: ${error}`);
    throw error;
  }
});

/* ########## HELPER FUNCTIONS ########## */

/**
 * @description Generate a 20-character ID
 * @param {string} userId - The ID of the user
 * @param {string} title - The title of the notification
 * @param {string} message - The message of the notification
 * @param {string} type - The type of the notification
 * @returns {string} - A 20-character ID
 */
const generateNotificationId = async (
  userId: string,
  title: string,
  message: string,
  type: string
): Promise<string> => {
  const combinedString = `${userId}|${title}|${message}|${type}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combinedString);

  // Generate the SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert the buffer to a base64 string
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
  const hashString = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex
  const base64Hash = btoa(hashString); // Convert hex to base64

  // Truncate the base64-encoded string to 20 characters
  return base64Hash.substring(0, 20);
};
