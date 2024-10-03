import React from 'react';
import { FormControl, FormLabel, Input, Select, VStack, HStack } from '@chakra-ui/react';
import { ListingCategory, ListingStatus, Listing, SearchParams } from '../../types';

interface SearchFormProps {
  searchParams: SearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>;
}

const SearchForm: React.FC<SearchFormProps> = ({ searchParams, setSearchParams }) => {
  return (
    <VStack spacing={4} align='stretch'>
      <FormControl>
        <FormLabel>Keyword</FormLabel>
        <Input
          variant='filled'
          bg='gray.100'
          placeholder='Search by title or description'
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Category</FormLabel>
        <Select
          variant='filled'
          bg='gray.100'
          placeholder='Select category'
          value={searchParams.category}
          onChange={(e) =>
            setSearchParams({ ...searchParams, category: e.target.value as ListingCategory })
          }>
          {Object.values(ListingCategory).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Status</FormLabel>
        <Select
          variant='filled'
          bg='gray.100'
          placeholder='Select status'
          value={searchParams.status}
          onChange={(e) =>
            setSearchParams({ ...searchParams, status: e.target.value as ListingStatus })
          }>
          {Object.values(ListingStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Sort By</FormLabel>
        <HStack>
          <Select
            variant='filled'
            bg='gray.100'
            value={searchParams.sortBy}
            onChange={(e) =>
              setSearchParams({ ...searchParams, sortBy: e.target.value as keyof Listing })
            }>
            <option value='title'>Title</option>
            <option value='createdAt'>Date Posted</option>
            <option value='updatedAt'>Last Updated</option>
            <option value='expiresAt'>Date Expired</option>
          </Select>
          <Select
            variant='filled'
            bg='gray.100'
            value={searchParams.sortOrder}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                sortOrder: e.target.value as 'ascending' | 'descending',
              })
            }>
            <option value='ascending'>Ascending</option>
            <option value='descending'>Descending</option>
          </Select>
        </HStack>
      </FormControl>
    </VStack>
  );
};

export default SearchForm;
