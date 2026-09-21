import * as React from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { MobileNav } from './MobileNav.js';

interface AppShellProps {
  children: React.ReactNode;
  user?: { name: string; email: string } | null;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function AppShell({
  children,
  user,
  currentPath = '#home',
  onNavigate,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header user={user} />
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
