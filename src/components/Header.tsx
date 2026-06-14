import { Search, Bell, Moon, Sun, Mic, Sparkles, AlertCircle } from "lucide-react";
import { useAppStore } from "../store";
import { useState, useEffect } from "react";

export default function Header() {
  const { 
    searchQuery, 
    setSearchQuery, 
    isDarkMode, 
    toggleDarkMode, 
    getTheme,
    tasks
  } = useAppStore();

  const theme = getTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Calculate notifications based on critical/due tasks
  useEffect(() => {
    const list: string[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
    const dueTodayTasks = tasks.filter(t => !t.completed && t.dueDate === todayStr);
    const urgentTasks = tasks.filter(t => !t.completed && t.priority === 'high');

    if (overdueTasks.length > 0) {
      list.push(`You have ${overdueTasks.length} overdue task(s)! Please attend to them.`);
    }
    if (dueTodayTasks.length > 0) {
      list.push(`You have ${dueTodayTasks.length} task(s) due today.`);
    }
    if (urgentTasks.length > 0 && urgentTasks.length <= 3) {
      list.push(`Heads up! "${urgentTasks[0].title}" is flagged as high priority.`);
    }

    if (list.length === 0) {
      list.push("All quiet! You are fully caught up with your goals.");
    }

    setNotifications(list);
  }, [tasks]);

  return (
    <header className="glass-panel border-b border-white/10 bg-[#050508]/80 h-16 px-6 flex items-center justify-between relative z-30">
      {/* Search Input Section */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Quick search tasks, tags, importance..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
        />
      </div>

      {/* Control Tools */}
      <div className="flex items-center gap-4">
        {/* Dark/Light Mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all relative group"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          
          <div className="absolute right-0 top-12 scale-0 group-hover:scale-100 bg-slate-900 border border-white/10 text-white text-[10px] rounded px-2 py-1 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </div>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all relative group"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.length > 0 && notifications[0] !== "All quiet! You are fully caught up with your goals." && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
            
            <div className="absolute right-0 top-12 scale-0 group-hover:scale-100 bg-slate-900 border border-white/10 text-white text-[10px] rounded px-2 py-1 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
              Alerts
            </div>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-2xl glass-panel border border-white/10 shadow-2xl p-4 text-slate-300 text-xs z-50 space-y-2 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-sans font-bold text-sm text-white">Focus Notifications</span>
                <span className="text-[10px] font-mono text-slate-400">Updates</span>
              </div>
              <div className="space-y-2 pt-1">
                {notifications.map((notif, index) => (
                  <div key={index} className="flex gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <p className="leading-tight text-slate-200">{notif}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Elegant User Avatar */}
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
              alt="User profile"
              className="w-8.5 h-8.5 rounded-full object-cover border border-indigo-500/30"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-sans font-bold text-white leading-tight justify-start flex">Arnav Sharma</p>
            <p className="text-[10px] font-mono text-slate-400 justify-start flex">Ultimate Level</p>
          </div>
        </div>
      </div>
    </header>
  );
}
