import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { User as FirebaseUser } from 'firebase/auth';
import { authUserAtom, initializeAuthAtom } from './stores/authStore';
import { userDataAtom } from './stores/userStore';
import { fetchAllUserNotificationsAtom, notificationsLoadedAtom } from './stores/notificationStore';
import AuthPage from './pages/AuthPage';
import ListingPage from './pages/ListingPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import PostPage from './pages/PostPage';
import InboxPage from './pages/InboxPage';
import MainLayout from './components/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { useEffect, useState } from 'react';
import ViewListingPage from './pages/ViewListingPage';
import EditListingPage from './pages/EditListingPage';
import NotFoundPage from './pages/NotFoundPage';
import RandomPage from './pages/randomPage';
import ResolvePage from './pages/ResolvePage';
import { User } from './types';

function PrivateRoute({
  children,
  authUser,
  userData,
  notificationsLoaded,
}: {
  children: React.ReactNode;
  authUser: FirebaseUser | null;
  userData: User | null;
  notificationsLoaded: boolean;
}) {
  const location = useLocation();

  // If user is not authenticated, redirect to auth page
  if (!authUser) {
    return <Navigate to='/auth' state={{ from: location }} replace />;
  }

  // If user data is not loaded, show loading spinner
  if (!userData || !notificationsLoaded) {
    return (
      <div className='h-screen w-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const initializeAuth = useSetAtom(initializeAuthAtom);
  const authUser = useAtomValue(authUserAtom);
  const userData = useAtomValue(userDataAtom);
  const fetchAllUserNotifications = useSetAtom(fetchAllUserNotificationsAtom);
  const notificationsLoaded = useAtomValue(notificationsLoadedAtom);

  console.log('[App]: I am in App!');

  // Runs once to initialize the auth state and fetch user data
  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
      setIsInitializing(false);
    };
    initialize();
  }, [initializeAuth]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userData && !notificationsLoaded) {
        try {
          await fetchAllUserNotifications(userData.uid);
        } catch (error) {
          console.error('[App]: Error fetching user notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [userData, fetchAllUserNotifications, notificationsLoaded]);

  // If auth is still initializing, show loading spinner
  if (isInitializing || !authUser) {
    return (
      <div className='h-screen w-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path='/auth' element={<AuthPage />} />
        <Route
          element={
            <PrivateRoute
              authUser={authUser}
              userData={userData}
              notificationsLoaded={notificationsLoaded}>
              <MainLayout />
            </PrivateRoute>
          }>
          <Route path='/' element={<ListingPage />} />
          <Route path='/map' element={<MapPage />} />
          <Route path='/post' element={<PostPage />} />
          <Route path='/inbox' element={<InboxPage />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/view/:listingId' element={<ViewListingPage />} />
          <Route path='/edit/:listingId' element={<EditListingPage />} />
          <Route path='/resolve' element={<ResolvePage />} />
          <Route path='/resolve/:id1/:id2' element={<ResolvePage />} />
          <Route path='/random' element={<RandomPage />} />
        </Route>
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
