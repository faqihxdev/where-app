import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Listing, User } from '../types';
import { ExclamationCircleIcon, CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@chakra-ui/react';
import { format, isValid } from 'date-fns';
import { getImage } from '../utils/imageUtils';
import { userDataAtom, fetchUserDataAtom } from '../stores/userStore';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [mainImageSrc, setMainImageSrc] = useState<string | null>(null);
  const [userData] = useAtom(userDataAtom);
  const [, fetchUserData] = useAtom(fetchUserDataAtom);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (listing.images.main.id) {
        const imageDoc = await getImage(listing.images.main.id);
        if (imageDoc) {
          setMainImageSrc(imageDoc.src);
        }
      }
    };
    fetchMainImage();

    // Fetch user data if not already available
    if (!userData || userData.uid !== listing.userId) {
      fetchUserData(listing.userId);
    }
  }, [listing.images.main.id, listing.userId, userData, fetchUserData]);

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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex">
        <div className="w-1/3 aspect-square">
          {mainImageSrc && <img src={mainImageSrc} alt={listing.title} className="w-full h-full object-cover" />}
        </div>
        <div className="w-2/3 px-3 pt-2 pb-3 relative">
          <div
            className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              listing.type === 'found' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {listing.type === 'lost' ? (
              <ExclamationCircleIcon className="w-3 h-3 stroke-2" />
            ) : (
              <CheckCircleIcon className="w-3 h-3 stroke-2" />
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
      <div className="flex justify-between items-center p-2 bg-blue-50 text-xs">
        <div className="text-gray-700">
          <p>{formatDate(listing.createdAt)}</p>
          <p>{listing.locations[0].name}</p>
        </div>
        <button className="bg-blue-200 text-xs px-2 py-1 rounded flex items-center font-semibold">
          View More
          <ChevronRightIcon className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
}