import React, { ReactNode } from 'react';
import {
  AlertDialog as ChakraAlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  footer: ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, title, body, footer }) => {
  const cancelRef = React.useRef(null);

  return (
    <ChakraAlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent m={4}>
          <AlertDialogHeader fontSize='lg' fontWeight='semibold' pb={2}>
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>{body}</AlertDialogBody>

          <AlertDialogFooter>{footer}</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </ChakraAlertDialog>
  );
};

export default AlertDialog;
