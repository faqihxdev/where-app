import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { User, ListingDB } from '../types';
import { TrashIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@chakra-ui/react';
import { showCustomToast } from './CustomToast';

const AdminMode: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'Users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as User);
      setUsers(userList);
      setLoading(false);
    } catch (err) {
      console.error('[AdminMode/fetchUsers]: Error fetching users:', err);
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const deleteUserData = async (user: User) => {
    setDeletingUser(user.uid);
    try {
      // Fetch and delete listings
      const listingsQuery = query(collection(db, 'Listings'), where('userId', '==', user.uid));
      const listingSnapshot = await getDocs(listingsQuery);
      const listings = listingSnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id }) as ListingDB
      );

      for (const listing of listings) {
        // Delete associated images
        const imagesQuery = query(collection(db, 'Images'), where('listingId', '==', listing.id));
        const imageSnapshot = await getDocs(imagesQuery);
        for (const imageDoc of imageSnapshot.docs) {
          await deleteDoc(doc(db, 'Images', imageDoc.id));
        }

        // Delete associated markers
        for (const markerId of listing.markerIds) {
          await deleteDoc(doc(db, 'Markers', markerId));
        }

        // Delete the listing itself
        await deleteDoc(doc(db, 'Listings', listing.id));
      }

      // Delete notifications
      const notificationsQuery = query(
        collection(db, 'Notifications'),
        where('userId', '==', user.uid)
      );
      const notificationSnapshot = await getDocs(notificationsQuery);
      for (const notificationDoc of notificationSnapshot.docs) {
        await deleteDoc(notificationDoc.ref);
      }

      // Delete matches
      const matchesQuery = query(
        collection(db, 'Matches'),
        where('userId1', '==', user.uid),
        where('userId2', '==', user.uid)
      );
      const matchSnapshot = await getDocs(matchesQuery);
      for (const matchDoc of matchSnapshot.docs) {
        await deleteDoc(matchDoc.ref);
      }

      // Delete user document
      await deleteDoc(doc(db, 'Users', user.uid));

      // Delete Firebase Auth user
      const firebaseUser = auth.currentUser;
      if (firebaseUser && firebaseUser.uid === user.uid) {
        await deleteUser(firebaseUser);
      }

      // Update local state
      setUsers(users.filter((u) => u.uid !== user.uid));

      showCustomToast({
        title: 'User Deleted',
        description: `User ${user.email} has been successfully deleted.`,
        color: 'success',
      });
    } catch (err) {
      console.error('[AdminMode/deleteUserData]: Error deleting user data:', err);
      showCustomToast({
        title: 'Deletion Failed',
        description: `Failed to delete user data for ${user.email}.`,
        color: 'danger',
      });
    } finally {
      setDeletingUser(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='container mx-auto mt-4'>
      <ul className='space-y-2'>
        {users.map((user) => (
          <li
            key={user.uid}
            className='flex items-center justify-between bg-gray-200 p-2 pl-4 rounded'>
            <span className='break-all'>{user.email}</span>
            <IconButton
              aria-label='Delete user'
              icon={<TrashIcon className='h-5 w-5' />}
              onClick={() => deleteUserData(user)}
              isLoading={deletingUser === user.uid}
              colorScheme='red'
              variant='solid'
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMode;
