import React from 'react';
import { HStack } from '@chakra-ui/react';
import { XMarkIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { SearchParams } from '../../types';

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemoveFilter: (key: keyof SearchParams) => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ searchParams, onRemoveFilter }) => {
  return (
    <HStack spacing={2} wrap="wrap">
      {searchParams.keyword && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <span className="text-xs font-normal mr-2"><span className="font-semibold">Keyword:</span> {searchParams.keyword}</span>
          <button onClick={() => onRemoveFilter('keyword')} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {searchParams.category && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <span className="text-xs font-normal mr-2"><span className="font-semibold">Category:</span> {searchParams.category}</span>
          <button onClick={() => onRemoveFilter('category')} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {searchParams.status && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <span className="text-xs font-normal mr-2"><span className="font-semibold">Status:</span> {searchParams.status}</span>
          <button onClick={() => onRemoveFilter('status')} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
        <span className="text-xs font-normal">
          <span className="font-semibold">Sort:</span> {searchParams.sortBy}
        </span>
        {searchParams.sortOrder === 'ascending' ? (
          <ArrowUpIcon className="h-3.5 w-3.5 ml-1 text-gray-500 stroke-[2.5]" />
        ) : (
          <ArrowDownIcon className="h-3.5 w-3.5 ml-1 text-gray-500 stroke-[2.5]" />
        )}
      </div>
      {searchParams.location && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <span className="text-xs font-normal mr-2">
            <span className="font-semibold">Location:</span> {searchParams.location.lat.toFixed(2)}, {searchParams.location.lng.toFixed(2)} ({searchParams.location.radius}km)
          </span>
          <button onClick={() => onRemoveFilter('location')} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </HStack>
  );
};

export default ActiveFilters;