import React from 'react';
import {
  Sparkles,
  ChevronLeft,
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
  Database,
  HardDrive
} from 'lucide-react';
import type { ActiveNavId } from '../../store/types';

interface SidebarProps {
  activeNav: ActiveNavId;
  sidebarCollapsed: boolean;
  selectedDateISO: string;
  pendingTasksBadgeCount: number;
  badgePulse: boolean;
  onSelectNav: (id: ActiveNavId) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeNav,
  sidebarCollapsed,
  selectedDateISO,
  pendingTasksBadgeCount,
  badgePulse,
  onSelectNav,
  onToggleCollapse
}: SidebarProps) {
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
    <aside
      className={`hidden md:flex flex-col h-full max-h-full overflow-hidden border-r border-white/[0.06] bg-[#0b0e16] transition-[width,padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        sidebarCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-4'
      } shrink-0`}
    >
      {/* Top Branding & Collapse Control (shrink-0) */}
      <div className="flex items-center justify-between px-1.5 pb-4 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div
            className={`overflow-hidden whitespace-nowrap transition-[opacity,transform,max-width] duration-200 ease-out ${
              sidebarCollapsed
                ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                : 'max-w-[140px] opacity-100 translate-x-0'
            }`}
          >
            <span className="text-base font-extrabold tracking-tight text-white">Kinetic</span>
            <span className="text-base font-extrabold text-indigo-400">.OS</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="kp-btn shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Independently Scrollable Navigation Groups (min-h-0 flex-1 overflow-y-auto) */}
      <nav
        aria-label="Sidebar Navigation"
        className="kinetic-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 -mr-1 space-y-5"
      >
        {navSections.map((group) => (
          <div key={group.heading}>
            <div
              className={`px-3 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-[opacity,max-height,margin] duration-200 ${
                sidebarCollapsed ? 'max-h-0 mb-0 opacity-0' : 'max-h-6 mb-2 opacity-100'
              }`}
            >
              {group.heading}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComp = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectNav(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`kp-btn group relative flex w-full items-center ${
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } rounded-xl py-2.5 text-xs font-semibold ${
                      active
                        ? 'bg-[#1a1f30] text-white shadow-sm border border-indigo-500/30'
                        : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400 transition-all duration-200"
                      />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                          active
                            ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </span>
                      <span
                        className={`truncate whitespace-nowrap transition-[opacity,transform,max-width] duration-200 ease-out ${
                          sidebarCollapsed
                            ? 'max-w-0 opacity-0 -translate-x-1.5 pointer-events-none hidden'
                            : 'max-w-[130px] opacity-100 translate-x-0'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 ${
                          badgePulse ? 'kp-badge-bump' : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Anchored Footer Status Panel (shrink-0) */}
      <div className="pt-3 mt-2 border-t border-white/[0.05] shrink-0">
        {sidebarCollapsed ? (
          <div
            title={`Local Storage v2 · Date: ${selectedDateISO}`}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-[#10131c] py-2.5 text-[10px] text-slate-400"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#10131c] p-3 text-[11px] text-slate-400">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span>Local Storage v2</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-1 truncate">Date: {selectedDateISO}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
