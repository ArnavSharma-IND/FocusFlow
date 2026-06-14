import { useAppStore, THEMES } from "../store";
import { Download, Upload, Palette, Keyboard, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import React, { useState, useRef } from "react";
import { ThemePreset } from "../types";

export default function SettingsView() {
  const { 
    themePreset, 
    setThemePreset, 
    tasks, 
    addMultipleTasks, 
    categories,
    getTheme 
  } = useAppStore();

  const theme = getTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Export Tasks as JSON
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "focusflow_tasks_export.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export JSON failed:", e);
    }
  };

  // Export Tasks as CSV
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      // Headers
      csvContent += "ID,Completed,Title,Description,Priority,Category,DueDate,CreatedAt\n";
      
      // Rows
      tasks.forEach((t) => {
        const row = [
          t.id,
          t.completed ? "TRUE" : "FALSE",
          `"${t.title.replace(/"/g, '""')}"`,
          `"${(t.description || "").replace(/"/g, '""')}"`,
          t.priority,
          t.category,
          t.dueDate || "",
          new Date(t.createdAt).toISOString()
        ].join(",");
        csvContent += row + "\n";
      });

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", "focusflow_tasks_export.csv");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export CSV failed:", e);
    }
  };

  // Import Tasks from JSON File
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Validate structure
          const validTasks = parsed.map((item: any) => {
            if (typeof item.title !== 'string') throw new Error("Invalid Task title");
            return {
              title: item.title,
              description: typeof item.description === 'string' ? item.description : "",
              priority: (item.priority === 'high' || item.priority === 'low') ? item.priority : 'medium' as const,
              category: typeof item.category === 'string' ? item.category : "General",
              dueDate: typeof item.dueDate === 'string' ? item.dueDate : ""
            };
          });

          addMultipleTasks(validTasks);
          setImportStatus(`Success! Imported ${validTasks.length} objectives task entries.`);
        } else {
          throw new Error("JSON is not an array format");
        }
      } catch (err) {
        setImportStatus("Import failed: Please upload a valid exported backup JSON file.");
        console.error("Import JSON failed:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 1. Theme Configuration section */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-base font-sans font-black text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-400" />
          Theme Workspace Presets
        </h3>
        <p className="text-xs text-slate-400">Transform your workspace environment with premium layouts.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {Object.values(THEMES).map((preset) => {
            const isSelected = themePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setThemePreset(preset.id as ThemePreset)}
                className={`p-4 rounded-xl border relative text-left transition-all hover:scale-[1.01] flex items-center justify-between gap-4 cursor-pointer
                  ${isSelected
                    ? 'bg-white/10 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                    : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
              >
                <div>
                  <h4 className="text-xs font-sans font-bold text-white">{preset.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Click to align color scheme</p>
                </div>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${preset.primaryGradient} border-2 border-white/10 shrink-0 flex items-center justify-center`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Export / Import Backup Center */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-base font-sans font-black text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          Backup Storage Center
        </h3>
        <p className="text-xs text-slate-400">Save off-line task backups or export your summaries.</p>

        {/* Buttons Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-sans font-bold text-white bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Save as JSON Backup
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-sans font-bold text-white bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export as CSV Spreadsheet
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-sans font-bold text-white bg-gradient-to-r ${theme.primaryGradient} shadow cursor-pointer`}
          >
            <Upload className="w-4 h-4" />
            Upload JSON Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
        </div>

        {importStatus && (
          <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-300 font-sans border border-white/10">
            {importStatus}
          </div>
        )}
      </div>

      {/* 3. Keyboard Shortcut Helper */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-base font-sans font-black text-white flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-amber-400" />
          Accessibility Shortcuts
        </h3>
        <p className="text-xs text-slate-400">Maximize speed and comfort using keyboard inputs.</p>
        
        <div className="space-y-2 font-mono text-[11px] text-slate-300">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
            <span>Open Quick Task Creator</span>
            <kbd className="px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-slate-400">Alt + N</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
            <span>Toggle Focus / Break Timer</span>
            <kbd className="px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-slate-400">Alt + P</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
            <span>Clear Checked Filters</span>
            <kbd className="px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-slate-400">Alt + C</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
