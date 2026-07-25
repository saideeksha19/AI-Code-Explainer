import { motion } from 'motion/react';
import { 
  BookOpen, 
  Zap, 
  MessageSquareText, 
  Bug, 
  Languages, 
  Trash2, 
  History, 
  Sparkles, 
  Code2,
  AlertTriangle,
  FileText,
  TestTube,
  Eye,
  Activity,
  Clock,
  Database,
  Wrench
} from 'lucide-react';
import { AnalysisMode, AnalysisHistoryItem } from '../types';
import { MODES } from '../constants';

interface SidebarProps {
  activeMode: AnalysisMode;
  setActiveMode: (mode: AnalysisMode) => void;
  history: AnalysisHistoryItem[];
  onSelectHistory: (item: AnalysisHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  onNewSession: () => void;
}

export default function Sidebar({
  activeMode,
  setActiveMode,
  history,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onNewSession
}: SidebarProps) {
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'MessageSquareText': return <MessageSquareText className="w-4 h-4" />;
      case 'Bug': return <Bug className="w-4 h-4" />;
      case 'Languages': return <Languages className="w-4 h-4" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'TestTube': return <TestTube className="w-4 h-4" />;
      case 'Eye': return <Eye className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Clock': return <Clock className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <aside className="w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-500/10">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
              Copilot Chat
            </h1>
            <span className="text-[10px] text-zinc-400 font-mono">AI Code Explainer</span>
          </div>
        </div>
        <button
          onClick={onNewSession}
          title="New Explainer Session"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-violet-500" />
        </button>
      </div>

      {/* Feature Navigation */}
      <div className="p-4 flex-col gap-1 flex">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-2 block">
          Tools
        </span>
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all relative ${
                isActive 
                  ? 'text-zinc-950 dark:text-white font-semibold' 
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-mode-bg"
                  className="absolute inset-0 bg-violet-50 dark:bg-violet-950/20 rounded-xl -z-10 border border-violet-100/50 dark:border-violet-900/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`p-1.5 rounded-lg ${
                isActive 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}>
                {getIcon(mode.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate leading-tight">{mode.title}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5 font-normal">
                  {mode.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Execution History */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
            <History className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </div>
          {history.length > 0 && (
            <button 
              onClick={onClearHistory}
              className="text-[11px] text-zinc-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
              <History className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No history yet</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Your code analyses will be saved here</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-2 w-full p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-violet-100 dark:hover:border-violet-900/30 hover:bg-white dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                onClick={() => onSelectHistory(item)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded">
                      {item.language}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                    {item.code.replace(/\s+/g, ' ').substring(0, 45)}...
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistory(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
