import { AuthProvider } from './lib/auth-context.js';
import { useRouter, ProtectedRoute } from './lib/router.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { HomePage } from './pages/HomePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SubjectsPage } from './pages/SubjectsPage.js';
import { TimetablePage } from './pages/TimetablePage.js';
import { TodayPage } from './pages/TodayPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';

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
