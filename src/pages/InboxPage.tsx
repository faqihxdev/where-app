import React, { useEffect, useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  listingsAtom,
  fetchListingsByUserIdAtom,
  userListingsFetchedAtom,
} from '../stores/listingStore';
import { matchesAtom, fetchMatchesByUserAtom } from '../stores/matchStore';
import { userDataAtom } from '../stores/userStore';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import MatchCard from '../components/MatchCard';
import { InboxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { showCustomToast } from '../components/CustomToast';

const InboxPage: React.FC = () => {
  const [listings, setListings] = useAtom(listingsAtom);
  const [matches, setMatches] = useAtom(matchesAtom);
  const [, fetchListingsByUserId] = useAtom(fetchListingsByUserIdAtom);
  const [, fetchMatches] = useAtom(fetchMatchesByUserAtom);
  const userData = useAtomValue(userDataAtom);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userListingsFetched, setUserListingsFetched] = useAtom(userListingsFetchedAtom);

  const fetchListingsData = useCallback(async () => {
    if (!userData?.uid) {
      console.error('[InboxPage] User data not available');
      return;
    }

    setIsListingsLoading(true);
    try {
      if (!userListingsFetched) {
        const fetchedListings = await fetchListingsByUserId(userData.uid);
        setListings((prev) => {
          const newListings = { ...prev };
          fetchedListings.forEach((listing) => {
            newListings[listing.id] = listing;
          });
          return newListings;
        });
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
  }, [fetchListingsByUserId, userData, userListingsFetched, setListings]);

  const fetchMatchesData = useCallback(async () => {
    if (!userData?.uid) {
      console.error('[InboxPage] User data not available');
      return;
    }

    setIsMatchesLoading(true);
    try {
      const fetchedMatches = await fetchMatches(userData.uid);
      setMatches(fetchedMatches);
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
  }, [fetchMatches, userData, setMatches]);

  useEffect(() => {
    fetchListingsData();
  }, [fetchListingsData]);

  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]);

  useEffect(() => {
    if (userData?.uid) {
      setUserListings(Object.values(listings).filter((listing) => listing.userId === userData.uid));
    }
  }, [listings, userData]);

  const handleRefresh = useCallback(async () => {
    console.log('[InboxPage] Refreshing data...');
    setUserListingsFetched(false);
    setIsListingsLoading(true);
    setIsMatchesLoading(true);
    await Promise.all([fetchListingsData(), fetchMatchesData()]);
  }, [fetchListingsData, fetchMatchesData, setUserListingsFetched]);

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

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={80}
      maxPullDownDistance={90}
      resistance={3}
      pullingContent={<PullDownContent />}
      refreshingContent={<RefreshContent />}>
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
            <h2 className='text-xl font-semibold mb-4'>Potential Matches</h2>
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
        </div>
      </div>
    </PullToRefresh>
  );
};

export default InboxPage;
