import React from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  CheckSquare,
  Target,
  Clock,
  BarChart3,
  Flame,
  FolderOpen,
  BookMarked,
  Settings as SettingsIcon,
  Database
} from 'lucide-react';
import type { ActiveNavId } from '../../store/types';

interface MobileNavProps {
  mobileMenuOpen: boolean;
  activeNav: ActiveNavId;
  pendingTasksBadgeCount: number;
  onSelectNav: (id: ActiveNavId) => void;
  onCloseMobileMenu: () => void;
}

export function MobileNav({
  mobileMenuOpen,
  activeNav,
  pendingTasksBadgeCount,
  onSelectNav,
  onCloseMobileMenu
}: MobileNavProps) {
  const navSections = [
    {
      heading: 'Main tools',
      items: [
        { id: 'overview' as ActiveNavId, label: 'Overview', icon: LayoutDashboard },
        { id: 'calendar' as ActiveNavId, label: 'Calendar', icon: CalendarIcon },
        { id: 'tasks' as ActiveNavId, label: 'Task list', icon: CheckSquare, badge: pendingTasksBadgeCount },
        { id: 'goals' as ActiveNavId, label: 'Goals', icon: Target },
        { id: 'schedules' as ActiveNavId, label: 'Schedules', icon: Clock },
        { id: 'statistics' as ActiveNavId, label: 'Statistics', icon: BarChart3 },
        { id: 'habits' as ActiveNavId, label: 'Habits', icon: Flame }
      ]
    },
    {
      heading: 'Additional tools',
      items: [
        { id: 'notes' as ActiveNavId, label: 'Files & Notes', icon: FolderOpen },
        { id: 'journal' as ActiveNavId, label: 'Journal & Reviews', icon: BookMarked }
      ]
    },
    {
      heading: 'System',
      items: [
        { id: 'settings' as ActiveNavId, label: 'Settings', icon: SettingsIcon },
        { id: 'backup' as ActiveNavId, label: 'Backup & Data', icon: Database }
      ]
    }
  ];

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden shrink-0 ${
        mobileMenuOpen
          ? 'grid-rows-[1fr] opacity-100 border-b border-white/10 bg-[#0b0e16]'
          : 'grid-rows-[0fr] opacity-0 pointer-events-none'
      }`}
    >
      <div className="overflow-hidden">
        <div className="kinetic-scroll max-h-[60dvh] overflow-y-auto p-3 space-y-1.5">
          {navSections.flatMap((g) => g.items).map((item) => {
            const IconComp = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectNav(item.id);
                  onCloseMobileMenu();
                }}
                className={`kp-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
