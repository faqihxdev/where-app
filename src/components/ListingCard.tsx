import { Listing } from '../types';
import { ExclamationCircleIcon, CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@chakra-ui/react';
import { format } from 'date-fns'; // Add this import

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex">
        <div className="w-1/3 aspect-square">
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
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
            <Avatar size="xs" name={listing.userId} />
            <span className="text-xs font-medium">{listing.userId}</span>
          </div>
          <h4 className="font-semibold text-sm mb-1 mt-2 truncate">{listing.title}</h4>
          <p className="text-xs text-gray-600 line-clamp-2">{listing.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-100 text-xs">
        <div className="text-gray-500">
          <p>{format(listing.createdAt, 'yyyy-MM-dd')}</p>
          <p>{listing.locations[0].name}</p>
        </div>
        <button className="bg-gray-200 text-xs px-2 py-1 rounded flex items-center font-semibold">
          View More
          <ChevronRightIcon className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
}