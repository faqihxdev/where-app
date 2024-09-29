import React, { useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
} from '@chakra-ui/react';
import { SearchParams } from '../../types';
import SearchForm from './SearchForm';
import LocationSearch from './LocationSearch';

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

  useEffect(() => {
    if (isOpen) {
      setLocalSearchParams(searchParams);
    }
  }, [isOpen, searchParams]);

  const handleApplySearch = () => {
    onApplySearch(localSearchParams);
  };

  const handleResetSearch = () => {
    onResetSearch();
    setLocalSearchParams(searchParams);
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
            <LocationSearch
              location={localSearchParams.location}
              setLocation={(location) => setLocalSearchParams({ ...localSearchParams, location })}
            />
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <button
            className="px-4 py-2 mr-3 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={handleResetSearch}
          >Reset</button>
          <button
            className="px-4 py-2 mr-3 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={onClose}
          >Cancel</button>
          <button
            className="h-full w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleApplySearch}
          >Apply</button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SearchDrawer;