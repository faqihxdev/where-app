import { useState, useEffect } from 'react';
import { Listing } from '../types';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, updateListingImageAtom } from '../stores/listingStore';
import { fetchUserListingsAtom, listingUsersAtom } from '../stores/userStore';
import { markersAtom, fetchMarker } from '../stores/markerStore';
import { getImage } from '../stores/imageStore';
import { ExclamationCircleIcon, MagnifyingGlassCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@chakra-ui/react';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@chakra-ui/react';
import { getAvatarUrl } from '../utils/userUtils';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const setListings = useSetAtom(listingsAtom);
  const fetchUserListings = useSetAtom(fetchUserListingsAtom);
  const updateListingImage = useSetAtom(updateListingImageAtom);
  const [isImageLoading, setIsImageLoading] = useState(!listing.images.main.data);
  const markers = useAtomValue(markersAtom);
  const listingUsers = useAtomValue(listingUsersAtom);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (listing.images.main.id && !listing.images.main.data) {
        setIsImageLoading(true);
        try {
          const imageDoc = await getImage(listing.images.main.id);
          if (imageDoc) {

            // Update the local listings state
            setListings(prev => ({
              ...prev,
              [listing.id]: {
                ...prev[listing.id],
                images: {
                  ...prev[listing.id].images,
                  main: {
                    ...prev[listing.id].images.main,
                    data: imageDoc.data
                  }
                }
              }
            }));
          }
        } catch (error) {
          console.error('[ListingCard/fetchMainImage]: ', error);
        } finally {
          setIsImageLoading(false);
        }
      }
    };
    
    fetchMainImage();

    // Fetch user data for the listing
    const fetchUser = async () => {
      try {
        await fetchUserListings(listing.userId);
      } catch (error) {
        console.error('[ListingCard/fetchUser]: ', error);
      }
    };
    
    fetchUser();

    // Fetch markers for the listing
    const fetchMarkersListing = async () => {
      try {
        await Promise.all(listing.markers.map(m => fetchMarker(m.id, markers)));
      } catch (error) {
        console.error('[ListingCard/fetchMarkers]: ', error);
      }
    };

    fetchMarkersListing();

  }, [listing, markers, fetchUserListings, updateListingImage, setListings]);

  // Function to safely format the date
  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd hh:mm a');
  };

  // Updated getDisplayName function
  const getDisplayName = (userId: string) => {
    const user = listingUsers[userId];
    if (user) {
      return user.preferences?.name || user.email;
    }
    return '';
  };

  // Helper function to safely get marker name
  const getMarkerName = (markerId: string) => {
    return markers[markerId]?.name || 'Loading location...';
  };

  return (
    <div className="bg-white outline outline-1 outline-gray-100 rounded-lg overflow-hidden">
      <div className="flex">
        <div className="w-1/3 aspect-square relative">
          {isImageLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="scale-50"><LoadingSpinner /></div>
            </div>
          ) : listing.images.main.data ? (
            <img src={listing.images.main.data} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="w-2/3 px-3 pt-2 pb-3 relative">
          <div
            className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              listing.type === 'found' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {listing.type === 'lost' ? (
              <ExclamationCircleIcon className="w-3 h-3 stroke-2" />
            ) : (
              <MagnifyingGlassCircleIcon className="w-3 h-3 stroke-2" />
            )}
            {listing.type === 'lost' ? 'Lost' : 'Found'}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Avatar size="xs" name={getDisplayName(listing.userId)} src={getAvatarUrl(listingUsers[listing.userId])} />
            <span className="text-xs font-medium">{getDisplayName(listing.userId)}</span>
          </div>
          <h4 className="font-semibold text-sm mb-1 mt-2 truncate">{listing.title}</h4>
          <p className="text-xs text-gray-600 line-clamp-2">{listing.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-100 text-xs">
        <div className="text-gray-700 font-medium">
          <p>
            {listing.markers.length > 0
              ? getMarkerName(listing.markers[0].id)
              : 'No location'}
          </p>
          <p>{formatDate(listing.createdAt)}</p>
        </div>
        <Button
          size='sm'
          fontWeight="medium"
          bg='primary.600'
          color='white'
          rightIcon={
            <ChevronRightIcon className="w-3 h-3 ml-1 stroke-[3]" />
          }
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}
        >
          View
        </Button>
      </div>
    </div>
  );
}