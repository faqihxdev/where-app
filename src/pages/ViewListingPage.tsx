import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, fetchListingByIdAtom } from '../stores/listingStore';
import { listingUsersAtom, fetchListingUserAtom, getAvatarUrl } from '../stores/userStore';
import { markersAtom, fetchMarkerByIdAtom } from '../stores/markerStore';
import { Listing, ListingStatus } from '../types';
import { Button, Avatar } from '@chakra-ui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowPathIcon, ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import MapSelector from '../components/map/MapSelector';
import { format } from 'date-fns';
import { getAverageMarkerLocation } from '../utils/utils';

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
    } else if (from === 'map') {
      navigate('/map');
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
  const listingUser = listingUsers[listing.userId];

  const getStatusBadgeColor = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.resolved:
        return 'bg-green-200/95 text-green-800';
      case ListingStatus.expired:
        return 'bg-red-200/95 text-red-800';
      default:
        return 'bg-blue-200/95 text-blue-800';
    }
  };

  const listingImages = [listing.images.main, listing.images.alt1, listing.images.alt2].filter(
    (img): img is NonNullable<typeof img> => img !== undefined
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
        {/* Page Title and Status */}
        <div className='mb-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <button
                onClick={handleBack}
                className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'>
                <ArrowLeftIcon className='h-6 w-6 text-gray-600 stroke-2' />
              </button>
              <h1 className='text-xl font-semibold ml-4'>View Listing</h1>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                listing.status
              )}`}>
              {listing.status}
            </div>
          </div>
        </div>

        {/* Listing Information Section */}
        <div className='space-y-4'>
          {/* Image Carousel */}
          <div className='w-full overflow-hidden border border-gray-200 rounded-lg'>
            {listingImages.length > 0 && (
              <Carousel showThumbs={false} showStatus={false} infiniteLoop={true}>
                {listingImages.map((img, index) => (
                  <div key={index}>
                    <img
                      className='aspect-[4/3] object-cover'
                      src={img.data}
                      alt={`${listing.title} - Image ${index + 1}`}
                    />
                  </div>
                ))}
              </Carousel>
            )}
          </div>

          <h2 className='text-xl font-semibold'>{listing.title}</h2>

          {/* User Information */}
          <div className='flex items-center p-2 bg-gray-100 rounded-lg'>
            <Avatar
              size='sm'
              name={listingUser?.preferences?.name || listingUser?.email}
              src={getAvatarUrl(listingUser?.preferences?.name || listingUser?.email)}
              mr={2}
            />
            <span className='text-sm font-medium'>
              {listingUser?.preferences?.name || listingUser?.email}
            </span>
          </div>

          {/* Additional Details */}
          <div className='grid grid-cols-2 gap-4 text-sm bg-gray-100 rounded-lg p-4'>
            <div>
              <h3 className='font-medium text-gray-500'>Category</h3>
              <p>{listing.category}</p>
            </div>
            <div>
              <h3 className='font-medium text-gray-500'>Type</h3>
              <p className='capitalize'>{listing.type}</p>
            </div>
            <div>
              <h3 className='font-medium text-gray-500'>Created At</h3>
              <p className='flex items-center'>
                <CalendarIcon className='w-4 h-4 mr-1' />
                <span>{format(listing.createdAt, 'MMM d, yyyy')}</span>
              </p>
            </div>
            <div>
              <h3 className='font-medium text-gray-500'>Expires At</h3>
              <p className='flex items-center'>
                <CalendarIcon className='w-4 h-4 mr-1' />
                <span>{format(listing.expiresAt, 'MMM d, yyyy')}</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div className='text-sm bg-gray-100 rounded-lg p-4'>
            <h3 className='font-medium text-gray-500'>Description</h3>
            <p className='text-gray-700'>{listing.description}</p>
          </div>

          {/* Map */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>Location</h3>
            <MapSelector
              mode='view'
              initialMarkers={listing.markers}
              onMarkersChange={() => {}}
              showRemoveButton={false}
              defaultLocation={getAverageMarkerLocation(listing)}
            />
          </div>
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
