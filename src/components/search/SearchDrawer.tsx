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
  Button
} from '@chakra-ui/react';
import { SearchParams, Marker } from '../../types';
import SearchForm from './SearchForm';
import MapSelector from '../map/MapSelector';

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
  onResetSearch 
}) => {
  const [localSearchParams, setLocalSearchParams] = React.useState<SearchParams>(searchParams);
  const [locationFilter, setLocationFilter] = useState<Omit<Marker, 'id' | 'listingId'> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSearchParams(searchParams);
    }
  }, [isOpen, searchParams]);

  const handleApplySearch = () => {
    const updatedSearchParams = {
      ...localSearchParams,
      location: locationFilter ? {
        lat: locationFilter.latitude,
        lng: locationFilter.longitude,
        radius: locationFilter.radius
      } : null
    };
    onApplySearch(updatedSearchParams);
  };

  const handleResetSearch = () => {
    onResetSearch();
    setLocalSearchParams(searchParams);
    setLocationFilter(null);
  };

  const handleLocationChange = (markers: Omit<Marker, 'id' | 'listingId'>[]) => {
    setLocationFilter(markers[0] || null);
  };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="full">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Search Listings</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <SearchForm searchParams={localSearchParams} setSearchParams={setLocalSearchParams} />
            <MapSelector
              mode="filter"
              onMarkersChange={handleLocationChange}
              maxMarkers={1}
              initialMarkers={locationFilter ? [locationFilter] : []}
            />
          </VStack>
        </DrawerBody>

        <DrawerFooter className="space-x-2">
          <Button onClick={handleResetSearch} paddingX={7} fontWeight="medium" variant="outline">
            Reset
          </Button>
          <Button onClick={onClose} paddingX={7} fontWeight="medium" variant="outline">
            Cancel
          </Button>
          <Button onClick={handleApplySearch} w="full" bg="primary.600" color="white" fontWeight="medium" variant="outline" _hover={{ bg: 'primary.700' }} _active={{ bg: 'primary.800' }}>
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SearchDrawer;