import React from 'react';
import { useSetAtom } from 'jotai';
import { Notification } from '../types';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';
import { markNotificationsAtom } from '../stores/notificationStore';

interface NotificationRowProps {
  notification: Notification;
  onOpenDrawer: (notification: Notification) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onOpenDrawer }) => {
  const markNotifications = useSetAtom(markNotificationsAtom);

  const handleClick = async () => {
    if (notification.status !== 'read') {
      try {
        await markNotifications([notification.id], 'read');
      } catch (error) {
        console.error('[NotificationRow] Error marking notification as read:', error);
      }
    }
    onOpenDrawer(notification);
  };

  const handleMarkAsReadUnread = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotifications(
        [notification.id],
        notification.status === 'read' ? 'unread' : 'read'
      );
    } catch (error) {
      console.error('[NotificationRow] Error marking notification:', error);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotifications([notification.id], 'removed');
    } catch (error) {
      console.error('[NotificationRow] Error removing notification:', error);
    }
  };

  // If the notification is removed, don't render it
  if (notification.status === 'removed') {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between p-4 bg-white outline outline-1 outline-gray-200 rounded-lg overflow-hidden ${
        notification.status === 'read' ? 'bg-gray-50' : ''
      }`}
      onClick={handleClick}>
      <div className='flex-grow overflow-hidden'>
        <h3
          className={`font-semibold text-sm ${notification.status === 'read' ? 'text-gray-600' : 'text-black'}`}>
          {notification.title}
        </h3>
        <p
          className={`text-sm truncate pr-2 ${notification.status === 'read' ? 'text-gray-500' : 'text-gray-700'}`}>
          {notification.message}
        </p>
      </div>
      <Menu>
        <MenuButton
          as={Button}
          size='sm'
          paddingX={1.5}
          fontWeight='medium'
          bg='gray.100'
          color='gray.700'
          _hover={{ bg: 'gray.200' }}
          _active={{ bg: 'gray.300' }}
          aria-label='Actions'
          onClick={(e) => e.stopPropagation()}>
          <EllipsisVerticalIcon className='w-5 h-5 stroke-2' />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={handleMarkAsReadUnread}>
            Mark as {notification.status === 'read' ? 'unread' : 'read'}
          </MenuItem>
          <MenuItem onClick={handleRemove}>Remove</MenuItem>
        </MenuList>
      </Menu>
    </div>
  );
};

export default NotificationRow;
