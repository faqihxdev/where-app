import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, fetchAllListingsAtom } from '../stores/listingStore';
import { listingUsersAtom, fetchUserListingsAtom } from '../stores/userStore';
import { markersAtom, fetchMarker } from '../stores/markerStore';
import { getImage } from '../stores/imageStore';
import { Listing } from '../types';
import { Button } from '@chakra-ui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const ViewListingPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const [listings, setListings] = useAtom(listingsAtom);
  const fetchAllListings = useSetAtom(fetchAllListingsAtom);
  const listingUsers = useAtomValue(listingUsersAtom);
  const fetchUserListings = useSetAtom(fetchUserListingsAtom);
  const markers = useAtomValue(markersAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchListingData = useCallback(async () => {
    if (!listingId) return;

    setIsLoading(true);
    setError(null);
    try {
      if (!listings[listingId]) {
        await fetchAllListings();
      }

      const listing = listings[listingId];
      if (!listing) {
        setError('Listing not found');
        return;
      }

      // Fetch user data if not available
      if (!listingUsers[listing.userId]) {
        await fetchUserListings(listing.userId);
      }

      // Fetch markers if not available
      await Promise.all(listing.markers.map(async m => {
        if (!markers[m.id]) {
          await fetchMarker(m.id, markers);
        }
      }));

      // Fetch images if not available
      if (listing.images.main.id && !listing.images.main.data) {
        const imageDoc = await getImage(listing.images.main.id);
        if (imageDoc) {
          setListings(prev => ({
            ...prev,
            [listingId]: {
              ...prev[listingId],
              images: {
                ...prev[listingId].images,
                main: {
                  ...prev[listingId].images.main,
                  data: imageDoc.data
                }
              }
            }
          }));
        }
      }
    } catch (error) {
      console.error('[ViewListingPage]: Error fetching listing data:', error);
      setError('An error occurred while fetching the listing data');
    } finally {
      setIsLoading(false);
    }
  }, [listingId, listings, fetchAllListings, listingUsers, fetchUserListings, markers, setListings]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const handleRefresh = async () => {
    await fetchListingData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold mb-4">{error}</h1>
        <Button
          onClick={() => navigate('/')}
          fontWeight="medium"
          bg="primary.600"
          color="white"
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}
        >
          Go Back To Listings
        </Button>
      </div>
    );
  }

  const listing = listings[listingId as string] as Listing;

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold mb-4">Listing not found</h1>
        <Button
          onClick={() => navigate('/')}
          fontWeight="medium"
          bg="primary.600"
          color="white"
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}
        >
          Go Back To Listings
        </Button>
      </div>
    );
  }

  const truncateBase64 = (base64: string) => {
    return base64.substring(0, 50) + '...';
  };

  const PullDownContent = () => (
    <div className="flex items-center justify-center space-x-2 text-blue-600 mt-8">
      <ArrowPathIcon className="w-5 h-5 animate-spin" />
      <span>Pull down to refresh...</span>
    </div>
  );

  const RefreshContent = () => (
    <div className="flex items-center justify-center space-x-2 text-blue-600 mt-8">
      <ArrowPathIcon className="w-5 h-5 animate-spin" />
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
      refreshingContent={<RefreshContent />}
    >
      <div className="min-h-full bg-white p-4">
        <h1 className="text-2xl font-semibold mb-4">View Listing</h1>
        <pre className="whitespace-pre-wrap break-words bg-gray-100 p-4 rounded-md">
          {JSON.stringify(
            {
              ...listing,
              images: {
                ...listing.images,
                main: {
                  ...listing.images.main,
                  data: truncateBase64(listing.images.main.data || '')
                },
                alt1: listing.images.alt1
                  ? {
                      ...listing.images.alt1,
                      data: truncateBase64(listing.images.alt1.data || '')
                    }
                  : undefined,
                alt2: listing.images.alt2
                  ? {
                      ...listing.images.alt2,
                      data: truncateBase64(listing.images.alt2.data || '')
                    }
                  : undefined
              }
            },
            null,
            2
          )}
        </pre>
      </div>
    </PullToRefresh>
  );
};

export default ViewListingPage;