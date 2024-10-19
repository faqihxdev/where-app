import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, userDataAtom } from '../stores/userStore';
import {
  authUserAtom,
  logoutAtom,
  changePasswordAtom,
  deleteAccountAtom,
  sendVerificationEmailAtom,
} from '../stores/authStore';
import { showCustomToast } from '../components/CustomToast';
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Avatar,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import AlertDialog from '../components/AlertDialog';

const ProfilePage: React.FC = () => {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const userData = useAtomValue(userDataAtom);
  const authUser = useAtomValue(authUserAtom);
  const logout = useSetAtom(logoutAtom);
  const changePassword = useSetAtom(changePasswordAtom);
  const deleteAccount = useSetAtom(deleteAccountAtom);
  const sendVerificationEmail = useSetAtom(sendVerificationEmailAtom);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
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
      setIsLogoutLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsPasswordLoading(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setIsPasswordDialogOpen(false);
      showCustomToast({
        title: 'Password Changed Successfully',
        description: 'Your password has been updated.',
        color: 'success',
      });
    } catch (error) {
      console.error('[ProfilePage/handlePasswordChange]: ', error);
      setError('Password change failed. Please try again.');
      showCustomToast({
        title: 'Password Change Failed',
        description: 'An error occurred while changing your password.',
        color: 'danger',
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleteLoading(true);
      await deleteAccount(deletePassword);
      showCustomToast({
        title: 'Account Deleted',
        description: 'Your account has been deleted successfully.',
        color: 'success',
      });
      navigate('/auth');
    } catch (error) {
      console.error('[ProfilePage/handleDeleteAccount]: ', error);
      setError('Account deletion failed. Please try again.');
      showCustomToast({
        title: 'Account Deletion Failed',
        description: 'An error occurred while deleting your account.',
        color: 'danger',
      });
    } finally {
      setIsDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setIsVerifyLoading(true);
      await sendVerificationEmail();
      showCustomToast({
        title: 'Verification Email Sent',
        description: 'Please check your email to verify your account.',
        color: 'success',
      });
    } catch (error) {
      console.error('[ProfilePage/handleSendVerificationEmail]: ', error);
      showCustomToast({
        title: 'Verification Email Failed',
        description: 'An error occurred while sending the verification email.',
        color: 'danger',
      });
    } finally {
      setIsVerifyLoading(false);
    }
  };

  return (
    <div className='min-h-full bg-white p-4 flex flex-col'>
      {/* Page Title and Logout Button */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Your Profile</h1>
        </div>
        <Button
          onClick={handleLogout}
          isLoading={isLogoutLoading}
          loadingText='Logging out...'
          bg='transparent'
          border='2px solid'
          borderColor='gray.300'
          color='gray.500'
          fontWeight='medium'
          _hover={{ bg: 'gray.100' }}
          _active={{ bg: 'gray.200' }}>
          Logout
        </Button>
      </div>

      {/* User Information */}
      <div className='flex flex-col items-center mb-6'>
        <Avatar
          size='2xl'
          name={userData?.preferences?.name || ''}
          src={getAvatarUrl(userData?.preferences?.name || '')}
          mb={4}
        />
        <h2 className='text-2xl font-semibold mb-4'>{userData?.preferences?.name || 'User'}</h2>
        <div className='bg-gray-100 p-4 rounded-lg w-full max-w-md'>
          <div className='flex items-center mb-2'>
            <EnvelopeIcon className='w-5 h-5 mr-2 text-gray-600 stroke-2' />
            <p className='text-sm text-gray-600'>{userData?.email}</p>
            <div
              className={`ml-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                authUser?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {authUser?.emailVerified ? (
                <CheckCircleIcon className='w-3 h-3 stroke-2' />
              ) : (
                <ExclamationCircleIcon className='w-3 h-3 stroke-2' />
              )}
              {authUser?.emailVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
          {userData?.createdAt && (
            <div className='flex items-center'>
              <CalendarIcon className='w-5 h-5 mr-2 text-gray-600 stroke-2' />
              <p className='text-sm text-gray-600'>
                Created on {format(userData.createdAt, 'MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='space-y-4 flex-grow'>
        {!authUser?.emailVerified && (
          <Button
            onClick={handleSendVerificationEmail}
            isLoading={isVerifyLoading}
            loadingText='Sending...'
            w='full'
            bg='transparent'
            border='2px solid'
            borderColor='blue.300'
            color='blue.500'
            fontWeight='medium'
            _hover={{ bg: 'blue.100' }}
            _active={{ bg: 'blue.200' }}>
            Verify Email
          </Button>
        )}
        <Button
          onClick={() => setIsPasswordDialogOpen(true)}
          w='full'
          bg='primary.600'
          color='white'
          fontWeight='medium'
          _hover={{ bg: 'primary.700' }}
          _active={{ bg: 'primary.800' }}>
          Change Password
        </Button>
      </div>

      {/* Delete Account Button */}
      <div className='mt-auto pt-4'>
        <Button
          onClick={() => setIsDeleteDialogOpen(true)}
          w='full'
          bg='transparent'
          border='2px solid'
          borderColor='red.300'
          color='red.500'
          fontWeight='medium'
          _hover={{ bg: 'red.100' }}
          _active={{ bg: 'red.200' }}>
          Delete Account
        </Button>
      </div>

      {/* Change Password Dialog */}
      <AlertDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        title='Change Password'
        body={
          <VStack spacing={3} align='stretch'>
            <FormControl isInvalid={!!error}>
              <FormLabel>Current Password</FormLabel>
              <Input
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Enter current password'
                variant='filled'
                bg='gray.100'
                rounded='md'
              />
            </FormControl>
            <FormControl isInvalid={!!error}>
              <FormLabel>New Password</FormLabel>
              <Input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Enter new password'
                variant='filled'
                bg='gray.100'
                rounded='md'
              />
            </FormControl>
            <FormControl isInvalid={!!error}>
              <FormLabel>Confirm New Password</FormLabel>
              <Input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Confirm new password'
                variant='filled'
                bg='gray.100'
                rounded='md'
              />
            </FormControl>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </VStack>
        }
        footer={
          <Button
            onClick={handlePasswordChange}
            isLoading={isPasswordLoading}
            w='full'
            bg='primary.600'
            color='white'
            fontWeight='medium'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}>
            Change Password
          </Button>
        }
      />

      {/* Delete Account Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title='Delete Account'
        body={
          <VStack spacing={3} align='stretch'>
            <FormControl isInvalid={!!error}>
              <FormLabel>Enter your password to confirm account deletion</FormLabel>
              <Input
                type='password'
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder='Enter your password'
                variant='filled'
                bg='gray.100'
                rounded='md'
              />
            </FormControl>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </VStack>
        }
        footer={
          <Button
            onClick={handleDeleteAccount}
            isLoading={isDeleteLoading}
            w='full'
            bg='red.600'
            color='white'
            fontWeight='medium'
            _hover={{ bg: 'red.700' }}
            _active={{ bg: 'red.800' }}>
            Confirm Deletion
          </Button>
        }
      />
    </div>
  );
};

export default ProfilePage;
