import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { userDataAtom } from '../stores/userStore';
import { logoutAtom } from '../stores/authStore';
import { showCustomToast } from '../components/CustomToast';
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from 'firebase/auth';

const ProfilePage: React.FC = () => {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false); // For password change
  const [isDeleteLoading, setIsDeleteLoading] = useState(false); // For account deletion
  const [isLogoutLoading, setIsLogoutLoading] = useState(false); // For logout
  const [currentPassword, setCurrentPassword] = useState(''); // For change password
  const [newPassword, setNewPassword] = useState(''); // For change password
  const [confirmPassword, setConfirmPassword] = useState(''); // For change password
  const [deletePassword, setDeletePassword] = useState(''); // For delete account
  const [error, setError] = useState('');
  const userData = useAtomValue(userDataAtom);
  const logout = useSetAtom(logoutAtom);
  const navigate = useNavigate();

  // Modal controllers for Change Password and Delete Account
  const {
    isOpen: isPasswordModalOpen,
    onOpen: onPasswordModalOpen,
    onClose: onPasswordModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true); // Set loading state for logout
      await logout();
      showCustomToast({
        title: 'Logout Successful',
        description: 'You have been logged out.',
        color: 'success',
      });
      navigate('/auth');
    } catch (error) {
      console.error('[ProfilePage/handleLogout]: ', error);
      showCustomToast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        color: 'danger',
      });
    } finally {
      setIsLogoutLoading(false); // Remove loading state for logout
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsPasswordLoading(true); // Set loading state for password change
      const auth = getAuth();
      const user = auth.currentUser;

      if (user && currentPassword) {
        // Re-authenticate the user with the current password
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        showCustomToast({
          title: 'Password Changed Successfully',
          description: 'Your password has been updated.',
          color: 'success',
        });

        // Clear the form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onPasswordModalClose(); // Close the modal after success
      } else {
        setError('User is not authenticated.');
      }
    } catch (error) {
      console.error('Password change failed: ', error);
      setError('Password change failed. Please try again.');
    } finally {
      setIsPasswordLoading(false); // Remove loading state for password change
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setIsDeleteLoading(true); // Set loading state for account deletion
      const auth = getAuth();
      const user = auth.currentUser;

      if (user && deletePassword) {
        // Re-authenticate the user with their current password
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);

        // Delete the user account
        await deleteUser(user);

        showCustomToast({
          title: 'Account Deleted',
          description: 'Your account has been deleted successfully.',
          color: 'success',
        });

        // Redirect to the login or home page after deletion
        navigate('/auth');
      } else {
        setError('User is not authenticated.');
      }
    } catch (error) {
      console.error('Account deletion failed: ', error);
      setError('Account deletion failed. Please try again.');
    } finally {
      setIsDeleteLoading(false); // Remove loading state for account deletion
      onDeleteModalClose(); // Close the modal after success
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Profile Page</h1>

        {/* User Data Section */}
        <div className='bg-gray-50 p-4 rounded-lg mt-6 shadow-inner'>
          <h2 className='text-xl font-semibold text-gray-700 mb-4'>User Data:</h2>
          <div className='grid grid-cols-1 gap-4'>
            {userData?.preferences?.name && (
              <div className='bg-white p-4 rounded-md shadow-sm'>
                <h3 className='text-gray-700 font-medium text-sm mb-1 flex items-center'>Name:</h3>
                <p className='text-gray-600 text-sm break-words'>{userData.preferences.name}</p>
              </div>
            )}

            {userData?.email && (
              <div className='bg-white p-4 rounded-md shadow-sm'>
                <h3 className='text-gray-700 font-medium text-sm mb-1 flex items-center'>Email:</h3>
                <p className='text-gray-600 text-sm break-words'>{userData.email}</p>
              </div>
            )}

            {userData?.createdAt && (
              <div className='bg-white p-4 rounded-md shadow-sm'>
                <h3 className='text-gray-700 font-medium text-sm mb-1 flex items-center'>
                  Account Created At:
                </h3>
                <p className='text-gray-600 text-sm break-words'>
                  {new Date(userData.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Button */}
        <Button onClick={onPasswordModalOpen} colorScheme='blue' className='w-full mt-6'>
          Change Password
        </Button>

        {/* Delete Account Button */}
        <Button onClick={onDeleteModalOpen} colorScheme='red' className='w-full mt-6'>
          Delete Account
        </Button>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          isLoading={isLogoutLoading} // Logout-specific loading state
          loadingText='Logging out...'
          colorScheme='gray'
          className='w-full mt-6'>
          Logout
        </Button>

        {/* Change Password Modal */}
        <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Change Password</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={!!error}>
                <FormLabel htmlFor='currentPassword'>Current Password</FormLabel>
                <Input
                  id='currentPassword'
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder='Enter current password'
                  className='mb-4'
                />
                <FormLabel htmlFor='newPassword'>New Password</FormLabel>
                <Input
                  id='newPassword'
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                  className='mb-4'
                />
                <FormLabel htmlFor='confirmPassword'>Confirm New Password</FormLabel>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  className='mb-4'
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={handlePasswordChange}
                isLoading={isPasswordLoading}
                colorScheme='blue'
                className='w-full'>
                Change Password
              </Button>
              <Button variant='ghost' onClick={onPasswordModalClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Account Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={!!error}>
                <FormLabel>Enter your password to confirm account deletion</FormLabel>
                <Input
                  type='password'
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder='Enter your password'
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme='red' isLoading={isDeleteLoading} onClick={handleDeleteAccount}>
                Confirm Deletion
              </Button>
              <Button variant='ghost' onClick={onDeleteModalClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;
