import { LayoutDashboard, CheckSquare, AlertCircle, CheckCircle, Settings, Menu, ChevronLeft, Award } from "lucide-react";
import { useAppStore } from "../store";

export default function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    isSidebarExpanded, 
    toggleSidebar, 
    tasks, 
    streakCount,
    getTheme
  } = useAppStore();

  const theme = getTheme();

  const pendingAllCount = tasks.filter(t => !t.completed).length;
  const highPriorityCount = tasks.filter(t => !t.completed && t.priority === 'high').length;
  const completedCount = tasks.filter(t => t.completed).length;

  const menuItems = [
    { 
      id: 'dashboard' as const, 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'all' as const, 
      label: 'All Tasks', 
      icon: CheckSquare,
      badge: pendingAllCount > 0 ? pendingAllCount : null,
      badgeClass: 'bg-indigo-500/20 text-indigo-300'
    },
    { 
      id: 'important' as const, 
      label: 'Important', 
      icon: AlertCircle,
      badge: highPriorityCount > 0 ? highPriorityCount : null,
      badgeClass: 'bg-rose-500/25 text-rose-300'
    },
    { 
      id: 'completed' as const, 
      label: 'Completed', 
      icon: CheckCircle,
      badge: completedCount > 0 ? completedCount : null,
      badgeClass: 'bg-emerald-500/20 text-emerald-300'
    },
    { 
      id: 'settings' as const, 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  return (
    <aside 
      className={`glass-panel shrink-0 flex flex-col justify-between transition-all duration-300 h-full relative z-40
        ${isSidebarExpanded ? 'w-64' : 'w-20'} 
        border-r border-white/10 md:static fixed left-0 top-0 bottom-0`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${theme.primaryGradient} shadow-md`}>
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans font-bold text-lg text-white tracking-tight whitespace-nowrap bg-clip-text">
              FocusFlow
            </span>
          </div>

          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle Sidebar"
          >
            {isSidebarExpanded ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-2 flex-grow">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-sans font-medium text-sm transition-all duration-200 group relative
                  ${isActive 
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg` 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="relative flex items-center">
                  <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 duration-200`} />
                </div>

                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden
                  ${isSidebarExpanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 pointer-events-none'}`}
                >
                  {item.label}
                </span>

                {/* Badges */}
                {item.badge !== null && (
                  <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full transition-transform duration-300
                    ${isActive ? 'bg-white/20 text-white' : item.badgeClass}
                    ${!isSidebarExpanded && 'absolute -top-1 -right-1 scale-85 shadow'}`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {!isSidebarExpanded && (
                  <div className="absolute left-24 px-3 py-1.5 bg-slate-900 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer (Streak / Profile Info) */}
      <div className="p-3 border-t border-white/5">
        {isSidebarExpanded ? (
          <div className="bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Daily Streak</span>
              <div className="flex ml-auto items-center">
                <span className="text-orange-500 animate-pulse text-xs">🔥</span>
                <span className="font-bold text-white text-xs ml-1">{streakCount}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500" 
                style={{ width: `${Math.max(10, Math.min(100, (streakCount / 30) * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all relative group"
            aria-label="Streak Summary"
          >
            <span className="animate-pulse">🔥</span>
            <div className="absolute left-24 px-3 py-1.5 bg-slate-900 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 whitespace-nowrap pointer-events-none">
              Streak: {streakCount} Days Active
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
