import React, { useEffect, useState, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  listingsAtom,
  fetchListingsByUserIdAtom,
  userListingsFetchedAtom,
} from '../stores/listingStore';
import { matchesAtom, fetchMatchesByUserAtom } from '../stores/matchStore';
import { userDataAtom } from '../stores/userStore';
import {
  userNotificationsAtom,
  fetchAllUserNotificationsAtom,
  markNotificationsAtom,
} from '../stores/notificationStore';
import { Listing, Notification } from '../types';
import ListingCard from '../components/ListingCard';
import MatchCard from '../components/MatchCard';
import NotificationRow from '../components/NotificationRow';
import AlertDialog from '../components/AlertDialog';
import { InboxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { showCustomToast } from '../components/CustomToast';
import { Button } from '@chakra-ui/react';

const InboxPage: React.FC = () => {
  const listings = useAtomValue(listingsAtom);
  const matches = useAtomValue(matchesAtom);
  const notifications = useAtomValue(userNotificationsAtom);
  const fetchListingsByUserId = useSetAtom(fetchListingsByUserIdAtom);
  const fetchMatches = useSetAtom(fetchMatchesByUserAtom);
  const userData = useAtomValue(userDataAtom);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userListingsFetched, setUserListingsFetched] = useAtom(userListingsFetchedAtom);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const fetchAllUserNotifications = useSetAtom(fetchAllUserNotificationsAtom);
  const markNotifications = useSetAtom(markNotificationsAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredNotifications = Object.values(notifications).filter(
    (notification) => notification.status !== 'removed'
  );

  const fetchListingsData = useCallback(async () => {
    if (!userData?.uid) {
      console.error('[InboxPage] User data not available');
      return;
    }

    setIsListingsLoading(true);
    try {
      if (!userListingsFetched) {
        await fetchListingsByUserId(userData.uid);
      }
    } catch (error) {
      console.error('[InboxPage] Error fetching listings:', error);
      showCustomToast({
        title: 'Error Fetching Listings',
        description: 'Please try again later.',
        color: 'danger',
      });
    } finally {
      setIsListingsLoading(false);
    }
  }, [userData, userListingsFetched, fetchListingsByUserId]);

  const fetchMatchesData = useCallback(async () => {
    if (!userData?.uid) {
      console.error('[InboxPage] User data not available');
      return;
    }

    setIsMatchesLoading(true);
    try {
      await fetchMatches(userData.uid);
    } catch (error) {
      console.error('[InboxPage] Error fetching matches:', error);
      showCustomToast({
        title: 'Error Fetching Matches',
        description: 'Please try again later.',
        color: 'danger',
      });
    } finally {
      setIsMatchesLoading(false);
    }
  }, [fetchMatches, userData]);

  const fetchNotificationsData = useCallback(async () => {
    if (!userData?.uid) {
      console.error('[InboxPage] User data not available');
      return;
    }

    setIsNotificationsLoading(true);
    try {
      await fetchAllUserNotifications(userData.uid);
    } catch (error) {
      console.error('[InboxPage] Error fetching notifications:', error);
      showCustomToast({
        title: 'Error Fetching Notifications',
        description: 'Please try again later.',
        color: 'danger',
      });
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [userData, fetchAllUserNotifications]);

  useEffect(() => {
    fetchListingsData();
  }, [fetchListingsData]);

  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]);

  useEffect(() => {
    fetchNotificationsData();
  }, [fetchNotificationsData]);

  useEffect(() => {
    if (userData?.uid) {
      setUserListings(Object.values(listings).filter((listing) => listing.userId === userData.uid));
    }
  }, [listings, userData]);

  const handleRefresh = useCallback(async () => {
    console.log('[InboxPage] Refreshing data...');
    setIsRefreshing(true);
    setUserListingsFetched(false);
    await Promise.all([fetchListingsData(), fetchMatchesData(), fetchNotificationsData()]);
    setIsRefreshing(false);
  }, [fetchListingsData, fetchMatchesData, fetchNotificationsData, setUserListingsFetched]);

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = Object.values(notifications).filter((n) => n.status === 'unread');
    const unreadIds = unreadNotifications.map((n) => n.id);
    if (unreadIds.length > 0) {
      try {
        await markNotifications(unreadIds, 'read');
        showCustomToast({
          title: 'Notifications Marked as Read',
          description: 'All notifications have been marked as read.',
          color: 'success',
        });
      } catch (error) {
        console.error('[InboxPage] Error marking all notifications as read:', error);
        showCustomToast({
          title: 'Error',
          description: 'Failed to mark notifications as read. Please try again.',
          color: 'danger',
        });
      }
    }
  };

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotifications([notificationId], 'read');
        showCustomToast({
          title: 'Notification Marked as Read',
          description: 'The notification has been marked as read.',
          color: 'success',
        });
      } catch (error) {
        console.error('[InboxPage] Error marking notification as read:', error);
        showCustomToast({
          title: 'Error',
          description: 'Failed to mark notification as read. Please try again.',
          color: 'danger',
        });
      }
    },
    [markNotifications]
  );

  const InboxContent = () => (
    <div className='h-full overflow-y-auto bg-white'>
      <div className='sticky top-0 z-10 bg-white p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold'>Inbox</h1>
          <button
            onClick={handleRefresh}
            className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
            disabled={isRefreshing}
            aria-label='Refresh inbox'>
            <ArrowPathIcon
              className={`h-5 w-5 text-gray-600 stroke-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className='p-4 pt-0'>
        <div className='max-w-4xl mx-auto space-y-8'>
          <section>
            <h2 className='text-lg font-semibold mb-4'>Your Listings</h2>
            {isListingsLoading ? (
              <div className='flex justify-center items-center py-8'>
                <LoadingSpinner />
              </div>
            ) : userListings.length > 0 ? (
              <div className='grid grid-cols-1 gap-4'>
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} showActions={true} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8'>
                <InboxIcon className='w-12 h-12 text-blue-600 mb-2 stroke-1.5' />
                <p className='text-gray-600 text-md font-medium'>You have no listings</p>
              </div>
            )}
          </section>

          <section>
            <h2 className='text-lg font-semibold mb-4'>Matches</h2>
            {isMatchesLoading ? (
              <div className='flex justify-center items-center py-8'>
                <LoadingSpinner />
              </div>
            ) : Object.values(matches).length > 0 ? (
              <div className='space-y-4'>
                {Object.values(matches).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8'>
                <InboxIcon className='w-12 h-12 text-blue-600 mb-2 stroke-1.5' />
                <p className='text-gray-600 text-md font-medium'>You have no matches</p>
              </div>
            )}
          </section>

          <section>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Notifications</h2>
              <Button
                onClick={handleMarkAllAsRead}
                size='sm'
                fontWeight='medium'
                bg='primary.600'
                color='white'
                _hover={{ bg: 'primary.700' }}
                _active={{ bg: 'primary.800' }}>
                Mark All as Read
              </Button>
            </div>
            {isNotificationsLoading ? (
              <div className='flex justify-center items-center py-8'>
                <LoadingSpinner />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className='space-y-2'>
                {filteredNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpenDrawer={setSelectedNotification}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8'>
                <InboxIcon className='w-12 h-12 text-blue-600 mb-2 stroke-1.5' />
                <p className='text-gray-600 text-md font-medium'>You have no notifications</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title || ''}
        body={
          <div data-testid='notification-dialog'>
            <p className='text-sm text-gray-500'>{selectedNotification?.message}</p>
          </div>
        }
        footer={
          <div className='flex justify-end space-x-2 w-full'>
            <Button
              onClick={() => {
                if (selectedNotification) {
                  handleMarkAsRead(selectedNotification.id);
                }
                setSelectedNotification(null);
              }}
              size='md'
              fontWeight='medium'
              bg='primary.600'
              color='white'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}
              data-testid='notification-mark-read'>
              Mark as Read
            </Button>
            <Button onClick={() => setSelectedNotification(null)} data-testid='notification-close'>
              Close
            </Button>
          </div>
        }
      />
    </div>
  );

  return (
    <div className='h-full overflow-y-auto bg-white'>
      <InboxContent />
    </div>
  );
};

export default InboxPage;
