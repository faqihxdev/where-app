import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, updateListingAtom, fetchListingByIdAtom } from '../stores/listingStore';
import { showCustomToast } from '../components/CustomToast';
import { Listing, Marker, ImageType } from '../types';
import ListingForm from '../components/ListingForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fetchMarkerByIdAtom, markersAtom } from '../stores/markerStore';

const EditListingPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listings = useAtomValue(listingsAtom);
  const updateListing = useSetAtom(updateListingAtom);
  const fetchListingById = useSetAtom(fetchListingByIdAtom);
  const fetchMarkerById = useSetAtom(fetchMarkerByIdAtom);
  const markers = useAtomValue(markersAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);

  const fetchListingData = useCallback(async () => {
    if (!listingId) return; // If the listingId is not available, return
    setIsLoading(true);

    try {
      if (!listings[listingId]) {
        await fetchListingById(listingId);
      }

      const fetchedListing = listings[listingId];

      if (fetchedListing) {
        // Fetch markers for the listing
        await Promise.all(
          fetchedListing.markers.map(async (m) => {
            if (!markers[m.id]) {
              const fetchedMarker = await fetchMarkerById(m.id);
              return fetchedMarker || m;
            } else {
              return m;
            }
          })
        );

        setListing(fetchedListing);
      } else {
        showCustomToast({
          title: 'Error',
          description: 'Listing not found.',
          color: 'danger',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('[EditListingPage]: Error fetching listing data:', error);
      showCustomToast({
        title: 'Error',
        description: 'An error occurred while fetching the listing data.',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [listingId, listings, markers, fetchListingById, fetchMarkerById, navigate]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const handleSubmit = async (
    formData: Omit<Listing, 'id' | 'images' | 'markers'>,
    imageUpdates: { [key in ImageType]?: { action: 'add' | 'delete' | 'keep'; file?: File } },
    markers: Omit<Marker, 'id' | 'listingId'>[]
  ) => {
    if (!listingId || !listing) return;

    try {
      setIsLoading(true);

      const updatedListing: Listing = {
        ...listing,
        ...formData,
        id: listingId,
        markers: markers.map((m) => ({
          ...m,
          id:
            listing.markers.find(
              (existingMarker) =>
                existingMarker.latitude === m.latitude && existingMarker.longitude === m.longitude
            )?.id || '',
          listingId,
        })),
      };

      console.log('[EditListingPage/handleSubmit]: updatedListing:', updatedListing);
      console.log('[EditListingPage/handleSubmit]: imageUpdates:', imageUpdates);

      await updateListing({ updatedListing, imageUpdates });

      showCustomToast({
        title: 'Listing Updated',
        description: 'Your listing has been successfully updated.',
        color: 'success',
      });

      const searchParams = new URLSearchParams(location.search);
      const from = searchParams.get('from') || 'home';
      navigate(`/view/${listingId}?from=${from}`);
    } catch (error) {
      console.error('[EditListingPage/handleSubmit]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from') || 'home';
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

  if (!listing) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-2xl font-semibold mb-4'>Listing not found</h1>
        <button
          onClick={() => navigate('/')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
          Go Back To Listings
        </button>
      </div>
    );
  }

  return (
    <div className='min-h-full bg-white p-4'>
      <div className='flex justify-start items-center mb-4'>
        <button
          onClick={handleBack}
          className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'>
          <ArrowLeftIcon className='h-6 w-6 text-gray-600 stroke-2' />
        </button>
        <h1 className='text-xl font-semibold ml-3'>Edit Listing</h1>
      </div>
      <ListingForm initialData={listing} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};

export default EditListingPage;
