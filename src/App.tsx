import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { isAuthenticatedAtom, initializeAuthAtom } from './stores/authStore';
import AuthPage from './pages/AuthPage';
import ListingPage from './pages/ListingPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import PostPage from './pages/PostPage';
import InboxPage from './pages/InboxPage';
import MainLayout from './components/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { Provider } from 'jotai';
import ViewListingPage from './pages/ViewListingPage';
import EditListingPage from './pages/EditListingPage';
import NotFoundPage from './pages/NotFoundPage';
import ResolvePage from './pages/ResolvePage';
// import OneSignal from 'react-onesignal';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to='/auth' state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const initializeAuth = useSetAtom(initializeAuthAtom);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsLoading(false);
    };
    init();
  }, [initializeAuth]);

  // useEffect(() => {
  //   const initOneSignal = async () => {
  //     try {
  //       const existingUserId = OneSignal.User.PushSubscription.id;
  //       console.log('[App]: Existing OneSignal User ID:', existingUserId);
  //       if (existingUserId) {
  //         console.log('[App]: Existing OneSignal User ID:', existingUserId);
  //       } else {
  //         await OneSignal.init({
  //           appId: '3e721a36-042d-41e0-b58a-6c8a41e5f3a8',
  //           allowLocalhostAsSecureOrigin: true,
  //           notifyButton: {
  //             enable: true,
  //           },
  //         });

  //         const newUserId = OneSignal.User.PushSubscription.id;
  //         if (newUserId) {
  //           console.log('[App]: New OneSignal User ID:', newUserId);
  //         } else {
  //           console.error('[App]: Failed to get OneSignal User ID after initialization');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('[App]: Error initializing or getting OneSignal User ID:', error);
  //     }
  //   };

  //   initOneSignal();
  // }, []);

  if (isLoading) {
    return (
      <div className='h-screen w-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Provider>
      <Router>
        <Routes>
          <Route path='/auth' element={<AuthPage />} />
          <Route
            element={
              <PrivateRoute>
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
          </Route>
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Router>
    </Provider>
  );
}
export default App;
