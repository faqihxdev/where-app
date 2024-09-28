import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom, initializeAuthAtom, authLoadingAtom } from './stores/authStore';
import AuthPage from './pages/auth/AuthPage';
import ListingPage from './pages/listing/ListingPage';
import MapPage from './pages/map/MapPage';
import ProfilePage from './pages/profile/ProfilePage';
import PostPage from './pages/post/PostPage';
import NotificationPage from './pages/notification/NotificationPage';
import MainLayout from './components/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { useEffect } from 'react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [authLoading] = useAtom(authLoadingAtom);
  const location = useLocation();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const [, initializeAuth] = useAtom(initializeAuthAtom);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<ListingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/post" element={<PostPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
