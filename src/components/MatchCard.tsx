import React, { useCallback } from 'react';
import { Match, MatchStatus, Listing } from '../types';
import { useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom } from '../stores/listingStore';
import { updateMatchAtom } from '../stores/matchStore';
import { userDataAtom } from '../stores/userStore';
import {
  MapPinIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { Button, useDisclosure } from '@chakra-ui/react';
import { format, formatDistanceStrict } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { areCoordinatesWithinDistance } from '../utils/utils';
import AlertDialog from './AlertDialog';
import { showCustomToast } from './CustomToast';
import { listingUsersAtom } from '../stores/userStore';

interface MatchCardProps {
  match: Match;
  showActions?: boolean;
  onResolve?: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, showActions = true, onResolve }) => {
  const listings = useAtomValue(listingsAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const listingUsers = useAtomValue(listingUsersAtom);
  const currentUser = useAtomValue(userDataAtom);

  const listing1 = listings[match.listingId1];
  const listing2 = listings[match.listingId2];

  const currentUserListing = listing1.userId === currentUser?.uid ? listing1 : listing2;
  const otherUserListing = listing1.userId === currentUser?.uid ? listing2 : listing1;

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('[MatchCard/formatDate]: ', error);
      return 'Invalid Date';
    }
  };

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
    if (currentUserListing?.markers?.length > 0 && otherUserListing?.markers?.length > 0) {
      let minDistance = Infinity;

      for (const marker1 of currentUserListing.markers) {
        for (const marker2 of otherUserListing.markers) {
          const [, distance] = areCoordinatesWithinDistance(
            { lat: marker1.latitude, lng: marker1.longitude },
            { lat: marker2.latitude, lng: marker2.longitude },
            Infinity
          );
          minDistance = Math.min(minDistance, distance);
        }
      }

      return Math.round(minDistance);
    }
    return null;
  };

  const calculateTimeDifference = () => {
    if (currentUserListing && otherUserListing) {
      const diff = formatDistanceStrict(
        new Date(currentUserListing.createdAt),
        new Date(otherUserListing.createdAt),
        { unit: 'day' }
      );
      return diff + ' apart';
    }
    return null;
  };

  const distance = calculateDistance();
  const timeDifference = calculateTimeDifference();

  const handleViewListing = useCallback(
    (listing: Listing) => {
      const updateMatchStatus = async () => {
        if (match.status === MatchStatus.new) {
          try {
            await updateMatch(match.id, { status: MatchStatus.viewed });
          } catch (error) {
            console.error('[MatchCard/handleViewListing]: Error updating match status:', error);
          }
        }
      };

      updateMatchStatus();
      navigate(`/view/${listing.id}?from=inbox`);
    },
    [match, updateMatch, navigate]
  );

  const handleRejectMatch = async () => {
    try {
      await updateMatch(match.id, { status: MatchStatus.rejected });
      onClose();
      showCustomToast({
        title: 'Match Rejected',
        description: 'The match has been successfully rejected.',
        color: 'success',
      });
    } catch (error) {
      console.error('[MatchCard/handleRejectMatch]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to reject the match. Please try again.',
        color: 'danger',
      });
    }
  };

  const handleResolveMatch = () => {
    if (onResolve) {
      onResolve(match.id);
    } else {
      navigate(`/resolve/${match.id}?from=inbox`);
    }
  };

  const handleRejectClick = () => {
    onOpen();
  };

  const renderListing = (listing: Listing | undefined, isCurrentUserListing: boolean) => {
    if (!listing) {
      return (
        <div className='bg-gray-100 rounded-lg p-2 flex items-center justify-between'>
          <div className='text-sm text-gray-500'>Listing not found</div>
        </div>
      );
    }

    return (
      <div className='mb-4'>
        <h3 className='text-sm font-semibold mb-2'>
          {isCurrentUserListing
            ? 'Your listing'
            : `Matched with ${getDisplayName(listing.userId)}'s listing`}
        </h3>
        <div
          className='p-2 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors duration-200'
          onClick={() => handleViewListing(listing)}>
          <div className='flex items-center space-x-2 w-full'>
            {listing.images.main.data ? (
              <img
                src={listing.images.main.data}
                alt={listing.title}
                className='w-16 h-16 object-cover rounded-md flex-shrink-0'
              />
            ) : (
              <div className='w-16 h-16 bg-gray-200 flex items-center justify-center flex-shrink-0'>
                <span className='text-gray-400 text-xs'>No Image</span>
              </div>
            )}
            <div className='flex-grow min-w-0'>
              <h4 className='font-semibold text-sm mb-1 truncate'>{listing.title}</h4>
              <div className='flex items-center'>
                <span
                  className={`text-[10px] font-medium px-1.5 rounded-full mr-1 flex-shrink-0 ${
                    listing.type === 'lost'
                      ? 'text-red-600 bg-red-100'
                      : 'text-blue-600 bg-blue-100'
                  }`}>
                  {listing.type === 'lost' ? 'Lost' : 'Found'}
                </span>
                <p className='text-xs text-gray-600 truncate'>{listing.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getDisplayName = (userId: string) => {
    const user = listingUsers[userId];
    if (user) {
      return user.preferences?.name || user.email || 'Unknown User';
    }
    return 'Unknown User';
  };

  const isMatchActionable =
    match.status !== MatchStatus.resolved && match.status !== MatchStatus.rejected;

  return (
    <div className='bg-white rounded-lg outline outline-1 outline-gray-200 overflow-hidden'>
      <div className='relative p-4'>
        <span
          className={`absolute top-0 right-0 text-xs font-medium pr-2 pl-3 py-1 rounded-bl-xl ${getMatchStatusColor(
            match.status
          )}`}>
          {match.status}
        </span>
        {renderListing(currentUserListing, true)}
        {renderListing(otherUserListing, false)}

        {/* Location and Time Information */}
        <div className='mt-4 bg-gray-100 rounded-lg p-3'>
          <div className='flex flex-col'>
            <div className='flex items-center justify-between text-[13px] text-gray-600 mb-2 pr-2'>
              <div className='flex items-center'>
                <MapPinIcon className='h-4 w-4 mr-2 flex-shrink-0 stroke-2' />
                <span className='font-medium'>Locations</span>
              </div>
              {distance !== null && (
                <p className='text-xs text-blue-600 font-semibold'>{distance} meters apart</p>
              )}
            </div>
            <p className='text-xs text-gray-500 ml-6 pr-2 truncate'>
              <span className='font-semibold'>You:</span>{' '}
              {currentUserListing?.markers[0]?.name || 'No location'}
            </p>
            <p className='text-xs text-gray-500 ml-6 pr-2 truncate mb-2'>
              <span className='font-semibold'>Match:</span>{' '}
              {otherUserListing?.markers[0]?.name || 'No location'}
            </p>
            <div className='flex items-center justify-between text-[13px] text-gray-600 mt-1 mb-2 pr-2'>
              <div className='flex items-center'>
                <ClockIcon className='h-4 w-4 mr-2 flex-shrink-0 stroke-2' />
                <span className='font-medium'>Listing Times</span>
              </div>
              {timeDifference && (
                <p className='text-xs text-blue-600 font-semibold'>{timeDifference}</p>
              )}
            </div>
            <p className='text-xs text-gray-500 ml-6'>
              <span className='font-semibold'>You:</span>{' '}
              {formatDate(currentUserListing?.createdAt || '')}
            </p>
            <p className='text-xs text-gray-500 ml-6'>
              <span className='font-semibold'>Match:</span>{' '}
              {formatDate(otherUserListing?.createdAt || '')}
            </p>
          </div>
        </div>
      </div>

      {/* Match Actions */}
      {showActions && isMatchActionable && (
        <div className='bg-gray-100 px-4 py-3 sm:px-6 flex justify-end items-center space-x-2'>
          <Button
            size='sm'
            fontWeight='medium'
            colorScheme='green'
            leftIcon={<ArrowTopRightOnSquareIcon className='h-4 w-4' />}
            onClick={handleResolveMatch}>
            Resolve
          </Button>
          <Button
            size='sm'
            fontWeight='medium'
            colorScheme='red'
            leftIcon={<XCircleIcon className='h-4 w-4' />}
            onClick={handleRejectClick}>
            Reject
          </Button>
        </div>
      )}

      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        title='Reject Match'
        body={<p>Are you sure you want to reject this match? This action cannot be undone.</p>}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button colorScheme='red' onClick={handleRejectMatch} ml={3}>
              Reject
            </Button>
          </>
        }
      />
    </div>
  );
};

export default MatchCard;
