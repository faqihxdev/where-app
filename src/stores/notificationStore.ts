import { atomWithStorage } from 'jotai/utils';
import { SetStateAction } from 'jotai';
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
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

/**
 * @description Add a new notification to Firestore and update the userNotifications atom
 * @param {Omit<Notification, 'id'>} newNotification - The new notification to add
 * @param {Function} setNotifications - Function to update the userNotificationsAtom
 * @returns {Promise<Notification>} - A promise that resolves when the notification is added
 */
export const addNotification = async (
  newNotification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'>,
  existingNotifications: Record<string, Notification>,
  setNotifications: (update: SetStateAction<Record<string, Notification>>) => void
): Promise<Notification> => {
  console.log(
    `[notificationStore/addNotification]: Adding notification: ${JSON.stringify(newNotification)}`
  );
  try {
    // Don't add if notification with userId, title, message, and type already exists
    const existingNotification = Object.values(existingNotifications).find(
      (notification) =>
        notification.userId === newNotification.userId &&
        notification.title === newNotification.title &&
        notification.message === newNotification.message &&
        notification.type === newNotification.type
    );

    if (existingNotification) {
      console.log(
        `[notificationStore/addNotification]: Notification already exists: ${existingNotification.id}`
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

    // Check if listingId is provided
    if (newNotification.listingId) {
      newNotificationToAdd.listingId = newNotification.listingId;
    }

    // Check if matchId is provided
    if (newNotification.matchId) {
      newNotificationToAdd.matchId = newNotification.matchId;
    }

    // Add the new notification to Firestore
    console.log('🔥 [notificationStore/addNotification]');
    const docRef = await addDoc(collection(db, 'Notifications'), newNotificationToAdd);

    // Update the userNotifications atom with the new notification
    const notification: Notification = { id: docRef.id, ...newNotificationToAdd };
    setNotifications((prev) => ({ ...prev, [docRef.id]: notification }));
    return notification;
  } catch (error) {
    console.error(`[notificationStore/addNotification]: error: ${error}`);
    throw error;
  }
};

/**
 * @description Fetch all notifications for a user from Firestore
 * @param {string} userId - The ID of the user to fetch notifications for
 * @param {Function} setNotifications - Function to update the userNotificationsAtom
 * @returns {Promise<Record<string, Notification>>} - A promise that resolves to the fetched notifications
 */
export const fetchAllUserNotifications = async (
  userId: string,
  setNotifications: (update: SetStateAction<Record<string, Notification>>) => void
): Promise<Record<string, Notification>> => {
  console.log(
    `[notificationStore/fetchAllUserNotifications]: Fetching notifications for user: ${userId}`
  );
  try {
    console.log('🔥 [notificationStore/fetchAllUserNotifications]');
    const q = query(collection(db, 'Notifications'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const notifications: Record<string, Notification> = {};
    const currentTime = new Date();

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
      if (notification.expiresAt > currentTime && notification.status !== 'removed') {
        notifications[doc.id] = notification;
      }
    });

    // Update the userNotifications atom with the fetched notifications
    setNotifications(notifications);
    return notifications;
  } catch (error) {
    console.error(`[notificationStore/fetchAllUserNotifications]: error: ${error}`);
    throw error;
  }
};

/**
 * @description Fetch a notification from Firestore by ID
 * @param {string} notificationId - The ID of the notification to fetch
 * @param {Record<string, Notification>} existingNotifications - Existing notifications from the atom
 * @param {Function} setNotifications - Function to update the userNotificationsAtom
 * @returns {Promise<Notification | null>} - A promise that resolves to the fetched notification
 */
export const fetchNotificationById = async (
  notificationId: string,
  existingNotifications: Record<string, Notification>,
  setNotifications: (update: SetStateAction<Record<string, Notification>>) => void
): Promise<Notification | null> => {
  console.log(
    `[notificationStore/fetchNotificationById]: Fetching notification: ${notificationId}`
  );

  // Check if the notification already exists in the atom
  if (existingNotifications[notificationId]) {
    return existingNotifications[notificationId];
  }

  try {
    // Fetch the notification from Firestore
    console.log('🔥 [notificationStore/fetchNotificationById]');
    const notificationDoc = await getDoc(doc(db, 'Notifications', notificationId));

    // If the notification exists, update the userNotifications atom with the new notification
    if (notificationDoc.exists()) {
      const notificationData = notificationDoc.data() as Omit<Notification, 'id'>;
      const notification: Notification = { id: notificationDoc.id, ...notificationData };
      setNotifications((prev) => ({ ...prev, [notificationId]: notification }));
      return notification;
    }
  } catch (error) {
    console.error(`[notificationStore/fetchNotificationById]: error: ${error}`);
  }
  return null;
};

/**
 * @description Mark notifications with a specific status in Firestore and update the userNotifications atom
 * @param {string[]} notificationIds - The IDs of the notifications to mark
 * @param {'read' | 'unread' | 'removed'} status - The status to set for the notifications
 * @param {Function} setNotifications - Function to update the userNotificationsAtom
 * @returns {Promise<void>} - A promise that resolves when the notifications are marked
 */
export const markNotifications = async (
  notificationIds: string[],
  status: 'read' | 'unread' | 'removed',
  setNotifications: (update: SetStateAction<Record<string, Notification>>) => void
): Promise<void> => {
  console.log(
    `[notificationStore/markNotifications]: Marking notifications as ${status}: ${notificationIds}`
  );
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const notificationRef = doc(db, 'Notifications', id);
      batch.update(notificationRef, { status, updatedAt: new Date() });
    });

    console.log('🔥 [notificationStore/markNotifications]');
    await batch.commit();

    // Update the userNotifications atom
    setNotifications((prev) => {
      const updated = { ...prev };
      notificationIds.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], status, updatedAt: new Date() };
        }
      });
      return updated;
    });
  } catch (error) {
    console.error(`[notificationStore/markNotifications]: error: ${error}`);
    throw error;
  }
};

// Remove the old markNotificationsAsRead and markNotificationsAsRemoved functions

/**
 * @description Delete multiple notifications from Firestore and update the userNotifications atom
 * @param {string[]} notificationIds - The IDs of the notifications to delete
 * @param {Function} setNotifications - Function to update the userNotificationsAtom
 * @returns {Promise<void>} - A promise that resolves when the notifications are deleted
 */
export const deleteNotifications = async (
  notificationIds: string[],
  setNotifications: (update: SetStateAction<Record<string, Notification>>) => void
): Promise<void> => {
  console.log(
    `[notificationStore/deleteNotifications]: Deleting notifications: ${notificationIds}`
  );
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const notificationRef = doc(db, 'Notifications', id);
      batch.delete(notificationRef);
    });

    // Delete the notifications from Firestore
    console.log('🔥 [notificationStore/deleteNotifications]');
    await batch.commit();

    // Update the userNotifications atom by removing the deleted notifications
    setNotifications((prev) => {
      const updated = { ...prev };
      notificationIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });
  } catch (error) {
    console.error(`[notificationStore/deleteNotifications]: error: ${error}`);
    throw error;
  }
};
