import { Sparkles, Loader2, Plus, RefreshCw, AlertCircle, Check } from "lucide-react";
import { useAppStore } from "../store";
import { useState } from "react";
import { Task } from "../types";

interface SuggestedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export default function SmartSuggestions() {
  const { tasks, addTask, getTheme } = useAppStore();
  const theme = getTheme();

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [addedIndexes, setAddedIndexes] = useState<number[]>([]);

  // Local productivity coach backup suggestions to handle offline/no-keys states gracefully
  const getOfflineSuggestions = (): SuggestedTask[] => {
    return [
      {
        title: "Structure Daily Priorities",
        description: "Spend 5 minutes drafting your golden three high-focus objectives for maximum attention alignment.",
        priority: "medium",
        category: "Work"
      },
      {
        title: "Clean Workspace Audit",
        description: "Tidy up your physical desk and desktop folders to declutter visual attention limits.",
        priority: "low",
        category: "Personal"
      },
      {
        title: "Diaphragmatic Breathing",
        description: "Perform 10 rounds of slow box-breathing pattern (4s inhale, 4s hold, 4s exhale, 4s hold) to recharge bio-energy.",
        priority: "low",
        category: "Health"
      }
    ];
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setErrorStr(null);
    setAddedIndexes([]);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTasks: tasks })
      });

      if (!response.ok) {
        throw new Error("API call returned failure status");
      }

      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error("Incorrect response structure");
      }
    } catch (err: any) {
      console.warn("AI suggestion server failed, falling back to client-side productivity suggestions:", err);
      // Fallback gracefully
      setSuggestions(getOfflineSuggestions());
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = (item: SuggestedTask, index: number) => {
    addTask({
      title: item.title,
      description: item.description,
      priority: item.priority,
      category: item.category,
      dueDate: new Date().toISOString().split('T')[0] // Set due date as today
    });
    setAddedIndexes([...addedIndexes, index]);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4 relative overflow-hidden">
      {/* Visual glowing frame background */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-xl rounded-full" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-black text-white">AI Coach Suggestions</h3>
            <p className="text-xs text-slate-400">Get custom objectives generated for your workflow</p>
          </div>
        </div>
        
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-bold text-white bg-gradient-to-r ${theme.primaryGradient} shadow-md shadow-indigo-500/10 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Consult Coach
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Consulting AI model credentials...</p>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="py-8 text-center text-slate-400 text-xs">
          <p>No coach suggestions listed. Click **Consult Coach** above to start.</p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, index) => {
            const isAdded = addedIndexes.includes(index);
            
            // Priority styling
            const colorClass = 
              item.priority === 'high' ? 'bg-rose-500/15 text-rose-400' :
              item.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
              'bg-emerald-500/15 text-emerald-400';

            return (
              <div
                key={index}
                className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-indigo-500/20 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400">
                      {item.category}
                    </span>
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${colorClass}`}>
                      {item.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-sans font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>

                <button
                  onClick={() => handleAddTask(item, index)}
                  disabled={isAdded}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all flex items-center justify-center gap-1.5
                    ${isAdded
                      ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                      : 'bg-white/5 text-white hover:bg-white/10 active:scale-98 cursor-pointer'
                    }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Added to list
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Adopt task
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
