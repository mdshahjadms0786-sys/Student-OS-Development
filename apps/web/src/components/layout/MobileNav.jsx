import * as React from "react";
import {
  Home,
  Clock,
  Calendar,
  CheckSquare,
  MoreHorizontal,
  UserCheck,
  Award,
  FileText,
  BarChart3,
  CalendarDays,
  BookOpen,
  Bell,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@student-os/ui";

const primaryItems = [
  { name: "Home", href: "#home", icon: Home },
  { name: "Today", href: "#today", icon: Clock },
  { name: "Calendar", href: "#calendar", icon: Calendar },
  { name: "Tasks", href: "#tasks", icon: CheckSquare },
];

const secondaryItems = [
  { name: "Attendance", href: "#attendance", icon: UserCheck },
  { name: "Exams", href: "#exams", icon: Award },
  { name: "Notes", href: "#notes", icon: FileText },
  { name: "Analytics", href: "#analytics", icon: BarChart3 },
  { name: "Timetable", href: "#timetable", icon: CalendarDays },
  { name: "Subjects", href: "#subjects", icon: BookOpen },
  { name: "Notifications", href: "#notifications", icon: Bell },
  { name: "Settings", href: "#settings", icon: Settings },
];

export function MobileNav({ currentPath = "#home", onNavigate }) {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const handleNav = (href) => {
    setIsMoreOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <>
      {/* More Drawer */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex flex-col justify-end"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                More Modules
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-4">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] leading-tight">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </a>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
            isMoreOpen || secondaryItems.some((s) => s.href === currentPath)
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
