import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, fetchListingByIdAtom } from '../stores/listingStore';
import { listingUsersAtom, fetchListingUserAtom } from '../stores/userStore';
import { markersAtom, fetchMarkerByIdAtom } from '../stores/markerStore';
import { Listing } from '../types';
import { Button } from '@chakra-ui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ViewListingPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from') || 'home';
  const listings = useAtomValue(listingsAtom);
  const fetchListingById = useSetAtom(fetchListingByIdAtom);
  const listingUsers = useAtomValue(listingUsersAtom);
  const fetchListingUser = useSetAtom(fetchListingUserAtom);
  const markers = useAtomValue(markersAtom);
  const fetchMarkerById = useSetAtom(fetchMarkerByIdAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch listing data on load or on refresh
  const fetchListingData = useCallback(
    async (onRefresh: boolean = false) => {
      if (!listingId) return;

      setIsLoading(true);
      setError(null);

      try {
        if (onRefresh || !listings[listingId]) {
          await fetchListingById(listingId);
        }

        const listing = listings[listingId];
        if (!listing) {
          setError('Listing not found');
          return;
        }

        // Fetch user data if not available
        if (!listingUsers[listing.userId]) {
          await fetchListingUser(listing.userId);
        }

        // Fetch markers if not available
        await Promise.all(
          listing.markers.map(async (m) => {
            if (!markers[m.id]) {
              await fetchMarkerById(m.id);
            }
          })
        );

      } catch (error) {
        console.error('[ViewListingPage]: Error fetching listing data:', error);
        setError('An error occurred while fetching the listing data');
      } finally {
        setIsLoading(false);
      }
    },
    [
      listingId,
      listings,
      listingUsers,
      markers,
      fetchListingById,
      fetchListingUser,
      fetchMarkerById,
    ]
  );

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const handleRefresh = async () => {
    await fetchListingData(true);
  };

  const handleBack = () => {
    if (from === 'inbox') {
      navigate('/inbox');
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-2xl font-semibold mb-4'>{error}</h1>
        <Button
          onClick={() => navigate('/')}
          fontWeight='medium'
          bg='primary.600'
          color='white'
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}>
          Go Back To Listings
        </Button>
      </div>
    );
  }

  const listing = listings[listingId as string] as Listing;

  if (!listing) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-2xl font-semibold mb-4'>Listing not found</h1>
        <Button
          onClick={() => navigate('/')}
          fontWeight='medium'
          bg='primary.600'
          color='white'
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}>
          Go Back To Listings
        </Button>
      </div>
    );
  }

  const listingUser = listingUsers[listing.userId];

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={80}
      maxPullDownDistance={90}
      resistance={3}
      pullingContent={<PullDownContent />}
      refreshingContent={<RefreshContent />}>
      <div className='min-h-full bg-white p-6'>
        <div className='flex items-center mb-6'>
          <button
            onClick={handleBack}
            className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'>
            <ArrowLeftIcon className='h-6 w-6 text-gray-600 stroke-2' />
          </button>
          <h1 className='text-3xl font-bold ml-4'>View Listing</h1>
        </div>

        {/* Listing Information Section */}
        <div className='bg-gray-100 p-6 rounded-lg shadow-md'>
          {/* Listing Image */}
          {listing.images? (
            <img
              src={listing.images.main.data}
              alt={listing.title}
              className='w-full h-64 object-cover rounded-lg mb-4'
            />
          ) : (
            <img
              src='/path/to/default/image.jpg'  // Replace with a valid path to a default image
              alt='Default Listing'
              className='w-full h-64 object-cover rounded-lg mb-4'
            />
          )}

          <h2 className='text-2xl font-semibold mb-4'>{listing.title}</h2>

          {/* Description */}
          {listing.description && (
            <div className='mb-4'>
              <h3 className='text-lg font-medium'>Description:</h3>
              <p className='text-gray-700'>{listing.description}</p>
            </div>
          )}

          {/* Status */}
          {listing.status && (
            <div className='mb-4'>
              <h3 className='text-lg font-medium'>Status:</h3>
              <p className='text-gray-700'>{listing.status}</p>
            </div>
          )}

          {/* Expiry Date */}
          {listing.expiresAt && (
            <div className='mb-4'>
              <h3 className='text-lg font-medium'>Expiry Date:</h3>
              <p className='text-gray-700'>{new Date(listing.expiresAt).toLocaleDateString()}</p>
            </div>
          )}

          {/* User Information */}
          {listingUser.preferences && (
            <div className='mb-4'>
              <h3 className='text-lg font-medium'>Posted By:</h3>
              <p className='text-gray-700'>{listingUser.preferences.name}</p>
            </div>
          )} 

          {/* Marker Names */}
          {listing.markers.length > 0 && (
            <div className='mb-4'>
              <h3 className='text-lg font-medium'>Markers:</h3>
              <ul className='list-disc pl-5 text-gray-700'>
                {listing.markers.map((marker) => (
                  <li key={marker.id}>{marker.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};

export default ViewListingPage;

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
