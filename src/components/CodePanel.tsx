import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  HelpCircle, 
  Code2, 
  Type, 
  Palette, 
  Maximize2, 
  Sparkles,
  Settings,
  Info
} from 'lucide-react';
import { AnalysisMode } from '../types';
import { LANGUAGES, MODES } from '../constants';

interface CodePanelProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  activeMode: AnalysisMode;
  isLoading: boolean;
  onAnalyze: () => void;
  darkMode: boolean;
}

export default function CodePanel({
  code,
  setCode,
  language,
  setLanguage,
  activeMode,
  isLoading,
  onAnalyze,
  darkMode
}: CodePanelProps) {
  
  const currentLanguageOption = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
  const activeModeConfig = MODES.find(m => m.id === activeMode) || MODES[0];

  // Editor configuration states
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('editor_font_size');
    return saved ? parseInt(saved, 10) : 13;
  });

  const [editorTheme, setEditorTheme] = useState<string>(() => {
    const saved = localStorage.getItem('editor_theme');
    if (saved) return saved;
    return darkMode ? 'vs-dark' : 'light';
  });

  // Sync editor theme with app dark mode if user has not set a specific custom override
  useEffect(() => {
    const saved = localStorage.getItem('editor_theme');
    if (!saved) {
      setEditorTheme(darkMode ? 'vs-dark' : 'light');
    }
  }, [darkMode]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const selectedOption = LANGUAGES.find(l => l.value === value);
    if (selectedOption) {
      setCode(selectedOption.defaultSnippet);
    }
  };

  const loadDefaultSnippet = () => {
    setCode(currentLanguageOption.defaultSnippet);
  };

  const handleThemeChange = (newTheme: string) => {
    setEditorTheme(newTheme);
    localStorage.setItem('editor_theme', newTheme);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('editor_font_size', newSize.toString());
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-full shadow-md overflow-hidden transition-all duration-200">
      
      {/* Editor Controls Bar */}
      <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        
        {/* Left Side: Language selector and Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Code2 className="w-4 h-4" />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Language</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-xs font-bold text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none cursor-pointer transition-all shadow-sm"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Theme, Font Size and Reset option */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Theme Dropdown */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            <select
              aria-label="Editor Theme"
              value={editorTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none cursor-pointer"
            >
              <option value="vs-dark">VS Dark</option>
              <option value="light">VS Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <Type className="w-3.5 h-3.5 text-zinc-400" />
            <select
              aria-label="Editor Font Size"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none cursor-pointer"
            >
              {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Reset Template */}
          <button
            onClick={loadDefaultSnippet}
            className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-900/40"
            title="Reload default snippet"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Editor Stage */}
      <div className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-950/40 relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme={editorTheme}
          loading={
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-xs font-mono">Mounting Monaco editor...</span>
            </div>
          }
          options={{
            fontSize: fontSize,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12, bottom: 12 },
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: {
              enabled: true
            }
          }}
        />

        {/* Quick Autocomplete floating visual hint */}
        <div className="absolute bottom-3 right-3 z-10 bg-zinc-950/80 text-zinc-200 border border-zinc-800 rounded-lg py-1 px-2.5 flex items-center gap-1.5 text-[10px] pointer-events-none backdrop-blur-sm">
          <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>Press <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-white text-[9px]">Ctrl+Space</kbd> for smart autocomplete</span>
        </div>
      </div>

      {/* Execute Trigger Tray */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-4 shrink-0">
        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
          <span className="hidden sm:inline">Modify code and trigger Gemini models for rich MVC results.</span>
          <span className="sm:hidden">Press Analyze to query Gemini.</span>
        </div>

        <button
          onClick={onAnalyze}
          disabled={isLoading || !code.trim()}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-md transition-all ${
            isLoading || !code.trim()
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/15 hover:shadow-violet-500/30 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{activeModeConfig.actionText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
