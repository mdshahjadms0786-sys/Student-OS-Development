import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { MobileNav } from './MobileNav.jsx';

export function AppShell({
  children,
  user,
  currentPath = '#home',
  onNavigate,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header user={user} onNavigate={onNavigate} />
      <div className="flex flex-1">
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileNav currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
}
