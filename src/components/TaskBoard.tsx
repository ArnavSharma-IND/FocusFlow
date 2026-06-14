import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import { Task, Priority } from "../types";
import { 
  Plus, Search, Filter, ArrowUpDown, Trash, AlertTriangle, Calendar, Tag, Check, Sparkles, Mic, MicOff, Loader2, Play, CircleHelp, Archive, MoreVertical, Undo, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function TaskBoard() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion, 
    categories, 
    lastDeletedTask, 
    undoDelete,
    taskDropOnIndex,
    selectedTaskIds,
    toggleTaskSelection,
    clearTaskSelection,
    deleteSelectedTasks,
    bulkCompleteSelected,
    bulkDeleteCompleted,
    getTheme,
    searchQuery
  } = useAppStore();

  const theme = getTheme();

  // Dialog/Modal UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // New task inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Active filters & sorting states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'deadline'>('newest');

  // Voice Inputs states
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [voiceAiLoading, setVoiceAiLoading] = useState(false);
  const [voiceSupportError, setVoiceSupportError] = useState("");
  const recognitionRef = useRef<any>(null);

  // Undo delete notification banner
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  useEffect(() => {
    if (lastDeletedTask) {
      setShowUndoBanner(true);
      const timer = setTimeout(() => setShowUndoBanner(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastDeletedTask]);

  // Speech Recognition API detection
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechTranscript("");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        setVoiceSupportError(`Mic error: ${event.error}`);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = async (event: any) => {
         const resultText = event.results[0][0].transcript;
         setSpeechTranscript(resultText);
         if (resultText.trim()) {
           await handleVoiceAction(resultText);
         }
      };

      recognitionRef.current = rec;
    } else {
      setVoiceSupportError("Web Speech API not supported in this browser. Try Chrome/Safari.");
    }
  }, []);

  const startVoiceRecording = () => {
    setVoiceSupportError("");
    if (!recognitionRef.current) {
      setVoiceSupportError("Voice engine not supported on this platform.");
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      recognitionRef.current.stop();
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Dispatch raw voice inputs transcript toast server-side helper model
  const handleVoiceAction = async (spokenText: string) => {
    setVoiceAiLoading(true);
    try {
      const localDateStr = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      const response = await fetch("/api/ai/parse-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: spokenText, localDateStr })
      });

      if (!response.ok) {
        throw new Error("Voice AI service returned error");
      }

      const data = await response.json();
      if (data.task) {
        addTask({
          title: data.task.title,
          description: data.task.description || "Voice inputted bullet",
          dueDate: data.task.dueDate,
          priority: data.task.priority,
          category: data.task.category
        });
      }
    } catch (error) {
      console.warn("AI parsing voice failed, adding transcript as a plain task:", error);
      // fallback
      addTask({
        title: spokenText,
        description: "Added quickly via voice",
        dueDate: "",
        priority: "medium",
        category: "General"
      });
    } finally {
      setVoiceAiLoading(false);
    }
  };

  // Add normal task submit
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = showCustomCatInput && newCustomCategory.trim() 
      ? newCustomCategory.trim() 
      : category;

    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: finalCategory,
      dueDate
    });

    // Reset fields & close
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("General");
    setDueDate("");
    setNewCustomCategory("");
    setShowCustomCatInput(false);
    setShowAddModal(false);
  };

  // Edit task setup
  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate);
    setShowAddModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !title.trim()) return;

    const finalCategory = showCustomCatInput && newCustomCategory.trim() 
      ? newCustomCategory.trim() 
      : category;

    updateTask({
      ...editingTask,
      title: title.trim(),
      description: description.trim(),
      priority,
      category: finalCategory,
      dueDate
    });

    // Reset & close
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("General");
    setDueDate("");
    setNewCustomCategory("");
    setShowCustomCatInput(false);
    setShowAddModal(false);
  };

  // Drag and drop events logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId !== targetId) {
      taskDropOnIndex(draggedId, targetId);
    }
  };

  // Sort & filter actual pipeline
  const filteredTasks = tasks.filter(t => {
    // 1. Search Query Match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === "" || 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) || 
      t.category.toLowerCase().includes(q);

    // 2. Status Match
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && !t.completed) ||
      (statusFilter === 'completed' && t.completed);

    // 3. Priority Match
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    // 4. Category Match
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'newest') return b.createdAt - a.createdAt;
    if (sortBy === 'oldest') return a.createdAt - b.createdAt;
    
    if (sortBy === 'priority') {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    
    if (sortBy === 'deadline') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search and Voice HUD Panel */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* State Filter Controls */}
        <div className="flex bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/5 p-1 rounded-xl self-start">
          {(['all', 'pending', 'completed'] as const).map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-4 py-2 text-xs font-sans font-bold capitalize rounded-lg transition-all cursor-pointer
                ${statusFilter === stat
                  ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {stat}
            </button>
          ))}
        </div>

        {/* Action triggers: Quick Add & voice trigger */}
        <div className="flex items-center gap-2">
          {/* Voice Input Trigger */}
          <div className="relative">
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-sans font-bold cursor-pointer transition-all
                ${isRecording 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse' 
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
            >
              {isRecording ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isRecording ? "Listening..." : "Add by Voice"}
              </span>
            </button>
            {voiceSupportError && (
              <div className="absolute right-0 top-12 bg-slate-900 border border-rose-500/30 text-rose-400 text-[10px] rounded-lg px-2.5 py-1 z-50 whitespace-nowrap shadow-xl">
                {voiceSupportError}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setShowAddModal(true);
            }}
            className={`px-5 py-3 rounded-xl font-sans font-bold text-xs text-white bg-gradient-to-r ${theme.primaryGradient} shadow-lg shadow-indigo-500/10 hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2 cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Voice Transcript Progress Overlay */}
      {voiceAiLoading && (
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center gap-3 text-xs text-indigo-400 animate-pulse">
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
          <span>Processing voice transcript with AI Coach. Extracting title, category and deadlines...</span>
        </div>
      )}

      {/* Multi sorting & filters toolbar row */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-[#050508] border border-white/10 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all" className="bg-[#050508] text-white">Any Priority</option>
            <option value="low" className="bg-[#050508] text-white">Low Priority</option>
            <option value="medium" className="bg-[#050508] text-white">Medium Priority</option>
            <option value="high" className="bg-[#050508] text-white">High Priority</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#050508] border border-white/10 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all" className="bg-[#050508] text-white">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#050508] text-white">{cat}</option>
            ))}
          </select>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#050508] border border-white/10 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="newest" className="bg-[#050508] text-white">Newest First</option>
            <option value="oldest" className="bg-[#050508] text-white">Oldest First</option>
            <option value="priority" className="bg-[#050508] text-white">Priority Heavy</option>
            <option value="deadline" className="bg-[#050508] text-white">Upcoming deadlines</option>
          </select>
        </div>
      </div>

      {/* Multi-Select Bulk Actions Strip */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs text-indigo-300 animate-in slide-in-from-top-2 duration-300">
          <span>Selected <strong>{selectedTaskIds.length}</strong> task(s)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkCompleteSelected}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-white font-sans font-semibold cursor-pointer"
            >
              Solve Checked
            </button>
            <button
              onClick={deleteSelectedTasks}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-300 font-sans font-semibold cursor-pointer"
            >
              Discard Select
            </button>
            <button
              onClick={clearTaskSelection}
              className="text-slate-400 hover:text-white px-2 py-1 font-mono text-[10px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Undo deleted actions popups */}
      {showUndoBanner && lastDeletedTask && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Trash className="w-4 h-4 text-amber-400" />
            <span>Task <strong>"{lastDeletedTask.task.title}"</strong> was removed.</span>
          </div>
          <button
            onClick={() => {
              undoDelete();
              setShowUndoBanner(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-white rounded-lg text-xs font-sans font-bold cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      )}

      {/* TASK LIST WRAPPER */}
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {filteredTasks.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Check className="w-10 h-10 text-slate-500 mx-auto opacity-35 bg-slate-900 rounded-full p-2" />
              <h4 className="text-sm font-sans font-semibold text-slate-400">All objectives solved or matching nothing.</h4>
              <p className="text-xs text-slate-500 font-sans">Toggle status, priority selectors, or quick type details.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              
              // Resolve Priority styling
              const priorityStyles = 
                task.priority === 'high' 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : task.priority === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              return (
                <motion.div
                  key={task.id}
                  layoutId={`task-${task.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, task.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 relative overflow-hidden group cursor-grab active:cursor-grabbing select-none
                    ${task.completed 
                      ? 'bg-slate-900/25 border-white/5 opacity-55' 
                      : isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/25'
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Item check box selection */}
                    <div className="flex items-center gap-2 self-center shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white/5 text-indigo-600 focus:ring-opacity-50"
                      />
                      
                      {/* Check box resolved/unresolved */}
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer
                          ${task.completed
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'border-white/15 hover:border-indigo-400 hover:bg-indigo-500/10 text-transparent hover:text-indigo-400'
                          }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className={`text-sm font-sans font-bold leading-snug truncate text-slate-800 dark:text-white
                        ${task.completed ? 'line-through text-slate-500' : ''}`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className={`text-xs text-slate-400 leading-normal line-clamp-2
                          ${task.completed ? 'line-through opacity-60' : ''}`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Display elements: Priority, tagging category and due date */}
                      <div className="flex flex-wrap gap-2 items-center pt-1 text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-bold tracking-wider ${priorityStyles}`}>
                          {task.priority} Priority
                        </span>
                        
                        <span className="flex items-center gap-1 text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" />
                          {task.category}
                        </span>

                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-amber-300 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full">
                            <Calendar className="w-2.5 h-2.5" />
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 relative">
                    <button
                      onClick={() => handleStartEdit(task)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Edit objective"
                    >
                      <Plus className="w-4 h-4 rotate-45" /> {/* Use Plus rotated for classic symbol or just default */}
                    </button>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Discard objective"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ADD / EDIT MODAL DRAWER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-sans font-black text-white mb-4">
              {editingTask ? "Update Active Objective" : "Formulate New Goal"}
            </h3>

            <form onSubmit={editingTask ? handleSaveEdit : handleAddNewTask} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Objective Header *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conduct systems design review"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Description / Directives</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the task directions..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Priority, due date, category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Resolution Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="low" className="bg-[#050508] text-white">Low priority (Green)</option>
                    <option value="medium" className="bg-[#050508] text-white">Medium priority (Orange)</option>
                    <option value="high" className="bg-[#050508] text-white">High priority (Red)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Due Deadline</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-400">Tag Classification</label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    {showCustomCatInput ? "Use Preset" : "+ New Tag"}
                  </button>
                </div>

                {showCustomCatInput ? (
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="Create a custom category name..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/30"
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#050508] text-white">{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Controls bar */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-sans font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-xl text-xs font-sans font-bold shadow-md cursor-pointer`}
                >
                  {editingTask ? "Save Details" : "Launch Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
