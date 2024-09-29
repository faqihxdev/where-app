import React from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { userDataAtom } from '../stores/userStore';
import { authUserAtom, logoutAtom } from '../stores/authStore';
import { showCustomToast } from '../components/CustomToast';

const ProfilePage: React.FC = () => {
  const [userData] = useAtom(userDataAtom);
  const [authUser] = useAtom(authUserAtom);
  const [, logout] = useAtom(logoutAtom);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      showCustomToast({
        title: 'Logout Successful',
        description: 'You have been logged out.',
        bgColor: 'bg-green-500'
      });
      navigate('/auth');
    } catch (error) {
      console.error('[ProfilePage/handleLogout]: ', error);
      showCustomToast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        bgColor: 'bg-red-500'
      });
    }
  };

  return (
    <div className="min-h-full bg-white p-4">
      <h1 className="text-2xl font-semibold mb-4">Profile Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold mb-2">User Data:</h2>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(userData, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold mb-2">Auth User:</h2>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(authUser, null, 2)}
        </pre>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default ProfilePage;