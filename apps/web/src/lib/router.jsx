import * as React from "react";
import { useAuth } from "./auth-context.jsx";

export function useRouter() {
  const [currentPath, setCurrentPath] = React.useState(
    () => window.location.hash || "#home",
  );

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#home");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = React.useCallback((path) => {
    window.location.hash = path;
  }, []);

  return { currentPath, navigate };
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  const isProfileComplete = React.useMemo(() => {
    if (!user) return false;
    return Boolean(
      user.profileComplete ||
      (user.profile && (user.profile.program || user.profile.semester)),
    );
  }, [user]);

  React.useEffect(() => {
    if (!loading) {
      if (
        !user &&
        window.location.hash !== "#login" &&
        window.location.hash !== "#register"
      ) {
        window.location.hash = "#login";
      } else if (
        user &&
        !isProfileComplete &&
        window.location.hash !== "#profile"
      ) {
        window.location.hash = "#profile";
      }
    }
  }, [user, loading, isProfileComplete]);

  if (loading) return null;
  if (!user) return null;
  if (!isProfileComplete && window.location.hash !== "#profile") return null;

  return <>{children}</>;
}
