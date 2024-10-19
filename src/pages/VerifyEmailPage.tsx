import React, { useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmailAtom, logoutAtom, authUserAtom } from '../stores/authStore';
import { useSetAtom, useAtomValue } from 'jotai';
import { showCustomToast } from '../components/CustomToast';
import { auth } from '../firebaseConfig';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const sendVerificationEmail = useSetAtom(sendVerificationEmailAtom);
  const logout = useSetAtom(logoutAtom);
  const authUser = useAtomValue(authUserAtom);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (authUser) {
        await authUser.reload();
        setIsEmailVerified(authUser.emailVerified);
      }
    };

    checkEmailVerification();
  }, [authUser]);

  const handleResendEmail = async () => {
    try {
      await sendVerificationEmail();
      showCustomToast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox for the verification link.',
        color: 'success',
      });
    } catch (error) {
      console.error('[VerifyEmailPage] Error sending verification email:', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to send verification email. Please try again.',
        color: 'danger',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('[VerifyEmailPage] Error logging out:', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        color: 'danger',
      });
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        setIsEmailVerified(user.emailVerified);
        if (user.emailVerified) {
          showCustomToast({
            title: 'Email Verified',
            description: 'Your email has been successfully verified.',
            color: 'success',
          });
        } else {
          showCustomToast({
            title: 'Not Verified',
            description: 'Your email is not yet verified. Please check your inbox.',
            color: 'warning',
          });
        }
      }
    } catch (error) {
      console.error('[VerifyEmailPage] Error refreshing verification status:', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to refresh verification status. Please try again.',
        color: 'danger',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4'>
      <div className='bg-white rounded-lg p-8 max-w-md w-full text-center'>
        <h1 className='text-xl font-semibold mb-4'>Verify Your Email</h1>
        {authUser && authUser.email && (
          <p className='mb-4 text-sm text-gray-600'>
            Current email: <strong>{authUser.email}</strong>
          </p>
        )}
        {isEmailVerified ? (
          <>
            <p className='mb-6'>
              Your email has been verified. You can now log in to your account.
            </p>
            <Button
              onClick={handleLogin}
              size='md'
              w='full'
              fontWeight='medium'
              bg='primary.600'
              color='white'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}>
              Login
            </Button>
          </>
        ) : (
          <>
            <p className='mb-6'>
              Please check your inbox and click the verification link to activate your account.
              Login after verification.
            </p>
            <Button
              className='mb-4'
              onClick={handleResendEmail}
              size='md'
              w='full'
              fontWeight='medium'
              bg='primary.600'
              color='white'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}>
              Resend Verification Email
            </Button>
            <Button
              className='mb-4'
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingText='Refreshing...'
              size='md'
              w='full'
              fontWeight='medium'
              bg='primary.600'
              color='white'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}
              leftIcon={<ArrowPathIcon className='w-5 h-5 stroke-[2]' />}>
              Check Status
            </Button>
            <Button onClick={handleLogout} variant='outline' className='w-full'>
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
