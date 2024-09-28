import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { listingsAtom, fetchListingsAtom } from '../../stores/listingStore';
import { Listing } from '../../types';
import { Input } from '@chakra-ui/react';
import ListingCard from '../../components/ListingCard';

export default function ListingPage() {
  const [listings] = useAtom(listingsAtom);
  const [, fetchListings] = useAtom(fetchListingsAtom);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = Object.values(listings).filter(listing => 
    (activeTab === 'all' || listing.type === activeTab) &&
    (listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     listing.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-full bg-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="relative">
          <Input
            placeholder="Search listings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl="40px"
          />
        </div>
        
        <div className="mb-6">
          <div className="flex rounded-md bg-gray-100/90 p-1.5" role="group">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? "text-gray-950 bg-white"
                  : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === 'lost'
                  ? "text-gray-950 bg-white"
                  : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
              }`}
              onClick={() => setActiveTab('lost')}
            >
              Lost
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === 'found'
                  ? "text-gray-950 bg-white"
                  : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
              }`}
              onClick={() => setActiveTab('found')}
            >
              Found
            </button>
          </div>
        </div>

        <ListingGrid listings={filteredListings} />
      </div>
    </div>
  );
}

function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
