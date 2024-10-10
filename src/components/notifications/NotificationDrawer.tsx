import React from 'react';
import { useAtomValue } from 'jotai';
import { Notification } from '../../types';
import { userNotificationsAtom } from '../../stores/notificationStore';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
} from '@chakra-ui/react';

interface NotificationDrawerProps {
  notification: Notification | null;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ notification, onClose }) => {
  const notifications = useAtomValue(userNotificationsAtom);

  if (!notification) return null;

  // Use the local state of the notification instead of the prop
  const currentNotification = notifications[notification.id] || notification;

  return (
    <Drawer isOpen={!!notification} placement='bottom' onClose={onClose} size='full'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{currentNotification.title}</DrawerHeader>

        <DrawerBody>
          <p className='text-sm text-gray-500'>{currentNotification.message}</p>
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={onClose} w='full' fontWeight='medium' variant='outline'>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationDrawer;
