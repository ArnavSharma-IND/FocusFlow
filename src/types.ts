export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD or empty string
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  createdAt: number;
}

export type Priority = 'low' | 'medium' | 'high';

export interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  mode: 'work' | 'break';
  completedSessions: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  productivity: number; // percentage
}

export type ThemePreset = 'royal' | 'emerald' | 'cyberpunk' | 'sunset' | 'slate';

export interface AppTheme {
  id: ThemePreset;
  name: string;
  primaryGradient: string; // e.g., "from-violet-500 to-indigo-600"
  bgGradient: string;      // dark mode outer bg
  accentColor: string;     // color utility highlight
  cardBg: string;          // glass card background
  textColor: string;       // primary text
}
