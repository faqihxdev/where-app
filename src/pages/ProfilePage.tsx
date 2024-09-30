import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { userDataAtom } from '../stores/userStore';
import { authUserAtom, logoutAtom } from '../stores/authStore';
import { showCustomToast } from '../components/CustomToast';
import { Button } from '@chakra-ui/react';

const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const userData = useAtomValue(userDataAtom);
  const authUser = useAtomValue(authUserAtom);
  const logout = useSetAtom(logoutAtom);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white p-4">
      <h1 className="text-2xl font-semibold mb-4">Profile Page</h1>

      <Button
        onClick={handleLogout}
        isLoading={isLoading}
        loadingText='Logging out...'
        fontWeight="medium"
        bg='primary.600'
        color='white'
        _hover={{ bg: 'primary.700' }}
        _active={{ bg: 'primary.800' }}
      >
        Logout
      </Button>

      <div className="bg-gray-100 p-4 rounded-md mt-4">
        <h2 className="text-lg font-semibold mb-2">User Data:</h2>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(userData, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-md mt-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Auth User:</h2>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(authUser, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ProfilePage;