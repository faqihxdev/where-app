import React from 'react';
import { useAtom } from 'jotai';
import { Notification } from '../../types';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';
import { userNotificationsAtom, markNotifications } from '../../stores/notificationStore';

interface NotificationRowProps {
  notification: Notification;
  onOpenDrawer: (notification: Notification) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onOpenDrawer }) => {
  const [, setNotifications] = useAtom(userNotificationsAtom);

  const handleClick = async () => {
    if (notification.status !== 'read') {
      try {
        await markNotifications([notification.id], 'read', setNotifications);
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
        notification.status === 'read' ? 'unread' : 'read',
        setNotifications
      );
    } catch (error) {
      console.error('[NotificationRow] Error marking notification:', error);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotifications([notification.id], 'removed', setNotifications);
    } catch (error) {
      console.error('[NotificationRow] Error removing notification:', error);
    }
  };

  if (notification.status === 'removed') {
    return null; // Don't render removed notifications
  }

  return (
    <div
      className={`flex items-center justify-between p-4 bg-white outline outline-1 outline-gray-200 rounded-lg overflow-hidden ${
        notification.status === 'read' ? 'bg-gray-50' : ''
      }`}
      onClick={handleClick}>
      <div className='flex-grow'>
        <h3
          className={`font-semibold ${notification.status === 'read' ? 'text-gray-600' : 'text-black'}`}>
          {notification.title}
        </h3>
        <p
          className={`text-sm ${notification.status === 'read' ? 'text-gray-500' : 'text-gray-700'}`}>
          {notification.message.length > 100
            ? `${notification.message.substring(0, 100)}...`
            : notification.message}
        </p>
      </div>
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
