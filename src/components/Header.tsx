import { Sun, Moon, RotateCcw, User, Globe, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { AnalysisMode } from '../types';
import { MODES } from '../constants';

interface HeaderProps {
  activeMode: AnalysisMode;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  onReset: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  user: any;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  showSecurityReport: boolean;
  onToggleSecurityReport: () => void;
  showAdminDashboard: boolean;
  onToggleAdminDashboard: () => void;
}

const TARGET_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' }
];

export default function Header({
  activeMode,
  targetLanguage,
  setTargetLanguage,
  onReset,
  darkMode,
  setDarkMode,
  user,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  showSecurityReport,
  onToggleSecurityReport,
  showAdminDashboard,
  onToggleAdminDashboard
}: HeaderProps) {
  
  const currentModeConfig = MODES.find(m => m.id === activeMode) || MODES[0];

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between shrink-0">
      {/* Active Mode Info */}
      <div className="flex items-center gap-4 flex-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {currentModeConfig.title}
            </h2>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md truncate">
            {currentModeConfig.description}
          </p>
        </div>

        {/* Dynamic target language selector for conversion mode */}
        {activeMode === 'convert' && (
          <div className="ml-6 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-3 py-1.5 animate-in slide-in-from-left-2 duration-300">
            <Globe className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Convert to:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-950 dark:text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              {TARGET_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Security Report Hub Trigger */}
        <button
          onClick={onToggleSecurityReport}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            showSecurityReport
              ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
              : 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:text-rose-700 dark:hover:text-rose-300 border-rose-100 dark:border-rose-950/40'
          }`}
          title="Open Security Remediation Hub"
        >
          <ShieldAlert className={`w-3.5 h-3.5 ${showSecurityReport ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`} />
          <span>Security Report</span>
        </button>

        {/* Reset Action */}
        <button
          onClick={onReset}
          title="Reset Code & Output"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-violet-600" />
          )}
        </button>

        {/* Auth Trigger Buttons */}
        <div className="flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Clickable Profile details trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 text-left hover:opacity-85 transition-all focus:outline-none"
                title="View Profile & Security Settings"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/10 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                    {user.name}
                  </p>
                  <span className="text-[9px] font-mono font-extrabold uppercase text-violet-600 dark:text-violet-400 mt-0.5 block tracking-wider">
                    {user.role || 'developer'}
                  </span>
                </div>
              </button>

              {/* Admin Panel Toggle (Admins Only) */}
              {user.role === 'admin' && (
                <button
                  onClick={onToggleAdminDashboard}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all shrink-0 ${
                    showAdminDashboard
                      ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-400'
                      : 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-800 text-violet-600 dark:text-violet-400'
                  }`}
                  title="Toggle Admin IAM Dashboard"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-violet-500" />
                  <span className="hidden sm:inline">Admin Console</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-violet-500/10 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
