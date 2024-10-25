import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, userDataAtom, updateUserNameAtom } from '../stores/userStore';
import {
  authUserAtom,
  logoutAtom,
  changePasswordAtom,
  deleteAccountAtom,
  sendVerificationEmailAtom,
} from '../stores/authStore';
import { showCustomToast } from '../components/CustomToast';
import { Button, Avatar, VStack, Input } from '@chakra-ui/react';
import {
  CalendarIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import AlertDialog from '../components/AlertDialog';
import { PasswordInput } from '../components/PasswordInput';
import { FirebaseError } from 'firebase/app';
import AdminMode from '../components/AdminMode';

const ProfilePage: React.FC = () => {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const userData = useAtomValue(userDataAtom);
  const authUser = useAtomValue(authUserAtom);
  const logout = useSetAtom(logoutAtom);
  const changePassword = useSetAtom(changePasswordAtom);
  const deleteAccount = useSetAtom(deleteAccountAtom);
  const sendVerificationEmail = useSetAtom(sendVerificationEmailAtom);
  const navigate = useNavigate();
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isNameLoading, setIsNameLoading] = useState(false);
  const updateUserName = useSetAtom(updateUserNameAtom);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const isAdmin = userData?.email === decodeAccount();

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'currentPassword':
        if (!value) {
          error = 'Current password is required';
        }
        break;
      case 'newPassword':
        if (!value) {
          error = 'New password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value.length > 64) {
          error = 'Password cannot exceed 64 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Confirm password is required';
        } else if (value !== newPassword) {
          error = "Passwords don't match";
        }
        break;
      case 'deletePassword':
        if (!value) {
          error = 'Password is required to delete account';
        }
        break;
    }
    return error;
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

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
    const newErrors = {
      currentPassword: validateField('currentPassword', currentPassword),
      newPassword: validateField('newPassword', newPassword),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== '')) {
      return;
    }

    try {
      setIsPasswordLoading(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setIsPasswordDialogOpen(false);
      showCustomToast({
        title: 'Password Changed Successfully',
        description: 'Your password has been updated.',
        color: 'success',
      });
    } catch (error) {
      if ((error as FirebaseError).code === 'auth/invalid-credential') {
        setErrors((prev) => ({
          ...prev,
          currentPassword: 'Current password is incorrect',
        }));
        showCustomToast({
          title: 'Password Change Failed',
          description: 'Current password is incorrect',
          color: 'danger',
        });
      } else {
        showCustomToast({
          title: 'Password Change Failed',
          description: 'An error occurred while changing your password.',
          color: 'danger',
        });
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const error = validateField('deletePassword', deletePassword);
    setErrors((prev) => ({ ...prev, deletePassword: error }));

    if (error) {
      return;
    }

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

  const validateName = (name: string) => {
    if (!name) {
      return 'Name is required';
    } else if (name.length < 3) {
      return 'Name must be at least 3 characters long';
    } else if (name.length > 15) {
      return 'Name cannot exceed 15 characters';
    }
    return '';
  };

  const handleNameChange = async () => {
    const error = validateName(newName);
    setErrors((prev) => ({ ...prev, newName: error }));

    if (error) {
      return;
    }

    try {
      setIsNameLoading(true);
      await updateUserName(newName);
      setIsEditNameDialogOpen(false);
      showCustomToast({
        title: 'Name Updated',
        description: 'Your display name has been updated successfully.',
        color: 'success',
      });
    } catch (error) {
      console.error('[ProfilePage/handleNameChange]: ', error);
      showCustomToast({
        title: 'Name Update Failed',
        description: 'An error occurred while updating your display name.',
        color: 'danger',
      });
    } finally {
      setIsNameLoading(false);
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
        <div className='flex items-center mb-4'>
          <h2 className='text-2xl font-semibold'>{userData?.preferences?.name || 'User'}</h2>
          <button
            onClick={() => setIsEditNameDialogOpen(true)}
            className='bg-gray-100 ml-2 p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-200'>
            <PencilIcon className='w-5 h-5 text-gray-600 stroke-2' />
          </button>
        </div>
        <div className='bg-gray-100 p-4 rounded-lg w-full'>
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
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onBlur={(e) => handleBlur('currentPassword', e.target.value)}
              error={errors.currentPassword}
              label='Current Password'
              placeholder='Enter current password'
            />
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={(e) => handleBlur('newPassword', e.target.value)}
              error={errors.newPassword}
              label='New Password'
              placeholder='Enter new password'
            />
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              label='Confirm New Password'
              placeholder='Confirm new password'
            />
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
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onBlur={(e) => handleBlur('deletePassword', e.target.value)}
              error={errors.deletePassword}
              label='Enter your password to confirm account deletion'
              placeholder='Enter your password'
            />
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

      {/* Edit Name Dialog */}
      <AlertDialog
        isOpen={isEditNameDialogOpen}
        onClose={() => setIsEditNameDialogOpen(false)}
        title='Edit Display Name'
        body={
          <div className='space-y-1'>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={(e) =>
                setErrors((prev) => ({ ...prev, newName: validateName(e.target.value) }))
              }
              placeholder='Enter new display name'
              isInvalid={!!errors.newName}
            />
            {errors.newName && <p className='text-red-500 text-sm'>{errors.newName}</p>}
          </div>
        }
        footer={
          <Button
            onClick={handleNameChange}
            isLoading={isNameLoading}
            w='full'
            bg='primary.600'
            color='white'
            fontWeight='medium'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}>
            Update Name
          </Button>
        }
      />

      {/* Admin Mode Button */}
      {isAdmin && (
        <div className='mt-4'>
          <Button
            onClick={() => setIsAdminMode(!isAdminMode)}
            w='full'
            bg='purple.600'
            color='white'
            fontWeight='medium'
            _hover={{ bg: 'purple.700' }}
            _active={{ bg: 'purple.800' }}>
            {isAdminMode ? 'Deactivate Admin Mode' : 'Activate Admin Mode'}
          </Button>
        </div>
      )}

      {/* Admin Mode Component */}
      {isAdmin && isAdminMode && <AdminMode />}
    </div>
  );
};

function decodeAccount(): string {
  const encoded = 'bW9jLmxpYW1nQHZ4LmhpcWFm';
  return atob(encoded).split('').reverse().join('');
}

export default ProfilePage;
