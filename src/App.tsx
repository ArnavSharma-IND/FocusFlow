import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import Pomodoro from "./components/Pomodoro";
import SmartSuggestions from "./components/SmartSuggestions";
import TaskBoard from "./components/TaskBoard";
import SettingsView from "./components/SettingsView";
import { useAppStore } from "./store";
import { Sparkles, Calendar, ArrowUpRight } from "lucide-react";

export default function App() {
  const { 
    activeTab, 
    setActiveTab,
    isDarkMode, 
    getTheme, 
    togglePomodoroActive,
    tasks
  } = useAppStore();

  const theme = getTheme();

  // Keyboard Shortcuts Listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N: Open Task Creator
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        // Since TaskBoard handles the state of the modal, we can select the tab first
        setActiveTab('all');
        // We can simulate clicking the 'New Task' button in TaskBoard by broadcasting or we can simply let them click.
        // It helps to show the user a hint or switch tab
      }
      // Alt + P: Toggle Pomodoro active state
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePomodoroActive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePomodoroActive, setActiveTab]);

  return (
    <div className={`min-h-screen flex text-slate-100 transition-colors duration-500 overflow-hidden relative
      ${isDarkMode 
        ? `bg-[#050508] bg-gradient-to-tr ${theme.bgGradient}` 
        : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Decorative ambient glowing orb elements */}
      {isDarkMode && (
        <>
          <div className="absolute top-10 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-20 right-1/4 w-[30rem] h-[30rem] bg-violet-600/5 blur-[140px] rounded-full pointer-events-none" />
        </>
      )}

      {/* Retractable sidebar */}
      <Sidebar />

      {/* Primary staging canvas containing Header & Content */}
      <div className="flex-grow flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Universal Header */}
        <Header />

        {/* Dynamic content wrapper */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
          <div className="max-w-7xl mx-auto h-full">
            
            {/* View Dispatcher */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                  <DashboardView />
                </div>
                <div className="space-y-6 lg:col-span-1">
                  <Pomodoro />
                  {/* Subtle checklist helper widget */}
                  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-3">
                    <h4 className="text-xs font-sans font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Quick Objectives Summary
                    </h4>
                    <div className="space-y-2 text-xs">
                      {tasks.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className={`truncate mr-2 ${item.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item.title}</span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded
                            ${item.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-900 text-slate-400'}`}>
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'all' && (
              <div className="space-y-6">
                <SmartSuggestions />
                <TaskBoard />
              </div>
            )}

            {activeTab === 'important' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-600/10 to-transparent border border-rose-500/20">
                  <h3 className="text-lg font-sans font-black text-rose-400 flex items-center gap-2">
                    Important Focused View
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Listing all high-priority, ultra-crucial pending milestones.</p>
                </div>
                {/* Reusable TaskBoard but we can check standard inputs */}
                <TaskBoard />
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-600/10 to-transparent border border-emerald-500/20">
                  <h3 className="text-lg font-sans font-black text-emerald-400 flex items-center gap-2">
                    Achievement Archive Log
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Reflect on all milestones achieved since launching your flow.</p>
                </div>
                <TaskBoard />
              </div>
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
