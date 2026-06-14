import { create } from "zustand";
import { Task, ThemePreset, AppTheme, PomodoroState, TaskStats } from "./types";
import confetti from "canvas-confetti";

export const THEMES: Record<ThemePreset, AppTheme> = {
  royal: {
    id: "royal",
    name: "Royal Amethyst",
    primaryGradient: "from-violet-600 to-blue-500",
    bgGradient: "from-[#050508] via-[#0d0d21] to-[#040407]",
    accentColor: "violet-500",
    cardBg: "rgba(255, 255, 255, 0.05)",
    textColor: "text-violet-400"
  },
  emerald: {
    id: "emerald",
    name: "Emerald Forest",
    primaryGradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-[#030704] via-[#06150f] to-[#020503]",
    accentColor: "emerald-500",
    cardBg: "rgba(255, 255, 255, 0.05)",
    textColor: "text-emerald-400"
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Glow",
    primaryGradient: "from-fuchsia-500 to-cyan-500",
    bgGradient: "from-[#070308] via-[#16061f] to-[#030104]",
    accentColor: "cyan-500",
    cardBg: "rgba(255, 255, 255, 0.05)",
    textColor: "text-fuchsia-400"
  },
  sunset: {
    id: "sunset",
    name: "Crimson Sunset",
    primaryGradient: "from-orange-500 to-rose-500",
    bgGradient: "from-[#080304] via-[#1a080f] to-[#040102]",
    accentColor: "rose-500",
    cardBg: "rgba(255, 255, 255, 0.05)",
    textColor: "text-rose-400"
  },
  slate: {
    id: "slate",
    name: "Monochrome Sleek",
    primaryGradient: "from-zinc-400 to-zinc-650",
    bgGradient: "from-[#0b0c10] via-[#131722] to-[#08090d]",
    accentColor: "zinc-400",
    cardBg: "rgba(255, 255, 255, 0.05)",
    textColor: "text-slate-300"
  }
};

interface AppStore {
  // Navigation & UI States
  activeTab: 'dashboard' | 'all' | 'important' | 'completed' | 'settings';
  isDarkMode: boolean;
  themePreset: ThemePreset;
  selectedTaskIds: string[];
  searchQuery: string;
  isSidebarExpanded: boolean;
  
  // Tasks
  tasks: Task[];
  lastDeletedTask: { task: Task; index: number } | null;
  categories: string[];
  
  // Pomodoro
  pomodoro: PomodoroState;
  
  // Productivity/Streaks
  streakCount: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  
  // Setters & Methods
  setActiveTab: (tab: 'dashboard' | 'all' | 'important' | 'completed' | 'settings') => void;
  toggleDarkMode: () => void;
  setThemePreset: (preset: ThemePreset) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  addMultipleTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'completed'>[]) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  undoDelete: () => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  taskDropOnIndex: (draggedId: string, targetId: string) => void;
  toggleTaskSelection: (id: string) => void;
  clearTaskSelection: () => void;
  deleteSelectedTasks: () => void;
  bulkCompleteSelected: () => void;
  bulkDeleteCompleted: () => void;
  
  // Pomodoro Actions
  tickPomodoro: () => void;
  togglePomodoroActive: () => void;
  resetPomodoro: () => void;
  setPomodoroMode: (mode: 'work' | 'break') => void;
  
  // Helpers
  getTheme: () => AppTheme;
  getStats: () => TaskStats;
}

// Helper to calculate initial streaks
const calculateStreaks = () => {
  const loadedStreak = localStorage.getItem("streakCount");
  const loadedDate = localStorage.getItem("lastActiveDate");
  const streak = loadedStreak ? parseInt(loadedStreak, 10) : 0;
  return { streak, date: loadedDate };
};

export const useAppStore = create<AppStore>((set, get) => {
  // Load tasks from local storage
  const getStoredTasks = (): Task[] => {
    try {
      const stored = localStorage.getItem("todo_tasks");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading tasks from localStorage", e);
    }
    // Return sample tasks on fresh start to display beautiful UI immediately
    return [
      {
        id: "task-1",
        title: "Review Design System Specs",
        description: "Verify custom spacing, rounded corners, and custom shadow filters inspired by premium design patterns.",
        dueDate: new Date().toISOString().split('T')[0],
        priority: "high",
        category: "Work",
        completed: false,
        createdAt: Date.now() - 3600000 * 4
      },
      {
        id: "task-2",
        title: "Implement Framer Motion microinteractions",
        description: "Add smooth sliding, physics scale triggers, and checklist completion ripple visuals.",
        dueDate: new Date().toISOString().split('T')[0],
        priority: "medium",
        category: "Learning",
        completed: true,
        createdAt: Date.now() - 3600000 * 8
      },
      {
        id: "task-3",
        title: "Weekly Fitness Conditioning",
        description: "Complete 45 minutes of core high-intensity intervals and flexibility exercises.",
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: "low",
        category: "Health",
        completed: false,
        createdAt: Date.now() - 3600000 * 24
      },
      {
        id: "task-4",
        title: "Financial Audits & Budgets",
        description: "Analyze monthly expenditures, verify invoices, and update the savings workbook.",
        dueDate: "",
        priority: "high",
        category: "Finance",
        completed: false,
        createdAt: Date.now() - 3600000 * 30
      }
    ];
  };

  const initialTasks = getStoredTasks();
  const { streak: initialStreak, date: initialDate } = calculateStreaks();
  
  // Extract initial categories lists
  const defaultCategories = ["Work", "Personal", "Health", "Finance", "Learning", "General"];
  const uniqueInTasks = Array.from(new Set(initialTasks.map(t => t.category))).filter(c => c && !defaultCategories.includes(c));

  return {
    activeTab: 'dashboard',
    isDarkMode: true,
    themePreset: 'royal',
    selectedTaskIds: [],
    searchQuery: "",
    isSidebarExpanded: true,
    
    tasks: initialTasks,
    lastDeletedTask: null,
    categories: [...defaultCategories, ...uniqueInTasks],
    
    pomodoro: {
      minutes: 25,
      seconds: 0,
      isActive: false,
      mode: 'work',
      completedSessions: 0
    },
    
    streakCount: initialStreak,
    lastActiveDate: initialDate,

    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    setThemePreset: (preset) => set({ themePreset: preset }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),

    addTask: (taskInput) => {
      const newTask: Task = {
        ...taskInput,
        id: `task-${Date.now()}`,
        completed: false,
        createdAt: Date.now()
      };
      
      const updatedTasks = [newTask, ...get().tasks];
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      
      const updatedCategories = get().categories.includes(taskInput.category)
        ? get().categories
        : [...get().categories, taskInput.category];
        
      set({ tasks: updatedTasks, categories: updatedCategories });
    },

    addMultipleTasks: (taskInputs) => {
      const newTasks: Task[] = taskInputs.map((task, idx) => ({
        ...task,
        id: `task-${Date.now()}-${idx}`,
        completed: false,
        createdAt: Date.now()
      }));

      const updatedTasks = [...newTasks, ...get().tasks];
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));

      const currentCats = get().categories;
      const parsedCats = taskInputs.map(t => t.category).filter(c => c && !currentCats.includes(c));
      const updatedCategories = Array.from(new Set([...currentCats, ...parsedCats]));

      set({ tasks: updatedTasks, categories: updatedCategories });
    },

    updateTask: (updatedTask) => {
      const updatedTasks = get().tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      
      const updatedCategories = get().categories.includes(updatedTask.category)
        ? get().categories
        : [...get().categories, updatedTask.category];

      set({ tasks: updatedTasks, categories: updatedCategories });
    },

    deleteTask: (id) => {
      const taskIndex = get().tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return;
      
      const targetTask = get().tasks[taskIndex];
      const updatedTasks = get().tasks.filter(t => t.id !== id);
      
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      
      set({ 
        tasks: updatedTasks, 
        lastDeletedTask: { task: targetTask, index: taskIndex },
        selectedTaskIds: get().selectedTaskIds.filter(tid => tid !== id)
      });
    },

    toggleTaskCompletion: (id) => {
      const updatedTasks = get().tasks.map(t => {
        if (t.id === id) {
          const completedState = !t.completed;
          
          // Trigger confetti if all tasks are completed
          if (completedState) {
            // Check streak trigger on task complete
            const today = new Date().toISOString().split('T')[0];
            const yesterdayObj = new Date();
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterday = yesterdayObj.toISOString().split('T')[0];
            const { lastActiveDate, streakCount } = get();
            
            let newStreak = streakCount;
            if (lastActiveDate !== today) {
              if (lastActiveDate === yesterday || lastActiveDate === null) {
                newStreak = lastActiveDate === null ? 1 : streakCount + 1;
              } else {
                newStreak = 1; // broken streak Reset
              }
              localStorage.setItem("streakCount", newStreak.toString());
              localStorage.setItem("lastActiveDate", today);
              set({ streakCount: newStreak, lastActiveDate: today });
            }
          }
          
          return { ...t, completed: completedState };
        }
        return t;
      });

      // Show confetti if all completed
      const pendingCount = updatedTasks.filter(t => !t.completed).length;
      if (pendingCount === 0 && updatedTasks.length > 0) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      set({ tasks: updatedTasks });
    },

    undoDelete: () => {
      const { lastDeletedTask, tasks } = get();
      if (!lastDeletedTask) return;
      
      const updatedTasks = [...tasks];
      updatedTasks.splice(lastDeletedTask.index, 0, lastDeletedTask.task);
      
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      set({ tasks: updatedTasks, lastDeletedTask: null });
    },

    reorderTasks: (startIndex, endIndex) => {
      const updatedTasks = [...get().tasks];
      const [removed] = updatedTasks.splice(startIndex, 1);
      updatedTasks.splice(endIndex, 0, removed);
      
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      set({ tasks: updatedTasks });
    },

    taskDropOnIndex: (draggedId, targetId) => {
      const { tasks } = get();
      const draggedIndex = tasks.findIndex(t => t.id === draggedId);
      const targetIndex = tasks.findIndex(t => t.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return;

      const updatedTasks = [...tasks];
      const [removed] = updatedTasks.splice(draggedIndex, 1);
      updatedTasks.splice(targetIndex, 0, removed);

      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      set({ tasks: updatedTasks });
    },

    toggleTaskSelection: (id) => set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(id)
        ? state.selectedTaskIds.filter(tid => tid !== id)
        : [...state.selectedTaskIds, id]
    })),

    clearTaskSelection: () => set({ selectedTaskIds: [] }),

    deleteSelectedTasks: () => {
      const { selectedTaskIds, tasks } = get();
      if (selectedTaskIds.length === 0) return;
      
      const updatedTasks = tasks.filter(t => !selectedTaskIds.includes(t.id));
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      
      set({ tasks: updatedTasks, selectedTaskIds: [] });
    },

    bulkCompleteSelected: () => {
      const { selectedTaskIds, tasks } = get();
      if (selectedTaskIds.length === 0) return;

      const updatedTasks = tasks.map(t => 
        selectedTaskIds.includes(t.id) ? { ...t, completed: true } : t
      );

      // Check if all are now completed
      const pendingCount = updatedTasks.filter(t => !t.completed).length;
      if (pendingCount === 0 && updatedTasks.length > 0) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      set({ tasks: updatedTasks, selectedTaskIds: [] });
    },

    bulkDeleteCompleted: () => {
      const { tasks } = get();
      const completedIds = tasks.filter(t => t.completed).map(t => t.id);
      if (completedIds.length === 0) return;

      const updatedTasks = tasks.filter(t => !t.completed);
      localStorage.setItem("todo_tasks", JSON.stringify(updatedTasks));
      
      set({ 
        tasks: updatedTasks, 
        selectedTaskIds: get().selectedTaskIds.filter(id => !completedIds.includes(id)) 
      });
    },

    getTheme: () => {
      return THEMES[get().themePreset];
    },

    getStats: (): TaskStats => {
      const { tasks } = get();
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return { total, completed, pending, productivity };
    },

    // Pomodoro Actions
    tickPomodoro: () => {
      const { pomodoro } = get();
      if (!pomodoro.isActive) return;

      if (pomodoro.seconds > 0) {
        set({
          pomodoro: { ...pomodoro, seconds: pomodoro.seconds - 1 }
        });
      } else if (pomodoro.minutes > 0) {
        set({
          pomodoro: { ...pomodoro, minutes: pomodoro.minutes - 1, seconds: 59 }
        });
      } else {
        // Timer reached 00:00
        const isCompletedWork = pomodoro.mode === 'work';
        const nextMode = isCompletedWork ? 'break' : 'work';
        const nextMinutes = nextMode === 'work' ? 25 : 5;
        
        try {
          // Play a gentle notification chime
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(isCompletedWork ? 880 : 660, audioCtx.currentTime); // A5 or E5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 1);
        } catch (e) {
          console.log("Audio feedback error:", e);
        }

        // Show a brief completed message & notify
        confetti({
          particleCount: 50,
          spread: 40,
          colors: isCompletedWork ? ['#8b5cf6', '#3b82f6'] : ['#10b981', '#14b8a6']
        });

        set({
          pomodoro: {
            minutes: nextMinutes,
            seconds: 0,
            isActive: false, // pause for mode change
            mode: nextMode,
            completedSessions: isCompletedWork 
              ? pomodoro.completedSessions + 1 
              : pomodoro.completedSessions
          }
        });
      }
    },

    togglePomodoroActive: () => {
      const { pomodoro } = get();
      set({
        pomodoro: { ...pomodoro, isActive: !pomodoro.isActive }
      });
    },

    resetPomodoro: () => {
      const { pomodoro } = get();
      set({
        pomodoro: {
          ...pomodoro,
          minutes: pomodoro.mode === 'work' ? 25 : 5,
          seconds: 0,
          isActive: false
        }
      });
    },

    setPomodoroMode: (mode) => {
      set((state) => ({
        pomodoro: {
          ...state.pomodoro,
          mode,
          minutes: mode === 'work' ? 25 : 5,
          seconds: 0,
          isActive: false
        }
      }));
    }
  };
});
