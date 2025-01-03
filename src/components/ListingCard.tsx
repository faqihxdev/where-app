import { useState } from 'react';
import { Listing } from '../types';
import { useAtomValue, useSetAtom } from 'jotai';
import { deleteListingAtom } from '../stores/listingStore';
import { listingUsersAtom, getAvatarUrl } from '../stores/userStore';
import { markersAtom } from '../stores/markerStore';
import {
  ExclamationCircleIcon,
  MagnifyingGlassCircleIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import {
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';
import { ListingStatus } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import AlertDialog from './AlertDialog';
import { showCustomToast } from './CustomToast';
import { createTestId } from '../utils/utils';
interface ListingCardProps {
  listing: Listing;
  showActions?: boolean;
}

export default function ListingCard({ listing, showActions = false }: ListingCardProps) {
  const deleteListing = useSetAtom(deleteListingAtom);
  const [isImageLoading] = useState(!listing.images.main.data);
  const markers = useAtomValue(markersAtom);
  const listingUsers = useAtomValue(listingUsersAtom);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  // Function to safely format the date
  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd hh:mm a');
  };

  // Updated getDisplayName function
  const getDisplayName = (userId: string) => {
    const user = listingUsers[userId];
    if (user) {
      return user.preferences?.name || user.email;
    }
    return '';
  };

  // Helper function to safely get marker name
  const getMarkerName = (markerId: string) => {
    return markers[markerId]?.name || 'Loading location...';
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.resolved:
        return 'bg-green-200/95 text-green-800';
      case ListingStatus.expired:
        return 'bg-red-200/95 text-red-800';
      default:
        return '';
    }
  };

  const handleViewClick = () => {
    const from = location.pathname === '/inbox' ? 'inbox' : 'home';
    navigate(`/view/${listing.id}?from=${from}`);
  };

  const handleEditClick = () => {
    navigate(`/edit/${listing.id}?from=inbox`);
  };

  const handleDeleteClick = async () => {
    try {
      await deleteListing(listing.id);
      onClose();
      showCustomToast({
        title: 'Listing Deleted',
        description: 'Your listing has been successfully deleted.',
        color: 'success',
      });
    } catch (error) {
      console.error('[ListingCard/handleDeleteClick]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to delete the listing. Please try again.',
        color: 'danger',
      });
    }
  };

  const cardTestId = createTestId(listing.title);

  return (
    <div
      className='bg-white outline outline-1 outline-gray-200 rounded-lg overflow-hidden'
      data-testid={`listing-card-${cardTestId}`}>
      <div className='flex'>
        <div className='w-1/3 aspect-square relative'>
          {isImageLoading ? (
            <div className='w-full h-full flex items-center justify-center bg-gray-100'>
              <div className='scale-50'>
                <LoadingSpinner />
              </div>
            </div>
          ) : listing.images.main.data ? (
            <img
              src={listing.images.main.data}
              alt={listing.title}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gray-100 text-gray-400'>
              No Image
            </div>
          )}
          {/* Status Badge */}
          {listing.status !== ListingStatus.active && (
            <div
              className={`absolute top-0 left-0 flex rounded-br-lg items-center gap-1 px-2 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(listing.status)}`}
              data-testid='listing-status-badge'>
              <span>{listing.status}</span>
            </div>
          )}
        </div>
        <div className='w-2/3 px-3 pt-2 pb-3 relative'>
          <div
            className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              listing.type === 'found' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
            }`}
            data-testid={`listing-type-badge-${listing.type}-${cardTestId}`}
            aria-label={`Listing type: ${listing.type}`}>
            {listing.type === 'lost' ? (
              <ExclamationCircleIcon className='w-3 h-3 stroke-2' />
            ) : (
              <MagnifyingGlassCircleIcon className='w-3 h-3 stroke-2' />
            )}
            {listing.type === 'lost' ? 'Lost' : 'Found'}
          </div>
          <div
            className='flex items-center gap-2 mb-1'
            data-testid={`listing-user-info-${cardTestId}`}>
            <Avatar
              size='xs'
              name={getDisplayName(listing.userId)}
              src={getAvatarUrl(getDisplayName(listing.userId))}
            />
            <span className='text-xs font-medium truncate w-[calc(100%-100px)]'>
              {getDisplayName(listing.userId)}
            </span>
          </div>
          <h4
            className='font-semibold text-sm mb-1 mt-2 truncate'
            data-testid={`listing-title-${cardTestId}`}>
            {listing.title}
          </h4>
          <p
            className='text-xs text-gray-600 line-clamp-2'
            data-testid={`listing-description-${cardTestId}`}>
            {listing.description}
          </p>
        </div>
      </div>
      <div className='flex items-center p-2 bg-gray-100'>
        <div className='text-gray-700 font-medium text-xs flex-grow overflow-hidden mr-2'>
          <p data-testid={`listing-date-${cardTestId}`}>
            <span>{formatDate(listing.createdAt)}</span>
          </p>
          <p className='truncate' data-testid={`listing-location-${cardTestId}`}>
            {listing.markers.length > 0 ? getMarkerName(listing.markers[0].id) : 'No location'}
          </p>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <Button
            onClick={handleViewClick}
            size='sm'
            fontWeight='medium'
            bg='primary.600'
            color='white'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}
            rightIcon={!showActions ? <ChevronRightIcon className='w-4 h-4' /> : undefined}
            data-testid={`listing-view-button-${cardTestId}`}>
            View
          </Button>
          {showActions && (
            <Menu>
              <MenuButton
                as={Button}
                size='sm'
                paddingX={1.5}
                fontWeight='medium'
                bg='primary.600'
                color='white'
                _hover={{ bg: 'primary.700' }}
                _active={{ bg: 'primary.800' }}
                aria-label='Actions'
                data-testid={`listing-actions-${cardTestId}`}>
                <EllipsisVerticalIcon className='w-5 h-5 stroke-2' />
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={handleEditClick}
                  icon={<PencilIcon className='h-4 w-4' />}
                  data-testid={`listing-edit-${cardTestId}`}>
                  Edit
                </MenuItem>
                <MenuItem
                  onClick={onOpen}
                  color='red.500'
                  icon={<TrashIcon className='h-4 w-4' />}
                  data-testid={`listing-delete-${cardTestId}`}>
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </div>
      </div>
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        title='Delete Listing'
        body={<p>Are you sure you want to delete this listing? This action cannot be undone.</p>}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button colorScheme='red' onClick={handleDeleteClick} ml={3}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
