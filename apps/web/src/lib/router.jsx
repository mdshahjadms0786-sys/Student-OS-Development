import * as React from 'react';
import { useAuth } from './auth-context.jsx';

export function useRouter() {
  const [currentPath, setCurrentPath] = React.useState(() => window.location.hash || '#home');

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = React.useCallback((path) => {
    window.location.hash = path;
  }, []);

  return { currentPath, navigate };
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Or a full page spinner handled higher up
  
  if (!user) {
    window.location.hash = '#login';
    return null;
  }
  
  if (user && !user.profileComplete && window.location.hash !== '#profile') {
    window.location.hash = '#profile';
    return null;
  }

  return <>{children}</>;
}
