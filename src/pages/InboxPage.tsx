import React, { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { listingsAtom, fetchListingsByUserIdAtom } from '../stores/listingStore';
import { matchesAtom, fetchMatchesByUserAtom } from '../stores/matchStore';
import { userDataAtom } from '../stores/userStore';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import MatchCard from '../components/MatchCard';
import { InboxIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const InboxPage: React.FC = () => {
  const [listings] = useAtom(listingsAtom);
  const [matches] = useAtom(matchesAtom);
  const [, fetchListingsByUserId] = useAtom(fetchListingsByUserIdAtom);
  const [, fetchMatches] = useAtom(fetchMatchesByUserAtom);
  const userData = useAtomValue(userDataAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [userListings, setUserListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (userData?.uid) {
          await fetchListingsByUserId(userData.uid);
          await fetchMatches(userData.uid);
        } else {
          console.error('[InboxPage] User data not available');
        }
      } catch (error) {
        console.error('[InboxPage] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchListingsByUserId, fetchMatches, userData]);

  useEffect(() => {
    if (userData?.uid) {
      setUserListings(Object.values(listings).filter((listing) => listing.userId === userData.uid));
    }
  }, [listings, userData]);

  if (isLoading) {
    return (
      <div className='min-h-full bg-white p-4 flex justify-center items-center'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='min-h-full bg-white p-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section>
          <h2 className='text-xl font-semibold mb-4'>Your Listings</h2>
          {userListings.length > 0 ? (
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
          {Object.values(matches).length > 0 ? (
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
  );
};

export default InboxPage;
