import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Listing, User } from '../types';
import { ExclamationCircleIcon, MagnifyingGlassCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@chakra-ui/react';
import { format, isValid } from 'date-fns';
import { getImage } from '../utils/imageUtils';
import { userDataAtom, fetchUserDataAtom } from '../stores/userStore';
import { updateListingImageAtom } from '../stores/listingStore';
import LoadingSpinner from './LoadingSpinner';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(!listing.images.main.src);
  const [userData] = useAtom(userDataAtom);
  const [, fetchUserData] = useAtom(fetchUserDataAtom);
  const [, updateListingImage] = useAtom(updateListingImageAtom);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (listing.images.main.id && !listing.images.main.src) {
        setIsImageLoading(true);
        try {
          const imageDoc = await getImage(listing.images.main.id);
          if (imageDoc) {
            updateListingImage({ 
              listingId: listing.id, 
              imageKey: 'main', 
              imageSrc: imageDoc.src 
            });
          }
        } catch (error) {
          console.error('[ListingCard/fetchMainImage]: ', error);
        } finally {
          setIsImageLoading(false);
        }
      }
    };
    fetchMainImage();

    // Fetch user data if not already available
    if (!userData || userData.uid !== listing.userId) {
      fetchUserData(listing.userId);
    }
  }, [listing.id, listing.images.main.id, listing.userId, userData, fetchUserData, updateListingImage]);

  // Function to safely format the date
  const formatDate = (date: Date | number) => {
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
    return 'Invalid Date';
  };

  // Function to get the display name
  const getDisplayName = (user: User | null) => {
    if (user) {
      return user.preferences?.name || user.email;
    }
    return 'Unknown User';
  };

  return (
    <div className="bg-white outline outline-1 outline-gray-100 rounded-lg overflow-hidden">
      <div className="flex">
        <div className="w-1/3 aspect-square relative">
          {isImageLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="scale-50"><LoadingSpinner /></div>
            </div>
          ) : listing.images.main.src ? (
            <img src={listing.images.main.src} alt={listing.title} className="w-full h-full object-cover" />
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
            <Avatar size="xs" name={getDisplayName(userData)} />
            <span className="text-xs font-medium">{getDisplayName(userData)}</span>
          </div>
          <h4 className="font-semibold text-sm mb-1 mt-2 truncate">{listing.title}</h4>
          <p className="text-xs text-gray-600 line-clamp-2">{listing.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-100 text-xs">
        <div className="text-gray-700 font-medium">
          <p>{formatDate(listing.createdAt)}</p>
          <p>{listing.locations[0].name}</p>
        </div>
        <button className="bg-blue-600 text-white text-xs font-medium px-2 pl-3 py-2 rounded flex items-center">
          View
          <ChevronRightIcon className="w-3 h-3 ml-1 stroke-2" />
        </button>
      </div>
    </div>
  );
}