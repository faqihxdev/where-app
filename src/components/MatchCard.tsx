import React from 'react';
import { Match, MatchStatus } from '../types';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom } from '../stores/listingStore';
import { updateMatchAtom } from '../stores/matchStore';
import { MapPinIcon, ClockIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { areCoordinatesWithinDistance, truncateWithEllipsis } from '../utils/utils';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const listings = useAtomValue(listingsAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  const navigate = useNavigate();

  const mainListing = listings[match.listingId1];
  const matchedListing = listings[match.listingId2];

  const formatDate = (date: Date) => format(date, 'MMM d, yyyy');

  const getMatchStatusColor = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.new:
        return 'bg-green-100 text-green-800';
      case MatchStatus.viewed:
        return 'bg-blue-100 text-blue-800';
      case MatchStatus.resolved:
        return 'bg-purple-100 text-purple-800';
      case MatchStatus.rejected:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDistance = () => {
    if (mainListing.markers.length > 0 && matchedListing.markers.length > 0) {
      const [, distance] = areCoordinatesWithinDistance(
        { lat: mainListing.markers[0].latitude, lng: mainListing.markers[0].longitude },
        { lat: matchedListing.markers[0].latitude, lng: matchedListing.markers[0].longitude },
        Infinity
      );
      return Math.round(distance);
    }
    return null;
  };

  const distance = calculateDistance();

  const handleViewMatch = () => {
    navigate(`/view/${matchedListing.id}?from=inbox`);
  };

  const handleResolveMatch = async () => {
    await updateMatch(match.id, { status: MatchStatus.resolved });
  };

  const handleRejectMatch = async () => {
    await updateMatch(match.id, { status: MatchStatus.rejected });
  };

  return (
    <div className="bg-white rounded-lg outline outline-1 outline-gray-200 overflow-hidden">
      <div className="p-4">

        {/* Main Listing */}
        <div className="mb-4">
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-grow">
              <img src={mainListing.images.main.data} alt={mainListing.title} className="w-16 h-16 object-cover rounded-lg" />
              <div>
                <h3 className="font-semibold text-sm">{mainListing.title}</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">{truncateWithEllipsis(mainListing.markers[0]?.name || 'No location', 20)}</span>
                </div>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${mainListing.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {mainListing.type === 'lost' ? 'Lost' : 'Found'}
            </span>
          </div>
        </div>
        
        {/* Divider */}
        {/* <h4 className="font-semibold text-sm mb-2 text-center bg-gray-100 p-2 rounded-md">
          <ArrowsUpDownIcon className="h-3 w-3 mr-1" />
          Matched Listing
        </h4> */}

        {/* Matched Listing */}
        <div className="mt-4">
          <div className="flex items-start space-x-4">
            <img src={matchedListing.images.main.data} alt={matchedListing.title} className="w-20 h-20 object-cover rounded-md" />
            <div>
              <h5 className="font-medium text-sm mb-1">{matchedListing.title}</h5>
              <p className="text-xs text-gray-600 mb-1 line-clamp-2">{matchedListing.description}</p>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{truncateWithEllipsis(matchedListing.markers[0]?.name || 'No location', 30)}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>{formatDate(matchedListing.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Actions */}
      <div className="bg-gray-100 px-4 py-3 sm:px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getMatchStatusColor(match.status)}`}>
            {match.status}
          </span>
          {distance !== null && (
            <span className="text-xs font-medium text-gray-500">
              {distance} meters apart
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleViewMatch}
            size="sm"
            fontWeight="medium"
            bg='primary.600'
            color='white'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
            View
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              fontWeight="medium"
              bg='primary.600'
              color='white'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}
              aria-label="Actions"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleResolveMatch} icon={<CheckCircleIcon className="h-4 w-4" />}>Resolve</MenuItem>
              <MenuItem onClick={handleRejectMatch} icon={<XCircleIcon className="h-4 w-4" />} color="red.500">Reject</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;