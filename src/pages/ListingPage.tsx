import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { listingsAtom, fetchListingsAtom, listingsFetchedAtom } from '../stores/listingStore';
import { Listing, ListingStatus, SearchParams } from '../types';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { showCustomToast } from '../components/CustomToast';
import ListingCard from '../components/ListingCard';
import SearchDrawer from '../components/search/SearchDrawer';
import ActiveFilters from '../components/search/ActiveFilters';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefresh from 'react-simple-pull-to-refresh';

const defaultSearchParams: SearchParams = {
  keyword: '',
  type: 'all',
  category: '',
  status: '' as ListingStatus | '',
  sortBy: 'createdAt',
  sortOrder: 'descending',
  location: null,
};

export default function ListingPage() {
  const [listings, setListings] = useAtom(listingsAtom);
  const [listingsFetched, setListingsFetched] = useAtom(listingsFetchedAtom);
  const [, fetchListings] = useAtom(fetchListingsAtom);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = useCallback(async () => {
    console.log('[ListingPage] Refreshing listings...');
    setIsLoading(true);
    setListingsFetched(false);
    try {
      await fetchListings();
    } catch (error) {
      console.error('[ListingPage] Error refreshing listings:', error);
      showCustomToast({
        title: "Error Refreshing Listings",
        description: "Please try again later.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, [setListingsFetched, fetchListings]);

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

  // On mount, fetch listings
  useEffect(() => {

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchListings();
      } catch (error) {
        console.error('[ListingPage] Error fetching listings:', error);
        showCustomToast({
          title: "Error Fetching Listings",
          description: "Please try again later.",
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // If listings are not fetched, fetch them
    if (!listingsFetched) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [listings, listingsFetched, setListings, setListingsFetched, fetchListings]);

  // On mount, fetch listings
  useEffect(() => {

    // Filter listings based on active tab and search params
    const filtered = Object.values(listings).filter(listing => 
      (activeTab === 'all' || listing.type === activeTab) &&
      (searchParams.keyword === '' || listing.title.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
       listing.description.toLowerCase().includes(searchParams.keyword.toLowerCase())) &&
      (searchParams.category === '' || listing.category === searchParams.category) &&
      (searchParams.status === '' || listing.status === searchParams.status)
    );

    // Sort the filtered listings
    filtered.sort((a, b) => {
      const aValue = a[searchParams.sortBy as keyof Listing];
      const bValue = b[searchParams.sortBy as keyof Listing];
      if (aValue && bValue) {
        if (aValue < bValue) return searchParams.sortOrder === 'ascending' ? -1 : 1;
        if (aValue > bValue) return searchParams.sortOrder === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    // Set the filtered listings
    setFilteredListings(filtered);
  }, [listings, activeTab, searchParams]);

  const handleApplySearch = (newSearchParams: SearchParams) => {
    setSearchParams(newSearchParams);
    setActiveTab(newSearchParams.type as 'all' | 'lost' | 'found');
    setIsSearchDrawerOpen(false);
  };

  const handleTabChange = (tab: 'all' | 'lost' | 'found') => {
    setActiveTab(tab);
    setSearchParams(prev => ({ ...prev, type: tab }));
  };

  const handleRemoveFilter = (key: keyof SearchParams) => {
    setSearchParams(prev => ({ ...prev, [key]: defaultSearchParams[key] }));
  };

  const handleResetSearch = () => {
    setSearchParams(defaultSearchParams);
    setActiveTab('all');
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={70}
      maxPullDownDistance={95}
      pullingContent={<PullDownContent />}
      refreshingContent={<RefreshContent />}
    >
      <div className="min-h-full bg-white p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between mb-4 space-x-2">
            <div className="flex grow rounded-md bg-gray-100 p-1.5" role="group">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all'
                    ? "text-gray-950 bg-white"
                    : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
                }`}
                onClick={() => handleTabChange('all')}
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
                onClick={() => handleTabChange('lost')}
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
                onClick={() => handleTabChange('found')}
              >
                Found
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                aria-label="Advanced search"
                className="h-full w-fit p-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setIsSearchDrawerOpen(true)}
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-white stroke-[3]" />
              </button>
            </div>
          </div>

          <ActiveFilters 
            searchParams={searchParams}
            onRemoveFilter={handleRemoveFilter}
          />

          {isLoading ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ListingGrid listings={filteredListings} />
          )}
        </div>

        <SearchDrawer
          isOpen={isSearchDrawerOpen}
          onClose={() => setIsSearchDrawerOpen(false)}
          onApplySearch={handleApplySearch}
          searchParams={searchParams}
          onResetSearch={handleResetSearch}
        />
      </div>
    </PullToRefresh>
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