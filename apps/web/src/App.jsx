import { AuthProvider } from './lib/auth-context.jsx';
import { useRouter, ProtectedRoute } from './lib/router.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SubjectsPage } from './pages/SubjectsPage.jsx';
import { TimetablePage } from './pages/TimetablePage.jsx';
import { TodayPage } from './pages/TodayPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';

function AppContent() {
  const { currentPath } = useRouter();

  if (currentPath === '#login') return <LoginPage />;
  if (currentPath === '#register') return <RegisterPage />;
  if (currentPath === '#profile')
    return (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      {currentPath === '#home' && <HomePage />}
      {currentPath === '#subjects' && <SubjectsPage />}
      {currentPath === '#timetable' && <TimetablePage />}
      {currentPath === '#today' && <TodayPage />}
      {currentPath === '#tasks' && <TasksPage />}
      {currentPath === '#calendar' && <CalendarPage />}
      {currentPath === '#notifications' && <NotificationsPage />}
      {/* Fallback for unhandled paths */}
      {[
        '#home',
        '#subjects',
        '#timetable',
        '#today',
        '#tasks',
        '#calendar',
        '#notifications',
        '#profile',
        '#login',
        '#register',
      ].indexOf(currentPath) === -1 && <HomePage />}
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
