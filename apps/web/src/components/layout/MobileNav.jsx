import { Home, Clock, Calendar, CheckSquare, MoreHorizontal } from 'lucide-react';
import { cn } from '@student-os/ui';

const mobileItems = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'Today', href: '#today', icon: Clock },
  { name: 'Calendar', href: '#calendar', icon: Calendar },
  { name: 'Tasks', href: '#tasks', icon: CheckSquare },
  { name: 'More', href: '#more', icon: MoreHorizontal },
];

export function MobileNav({ currentPath = '#home', onNavigate }) {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;
        return (
          <a
            key={item.name}
            href={item.href}
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate(item.href);
              }
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </a>
        );
      })}
    </nav>
  );
}
