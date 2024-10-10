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
import NotificationRow from '../components/notifications/NotificationRow';
import NotificationDrawer from '../components/notifications/NotificationDrawer';
import { InboxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';
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
    setUserListingsFetched(false);
    await Promise.all([fetchListingsData(), fetchMatchesData(), fetchNotificationsData()]);
    return;
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

  const PullDownContent = () => (
    <div className='flex items-center justify-center space-x-2 text-blue-600 mt-8'>
      <ArrowPathIcon className='w-5 h-5 animate-spin' />
      <span>Pull down to refresh...</span>
    </div>
  );

  const RefreshContent = () => (
    <div className='flex items-center justify-center space-x-2 text-blue-600 mt-8'>
      <ArrowPathIcon className='w-5 h-5 animate-spin' />
      <span>Refreshing...</span>
    </div>
  );

  const InboxContent = () => (
    <div className='min-h-full bg-white p-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section>
          <h2 className='text-xl font-semibold mb-4'>Your Listings</h2>
          {isListingsLoading ? (
            <div className='flex justify-center items-center py-8'>
              <LoadingSpinner />
            </div>
          ) : userListings.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
          <h2 className='text-xl font-semibold mb-4'>Matches</h2>
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
            <h2 className='text-xl font-semibold'>Notifications</h2>
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
      <NotificationDrawer
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={80}
      maxPullDownDistance={90}
      resistance={3}
      pullingContent={<PullDownContent />}
      refreshingContent={<RefreshContent />}>
      <InboxContent />
    </PullToRefresh>
  );
};

export default InboxPage;
