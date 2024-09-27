import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom } from './stores/authStore';
import AuthPage from './pages/auth/AuthPage';
import ProtectedPage from './pages/protected/ProtectedPage';
import ListingPage from './pages/listing/ListingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/protected"
          element={
            <PrivateRoute>
              <ProtectedPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/listing"
          element={
            <PrivateRoute>
              <ListingPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
