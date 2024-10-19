import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Button,
} from '@chakra-ui/react';
import { SearchParams, Marker } from '../../types';
import SearchForm from './SearchForm';
import MapSelector from '../MapSelector';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySearch: (searchParams: SearchParams) => void;
  searchParams: SearchParams;
  onResetSearch: () => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  isOpen,
  onClose,
  onApplySearch,
  searchParams,
  onResetSearch,
}) => {
  const [localSearchParams, setLocalSearchParams] = React.useState<SearchParams>(searchParams);
  const [locationFilter, setLocationFilter] = useState<Omit<Marker, 'id' | 'listingId'> | null>(
    null
  );
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLocalSearchParams(searchParams);
      setLocationFilter(
        searchParams.location
          ? {
              name: 'Selected Location',
              latitude: searchParams.location.lat,
              longitude: searchParams.location.lng,
              radius: searchParams.location.radius,
            }
          : null
      );
    }
  }, [isOpen, searchParams]);

  const handleApplySearch = () => {
    const updatedSearchParams = {
      ...localSearchParams,
      location: locationFilter
        ? {
            name: locationFilter.name,
            lat: locationFilter.latitude,
            lng: locationFilter.longitude,
            radius: locationFilter.radius,
          }
        : null,
    };
    onApplySearch(updatedSearchParams);
  };

  const handleResetSearch = () => {
    onResetSearch();
    setLocalSearchParams({ ...searchParams, location: null });
    setLocationFilter(null);
    setResetKey((prevKey) => prevKey + 1);
  };

  const handleLocationChange = (markers: Omit<Marker, 'id' | 'listingId'>[]) => {
    setLocationFilter(markers[0] || null);
  };

  return (
    <Drawer isOpen={isOpen} placement='bottom' onClose={onClose} size='full'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Search Listings</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align='stretch'>
            <SearchForm searchParams={localSearchParams} setSearchParams={setLocalSearchParams} />
            <div>
              <div className='font-medium mb-3'>Location</div>
              <MapSelector
                key={resetKey}
                mode='filter'
                onMarkersChange={handleLocationChange}
                maxMarkers={1}
                initialMarkers={locationFilter ? [locationFilter] : []}
                showRemoveButton={true}
              />
            </div>
          </VStack>
        </DrawerBody>

        <DrawerFooter className='space-x-2'>
          <Button onClick={handleResetSearch} paddingX={7} fontWeight='medium' variant='outline'>
            Reset
          </Button>
          <Button onClick={onClose} paddingX={7} fontWeight='medium' variant='outline'>
            Cancel
          </Button>
          <Button
            onClick={handleApplySearch}
            w='full'
            bg='primary.600'
            color='white'
            fontWeight='medium'
            variant='outline'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}>
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SearchDrawer;
