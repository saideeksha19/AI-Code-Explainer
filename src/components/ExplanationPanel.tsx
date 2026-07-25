import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Terminal, 
  Download, 
  Lightbulb, 
  Cpu, 
  Bookmark,
  ChevronDown,
  ChevronUp,
  Bug,
  ShieldAlert,
  Activity,
  HelpCircle,
  Code2,
  CheckCircle,
  TrendingUp,
  Flame,
  Clock,
  Layers,
  BookOpen,
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ExplanationPanelProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  language: string;
  setCode?: (code: string) => void;
}

const LOADING_STATUSES = [
  "Parsing code structure & AST...",
  "Consulting Gemini developer models...",
  "Evaluating Time & Space complexities...",
  "Scanning for logical bugs & edge cases...",
  "Checking security risks & mitigation...",
  "Synthesizing line-by-line explanation...",
  "Running execution simulation dry run...",
  "Formulating technical interview prep..."
];

// Helper to determine complexity color and progress
const getComplexityDetails = (complexity: string) => {
  const comp = complexity.toLowerCase().replace(/\s+/g, '');
  if (comp.includes('o(1)')) {
    return { percent: 100, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Constant Time (Optimal)' };
  }
  if (comp.includes('o(logn)')) {
    return { percent: 90, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600 dark:text-cyan-400', label: 'Logarithmic Time (Highly Efficient)' };
  }
  if (comp.includes('o(n)') && !comp.includes('logn')) {
    return { percent: 75, color: 'from-teal-500 to-emerald-400', bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-600 dark:text-teal-400', label: 'Linear Time (Efficient)' };
  }
  if (comp.includes('o(nlogn)') || comp.includes('o(n*logn)')) {
    return { percent: 60, color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', label: 'Linearithmic Time (Moderate)' };
  }
  if (comp.includes('o(n^2)') || comp.includes('o(n2)')) {
    return { percent: 40, color: 'from-orange-500 to-rose-400', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', label: 'Quadratic Time (Sub-optimal)' };
  }
  if (comp.includes('o(2^n)') || comp.includes('o(n!)') || comp.includes('exponential')) {
    return { percent: 20, color: 'from-rose-600 to-red-500', bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400', label: 'Exponential Time (Expensive)' };
  }
  return { percent: 55, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-600 dark:text-violet-400', label: 'Determined Complexity' };
};

const cleanBigO = (comp: string) => {
  if (!comp) return "O(1)";
  const trimmed = comp.trim();
  const parts = trimmed.split(':');
  return parts[0].trim();
};

const getComplexityCategory = (complexity: string): 'constant' | 'logarithmic' | 'linear' | 'linearithmic' | 'quadratic' | 'exponential' | 'unknown' => {
  const comp = complexity.toLowerCase().replace(/\s+/g, '');
  if (comp.includes('o(1)')) return 'constant';
  if (comp.includes('o(logn)')) return 'logarithmic';
  if (comp.includes('o(nlogn)') || comp.includes('o(n*logn)')) return 'linearithmic';
  if (comp.includes('o(n)') && !comp.includes('logn')) return 'linear';
  if (comp.includes('o(n^2)') || comp.includes('o(n2)')) return 'quadratic';
  if (comp.includes('o(2^n)') || comp.includes('o(n!)') || comp.includes('exponential')) return 'exponential';
  return 'unknown';
};

interface ComplexityChartProps {
  best: string;
  average: string;
  worst: string;
}

function ComplexityChart({ best, average, worst }: ComplexityChartProps) {
  const [inputN, setInputN] = useState<number>(50);

  const bestCat = getComplexityCategory(best);
  const avgCat = getComplexityCategory(average);
  const worstCat = getComplexityCategory(worst);

  // Constants for coordinate mapping in SVG
  const width = 420;
  const height = 200;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const mapX = (n: number) => paddingLeft + (n / 100) * (width - paddingLeft - paddingRight);
  const mapY = (val: number) => {
    // scale max value to 1000
    const clamped = Math.min(val, 1000);
    return height - paddingBottom - (clamped / 1000) * (height - paddingTop - paddingBottom);
  };

  const calculateYValue = (category: string, n: number) => {
    switch (category) {
      case 'constant':
        return 35; // flat line
      case 'logarithmic':
        return Math.log2(n + 1) * 35;
      case 'linear':
        return n * 6.5;
      case 'linearithmic':
        return n * Math.log2(n + 1) * 1.3;
      case 'quadratic':
        return (n * n) * 0.15;
      case 'exponential':
        return Math.pow(1.5, n / 3.5) * 2;
      default:
        return n * 6.5; // fallback to linear
    }
  };

  const getPointsForCategory = (category: string) => {
    const points = [];
    for (let n = 1; n <= 100; n += 2) {
      const val = calculateYValue(category, n);
      points.push({ x: mapX(n), y: mapY(val), n, val });
    }
    return points;
  };

  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  };

  const bestPoints = getPointsForCategory(bestCat);
  const avgPoints = getPointsForCategory(avgCat);
  const worstPoints = getPointsForCategory(worstCat);

  const bestValAtN = Math.round(calculateYValue(bestCat, inputN));
  const avgValAtN = Math.round(calculateYValue(avgCat, inputN));
  const worstValAtN = Math.round(calculateYValue(worstCat, inputN));

  const formatOps = (ops: number) => {
    if (ops >= 100000) return `${(ops / 1000).toFixed(0)}k+ ops`;
    if (ops >= 1000) return `${ops.toLocaleString()} ops`;
    return `${ops} ops`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Background Grid Lines */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              {/* Vertical grids */}
              <line 
                x1={mapX(tick)} 
                y1={paddingTop} 
                x2={mapX(tick)} 
                y2={height - paddingBottom} 
                className="stroke-zinc-100 dark:stroke-zinc-800/60" 
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Horizontal grids */}
              <line 
                x1={paddingLeft} 
                y1={mapY((tick / 100) * 1000)} 
                x2={width - paddingRight} 
                y2={mapY((tick / 100) * 1000)} 
                className="stroke-zinc-100 dark:stroke-zinc-800/60" 
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          ))}

          {/* X & Y Axis Lines */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            className="stroke-zinc-200 dark:stroke-zinc-800" 
            strokeWidth="1.5"
          />
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={height - paddingBottom} 
            className="stroke-zinc-200 dark:stroke-zinc-800" 
            strokeWidth="1.5"
          />

          {/* Tick Labels */}
          <text x={paddingLeft} y={height - 8} className="fill-zinc-400 font-mono text-[9px] text-left">N=0</text>
          <text x={mapX(50)} y={height - 8} className="fill-zinc-400 font-mono text-[9px] text-middle" textAnchor="middle">N=50</text>
          <text x={mapX(100)} y={height - 8} className="fill-zinc-400 font-mono text-[9px] text-right" textAnchor="end">N=100</text>

          <text x={10} y={paddingTop + 5} className="fill-zinc-400 font-mono text-[9px] rotate-270" textAnchor="middle" transform={`rotate(-90 10 ${paddingTop + 5})`}>Operations</text>

          {/* Plotted Paths */}
          <path 
            d={getPathD(bestPoints)} 
            fill="none" 
            className="stroke-emerald-500" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d={getPathD(avgPoints)} 
            fill="none" 
            className="stroke-blue-500" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d={getPathD(worstPoints)} 
            fill="none" 
            className="stroke-rose-500" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Interactive Line & Dots indicator */}
          <line 
            x1={mapX(inputN)} 
            y1={paddingTop} 
            x2={mapX(inputN)} 
            y2={height - paddingBottom} 
            className="stroke-violet-500/50 dark:stroke-violet-400/40" 
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Dots on the curves at inputN */}
          <circle cx={mapX(inputN)} cy={mapY(calculateYValue(bestCat, inputN))} r="5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
          <circle cx={mapX(inputN)} cy={mapY(calculateYValue(avgCat, inputN))} r="6" className="fill-blue-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
          <circle cx={mapX(inputN)} cy={mapY(calculateYValue(worstCat, inputN))} r="5" className="fill-rose-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Control Panel / Slider & Readouts */}
      <div className="border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Configure Input Scale</span>
            <span className="px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-mono font-bold">N = {inputN}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={inputN} 
            onChange={(e) => setInputN(parseInt(e.target.value))}
            className="w-full sm:w-44 accent-violet-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-150/60 dark:border-zinc-800/40">
          <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-2 rounded-xl border border-emerald-500/10">
            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Best Case</div>
            <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-1">{formatOps(bestValAtN)}</div>
          </div>
          <div className="bg-blue-50/20 dark:bg-blue-950/10 p-2 rounded-xl border border-blue-500/10 ring-1 ring-blue-500/10">
            <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Average</div>
            <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-1">{formatOps(avgValAtN)}</div>
          </div>
          <div className="bg-rose-50/20 dark:bg-rose-950/10 p-2 rounded-xl border border-rose-500/10">
            <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wide">Worst Case</div>
            <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-1">{formatOps(worstValAtN)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplanationPanel({ 
  result, 
  isLoading, 
  language,
  setCode 
}: ExplanationPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [applied, setApplied] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  
  // Available tabs: 'all' (Full Report View), 'overview', 'linebyline', 'complexity', 'bugs', 'security', 'optimization', 'code', 'dryrun', 'interview'
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // State for accordion questions
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Rotate loading statuses for fluid interactive loading feedback
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setStatusIdx(0);
      interval = setInterval(() => {
        setStatusIdx((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Reset active tab and accordion when new result arrives
  useEffect(() => {
    if (result) {
      setActiveTab('all');
      setExpandedQuestion(null);
    }
  }, [result]);

  const handleCopyExplanation = () => {
    if (!result) return;
    
    let content = "";
    if ((result.summary || result.overallExplanation)) {
      content = `# Code Explanation & Insights\n\n`;
      content += `## Overall Explanation\n${(result.summary || result.overallExplanation)}\n\n`;
      
      if (result.lineByLineExplanation && result.lineByLineExplanation.length > 0) {
        content += `## Line-By-Line Walkthrough\n`;
        result.lineByLineExplanation.forEach(item => {
          content += `### ${item.lineRange}\n\`\`\`${language}\n${item.codeSnippet}\n\`\`\`\n${item.explanation}\n\n`;
        });
      }
      
      content += `## Complexities\n- **Time Complexity:** ${result.timeComplexity}\n- **Space Complexity:** ${result.spaceComplexity}\n\n`;
      
      if ((result.potentialBugs || result.bugs) && (result.potentialBugs || result.bugs).length > 0) {
        content += `## Bugs Detected\n`;
        (result.potentialBugs || result.bugs).forEach(b => {
          content += `- **[${b.severity.toUpperCase()}] ${b.bug}:** ${b.description}\n  *Fix:* ${b.fix}\n\n`;
        });
      }
      
      if (result.securityIssues && result.securityIssues.length > 0) {
        content += `## Security Issues\n`;
        result.securityIssues.forEach(s => {
          content += `- **[${s.severity.toUpperCase()}] ${s.issue}:** ${s.description}\n  *Mitigation:* ${s.mitigation}\n\n`;
        });
      }
      
      if ((result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements) && (result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).length > 0) {
        content += `## Improvements & Refactoring Tips\n`;
        (result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).forEach(imp => {
          content += `- **${imp.point}:** ${imp.description}\n`;
        });
        content += `\n`;
      }
      
      if (result.optimizedVersion) {
        content += `## Optimized Version\n\`\`\`${language}\n${result.optimizedVersion}\n\`\`\`\n\n`;
      }
      
      if (result.dryRun && result.dryRun.length > 0) {
        content += `## Dry Run Trace\n`;
        result.dryRun.forEach(step => {
          content += `- **${step.step} (${step.variablesState}):** ${step.description}\n`;
        });
        content += `\n`;
      }
      
      if (result.interviewQuestions && result.interviewQuestions.length > 0) {
        content += `## Interview Preparation\n`;
        result.interviewQuestions.forEach(q => {
          content += `### Q: ${q.question}\n**A:** ${q.answer}\n*Topic: ${q.topic}*\n\n`;
        });
      }
    } else {
      content = result.explanation || "";
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    
    let content = "";
    if ((result.summary || result.overallExplanation)) {
      content = `# Code Explanation & Insights\n\n`;
      content += `## Overall Explanation\n${(result.summary || result.overallExplanation)}\n\n`;
      
      if (result.lineByLineExplanation && result.lineByLineExplanation.length > 0) {
        content += `## Line-By-Line Walkthrough\n`;
        result.lineByLineExplanation.forEach(item => {
          content += `### ${item.lineRange}\n\`\`\`${language}\n${item.codeSnippet}\n\`\`\`\n${item.explanation}\n\n`;
        });
      }
      
      content += `## Complexities\n- **Time Complexity:** ${result.timeComplexity}\n- **Space Complexity:** ${result.spaceComplexity}\n\n`;
      
      if ((result.potentialBugs || result.bugs) && (result.potentialBugs || result.bugs).length > 0) {
        content += `## Bugs Detected\n`;
        (result.potentialBugs || result.bugs).forEach(b => {
          content += `- **[${b.severity.toUpperCase()}] ${b.bug}:** ${b.description}\n  *Fix:* ${b.fix}\n\n`;
        });
      }
      
      if (result.securityIssues && result.securityIssues.length > 0) {
        content += `## Security Issues\n`;
        result.securityIssues.forEach(s => {
          content += `- **[${s.severity.toUpperCase()}] ${s.issue}:** ${s.description}\n  *Mitigation:* ${s.mitigation}\n\n`;
        });
      }
      
      if ((result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements) && (result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).length > 0) {
        content += `## Improvements & Refactoring Tips\n`;
        (result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).forEach(imp => {
          content += `- **${imp.point}:** ${imp.description}\n`;
        });
        content += `\n`;
      }
      
      if (result.optimizedVersion) {
        content += `## Optimized Version\n\`\`\`${language}\n${result.optimizedVersion}\n\`\`\`\n\n`;
      }
      
      if (result.dryRun && result.dryRun.length > 0) {
        content += `## Dry Run Trace\n`;
        result.dryRun.forEach(step => {
          content += `- **${step.step} (${step.variablesState}):** ${step.description}\n`;
        });
        content += `\n`;
      }
      
      if (result.interviewQuestions && result.interviewQuestions.length > 0) {
        content += `## Interview Preparation\n`;
        result.interviewQuestions.forEach(q => {
          content += `### Q: ${q.question}\n**A:** ${q.answer}\n*Topic: ${q.topic}*\n\n`;
        });
      }
    } else {
      content = result.explanation || "";
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${language}_analysis_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApplyCode = (text: string) => {
    if (setCode) {
      setCode(text);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const sev = severity.toLowerCase();
    switch (sev) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-950/45 dark:text-red-400 dark:border-red-900/40 font-extrabold animate-pulse ring-1 ring-red-500/20';
      case 'high':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30 font-bold';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 font-semibold';
      case 'low':
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  const formatSeverityLabel = (severity: string) => {
    const sev = severity.toLowerCase();
    return sev.charAt(0).toUpperCase() + sev.slice(1);
  };

  // Render Loader screen
  if (isLoading) {
    return (
      <div id="explanation-loading" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-full shadow-md flex flex-col items-center justify-center p-8 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl" />
        
        <div className="relative flex flex-col items-center max-w-sm text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 opacity-20 blur-md animate-pulse" />
          </div>
          
          <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 tracking-wider uppercase">Evaluating Codebase</h3>
          
          <div className="w-48 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-4 mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full animate-[loading_1.5s_infinite_ease-in-out]" />
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic animate-pulse">
            {LOADING_STATUSES[statusIdx]}
          </p>
        </div>
      </div>
    );
  }

  // Render Empty State
  if (!result) {
    return (
      <div id="explanation-empty" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-full shadow-md flex flex-col items-center justify-center p-8 text-center transition-all duration-200">
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-5 shadow-sm">
          <Terminal className="w-7 h-7 text-violet-500" />
        </div>
        <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Awaiting Analysis</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-2 leading-relaxed">
          Provide your code snippet, choose your desired programming language, and click the **Explain Code** button to retrieve structured, rich diagnostics from Gemini.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-8 text-left">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-100 dark:border-zinc-800/80 flex gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
            <Cpu className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Detailed AST Walkthrough</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Line-by-line detailed breakdowns of variable operations, functions, and loop cycles.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-100 dark:border-zinc-800/80 flex gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Algorithmic Audits</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Scans for potential logical errors, security vulnerabilities, and code complexity metrics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle standard explanation fallback
  const isStructuredResult = !!(result.summary || result.overallExplanation);

  if (!isStructuredResult) {
    return (
      <div id="explanation-results" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-full shadow-md flex flex-col overflow-hidden transition-all duration-200">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-violet-500" />
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Analysis Feedback</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyExplanation}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Copy markdown content"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Download markdown explanation"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="markdown-body max-w-none">
            <Markdown>{result.explanation || ''}</Markdown>
          </div>
        </div>
      </div>
    );
  }

  // Render Structured / Bento Card Results Page
  const tabsList = [
    { id: 'all', label: 'Full Report', icon: BookOpen },
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'linebyline', label: 'Line by Line', icon: Bookmark },
    { id: 'complexity', label: 'Complexity', icon: Layers },
    { id: 'bugs', label: 'Bugs', icon: Bug },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'optimization', label: 'Optimization', icon: Lightbulb },
    { id: 'code', label: 'Optimized Code', icon: Code2 },
    { id: 'dryrun', label: 'Dry Run', icon: Activity },
    { id: 'interview', label: 'Interview Prep', icon: HelpCircle }
  ];

  const timeCompData = getComplexityDetails(result.timeComplexity);
  const spaceCompData = getComplexityDetails(result.spaceComplexity);

  return (
    <div id="explanation-results-rich" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-full shadow-md flex flex-col overflow-hidden transition-all duration-200">
      
      {/* Scrollable Sticky Tab Filter Bar with Active Pill Indicator */}
      <div className="bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-2 flex items-center justify-between gap-4 shrink-0 overflow-hidden">
        <div className="flex-1 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
                    isActive 
                      ? 'text-white' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/55 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-violet-600 rounded-xl"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.id === 'bugs' && (((result.potentialBugs || result.bugs)?.length || 0) + (result.securityIssues?.length || 0)) > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block shrink-0" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-1 shrink-0 bg-white/40 dark:bg-zinc-900/40 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/50">
          <button
            onClick={handleCopyExplanation}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            title="Copy whole report as Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            title="Download report (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="space-y-6"
          >
            
            {/* SECTION 1: EXECUTIVE OVERVIEW CARD */}
            {(activeTab === 'all' || activeTab === 'overview') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 dark:bg-violet-500/2 blur-2xl rounded-full" />
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Executive Overview</h3>
                </div>

                <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 markdown-body prose dark:prose-invert max-w-none font-normal">
                  <Markdown>{(result.summary || result.overallExplanation)}</Markdown>
                </div>
              </div>
            )}

            {/* SECTION 2: LINE-BY-LINE TRACE CARD */}
            {(activeTab === 'all' || activeTab === 'linebyline') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Line-By-Line Breakdown</h3>
                </div>

                {result.lineByLineExplanation && result.lineByLineExplanation.length > 0 ? (
                  <div className="space-y-4">
                    {result.lineByLineExplanation.map((block, idx) => (
                      <div key={idx} className="border border-zinc-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-50/20 dark:bg-zinc-900/20 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                        
                        {/* Snippet Meta bar */}
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-extrabold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-md">
                            {block.lineRange}
                          </span>
                          <button
                            onClick={() => handleCopyCode(block.codeSnippet)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Copy snippet"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Code Container */}
                        <div className="p-3.5 bg-zinc-950 text-zinc-200 font-mono text-[11px] leading-relaxed overflow-x-auto">
                          <pre><code>{block.codeSnippet}</code></pre>
                        </div>

                        {/* Text explanation */}
                        <div className="p-4 bg-white/40 dark:bg-zinc-900/10 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal markdown-body border-t border-zinc-150 dark:border-zinc-800/40">
                          <Markdown>{block.explanation}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">No line-by-line analyses were generated.</p>
                )}
              </div>
            )}

            {/* SECTION 3: COMPLEXITY CARD */}
            {(activeTab === 'all' || activeTab === 'complexity') && (
              <div className="space-y-6">
                
                {/* Visual Complexity Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-950/40 dark:to-indigo-950/40 text-white rounded-3xl p-6 relative overflow-hidden border border-violet-500/10 shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <TrendingUp className="w-5 h-5 text-indigo-200" />
                        <h3 className="text-xs font-bold text-indigo-200 tracking-widest uppercase">Big-O Complexity Suite</h3>
                      </div>
                      <h2 className="text-lg font-black tracking-tight">Algorithmic Performance Analysis</h2>
                      <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl">
                        A multidimensional audit of the temporal and spatial scaling traits. Review best, average, and worst execution scenarios and memory heap limits below.
                      </p>
                    </div>
                    
                    <div className="shrink-0 bg-white/10 dark:bg-zinc-900/30 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Overall Profile</div>
                      <div className="text-sm font-black mt-0.5 font-mono text-white flex items-center gap-1.5">
                        <span>Time: {result.timeComplexity.split(':')[0] || result.timeComplexity}</span>
                        <span className="opacity-40">|</span>
                        <span>Space: {result.spaceComplexity.split(':')[0] || result.spaceComplexity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid of the 4 Main Complexity Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* BEST CASE */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Best Case</span>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Optimal</span>
                      </div>
                      <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {cleanBigO(result.bestComplexity || "O(1)")}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-4">
                      Execution scale in the most favorable dataset layout.
                    </div>
                  </div>

                  {/* AVERAGE CASE */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Average Case</span>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Expected</span>
                      </div>
                      <div className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                        {cleanBigO(result.averageComplexity || result.timeComplexity.split(':')[0] || "O(N)")}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-4">
                      Standard performance profile for randomized workloads.
                    </div>
                  </div>

                  {/* WORST CASE */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Worst Case</span>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Bound limit</span>
                      </div>
                      <div className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400 mt-1">
                        {cleanBigO(result.worstComplexity || result.timeComplexity.split(':')[0] || "O(N)")}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-4">
                      Absolute execution threshold under worst input structure.
                    </div>
                  </div>

                  {/* SPACE COMPLEXITY */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Memory Space</span>
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">Auxiliary</span>
                      </div>
                      <div className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400 mt-1">
                        {cleanBigO(result.spaceComplexity.split(':')[0] || result.spaceComplexity)}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-4">
                      Total extra workspace allocated on heap and call stack.
                    </div>
                  </div>

                </div>

                {/* GRAPH & EXPLANATION ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Dynamic SVG Growth Chart */}
                  <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                            <Activity className="w-4 h-4 animate-pulse" />
                          </div>
                          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase">Complexity Growth Visualizer</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Best</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-1 bg-blue-500 rounded-full inline-block" />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Avg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block" />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Worst</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-6">
                        An interactive projection plotting standard operations $O(f(N))$ relative to growth curves of your code's specific characteristics as input size $N$ expands.
                      </p>
                    </div>

                    {/* SVG GRAPH BLOCK */}
                    <div className="relative border border-zinc-100 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/20 p-4 min-h-[220px] flex items-center justify-center">
                      <ComplexityChart 
                        best={result.bestComplexity || "O(1)"}
                        average={result.averageComplexity || result.timeComplexity.split(':')[0] || "O(N)"}
                        worst={result.worstComplexity || result.timeComplexity.split(':')[0] || "O(N)"}
                      />
                    </div>
                  </div>

                  {/* Why it scales - Detailed Explanation Panel */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          <Info className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase">Complexity Justification</h3>
                      </div>
                      
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-none prose dark:prose-invert font-normal max-h-[260px] overflow-y-auto pr-1">
                        <Markdown>
                          {result.complexityExplanation || 
                           (result.timeComplexity.includes(':') 
                             ? result.timeComplexity.split(':').slice(1).join(':').trim() 
                             : "The time efficiency is bounded by loops, state comparisons, and recursion. Worst-case scenario displays maximum scaling boundaries.")}
                        </Markdown>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-zinc-150/60 dark:border-zinc-800/50 flex gap-2.5 items-start">
                      <div className="p-1 bg-amber-500/10 rounded-lg text-amber-500 mt-0.5 shrink-0">
                        <Lightbulb className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Developer Guidance</span>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5 font-normal">
                          Reduce worst-case loops, memoize repeated subproblems, or utilize hashed caches to flatten the average/worst-case trajectories.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SECTION 4 & 5: BUGS & SECURITY CARDS */}
            {(activeTab === 'all' || activeTab === 'bugs' || activeTab === 'security') && (
              <div className="space-y-6">
                
                {/* Logical Bugs & Edge Cases */}
                {(activeTab === 'all' || activeTab === 'bugs') && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                    
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <Bug className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Bugs & Edge Cases</h3>
                    </div>

                    {(result.potentialBugs || result.bugs) && (result.potentialBugs || result.bugs).length > 0 ? (
                      <div className="space-y-4">
                        {(result.potentialBugs || result.bugs).map((item, idx) => (
                          <div key={idx} className="border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-4.5 bg-zinc-50/10 dark:bg-zinc-900/10 relative overflow-hidden flex flex-col md:flex-row gap-4 items-start">
                            {/* severity border */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                              item.severity.toLowerCase() === 'critical' ? 'bg-red-600 animate-[pulse_1s_infinite] w-1.5' :
                              item.severity.toLowerCase() === 'high' ? 'bg-rose-500' :
                              item.severity.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-zinc-400'
                            }`} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                                  {formatSeverityLabel(item.severity)} Severity
                                </span>
                                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.bug}</h4>
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">{item.description}</p>
                            </div>

                            {/* Fix code block */}
                            <div className="w-full md:w-80 shrink-0 bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-850 font-mono text-[10.5px] leading-relaxed relative group overflow-hidden">
                              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-600 uppercase absolute top-2 right-3">Fix Blueprint</span>
                              <pre className="mt-2 overflow-x-auto max-h-[140px]"><code>{item.fix}</code></pre>
                              <button
                                onClick={() => handleCopyCode(item.fix)}
                                className="absolute bottom-2 right-2 p-1 rounded bg-zinc-800/60 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white cursor-pointer"
                                title="Copy fix snippet"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-emerald-50/20 border border-emerald-100/40 dark:bg-emerald-950/5 dark:border-emerald-900/10 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No logical bugs detected!</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed font-normal">The algorithm executes cleanly and safeguards variables against common null pointers or bound excesses.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Vulnerabilities */}
                {(activeTab === 'all' || activeTab === 'security') && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                    
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Security & Vulnerability Audit</h3>
                    </div>

                    {result.securityIssues && result.securityIssues.length > 0 ? (
                      <div className="space-y-4">
                        {result.securityIssues.map((item, idx) => (
                          <div key={idx} className="border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-4.5 bg-zinc-50/10 dark:bg-zinc-900/10 relative overflow-hidden flex flex-col md:flex-row gap-4 items-start">
                            {/* severity border */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                              item.severity.toLowerCase() === 'critical' ? 'bg-red-600 animate-[pulse_1s_infinite] w-1.5' :
                              item.severity.toLowerCase() === 'high' ? 'bg-rose-500' :
                              item.severity.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-zinc-400'
                            }`} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                                  {formatSeverityLabel(item.severity)} Severity
                                </span>
                                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 truncate">{item.issue}</h4>
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">{item.description}</p>
                            </div>

                            {/* Mitigation code block */}
                            <div className="w-full md:w-80 shrink-0 bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-850 font-mono text-[10.5px] leading-relaxed relative group overflow-hidden">
                              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-600 uppercase absolute top-2 right-3">Mitigation</span>
                              <pre className="mt-2 overflow-x-auto max-h-[140px]"><code>{item.mitigation}</code></pre>
                              <button
                                onClick={() => handleCopyCode(item.mitigation)}
                                className="absolute bottom-2 right-2 p-1 rounded bg-zinc-800/60 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white cursor-pointer"
                                title="Copy mitigation snippet"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-emerald-50/20 border border-emerald-100/40 dark:bg-emerald-950/5 dark:border-emerald-900/10 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No vulnerabilities found!</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed font-normal">No dangerous injection holes, boundary risks, overflows, or unsafe divisions are exposed.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 6: OPTIMIZATION & REFACTOR TIPS */}
            {(activeTab === 'all' || activeTab === 'optimization') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-100/30 dark:border-amber-900/10">
                    <TrendingUp className="w-4 h-4 animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Optimization & Refactoring Tips</h3>
                </div>

                {(result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements) && (result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(result.bestPractices?.map(p => ({ point: 'Best Practice', description: p })) || result.improvements).map((imp, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/25 border border-zinc-150 dark:border-zinc-800 flex gap-3 hover:shadow-sm transition-shadow">
                        <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 h-fit shrink-0">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{imp.point}</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed font-normal">{imp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">No manual optimizations were proposed.</p>
                )}
              </div>
            )}

            {/* SECTION 7: OPTIMIZED CODE BLOCK */}
            {(activeTab === 'all' || activeTab === 'code') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Optimized Code Blueprint</h3>
                </div>

                {result.optimizedVersion ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner bg-zinc-950 flex flex-col h-[320px] relative">
                    
                    {/* Header bar */}
                    <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-mono">optimized_draft.{language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'code'}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyCode(result.optimizedVersion || '')}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>

                        {setCode && (
                          <button
                            onClick={() => handleApplyCode(result.optimizedVersion || '')}
                            className="p-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1 shadow-sm shadow-violet-500/10"
                          >
                            {applied ? <Check className="w-3 h-3" /> : <Flame className="w-3 h-3 text-amber-300 animate-pulse" />}
                            <span>{applied ? 'Applied' : 'Load in Editor'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Code stage */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
                      <pre><code>{result.optimizedVersion}</code></pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">No alternative script version compile.</p>
                )}
              </div>
            )}

            {/* SECTION 8: DRY RUN STEP-BY-STEP TRACE */}
            {(activeTab === 'all' || activeTab === 'dryrun') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Execution Dry Run Trace</h3>
                </div>

                {result.dryRun && result.dryRun.length > 0 ? (
                  <div className="relative pl-6 space-y-6 border-l border-zinc-150 dark:border-zinc-800 ml-3 py-1">
                    {result.dryRun.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline marker node */}
                        <span className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 border-violet-500 bg-white dark:bg-zinc-900 flex items-center justify-center z-10 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        </span>

                        <div className="p-3 bg-zinc-50/40 dark:bg-zinc-800/10 border border-zinc-150 dark:border-zinc-800/60 rounded-2xl">
                          <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{step.step}</span>
                            <span className="text-[10px] font-mono font-extrabold bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-md border border-violet-100/50 dark:border-violet-900/10">
                              {step.variablesState}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-normal">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">No steps are generated for variable state traces.</p>
                )}
              </div>
            )}

            {/* SECTION 9: TECHNICAL INTERVIEW PREP */}
            {(activeTab === 'all' || activeTab === 'interview') && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Senior Engineer Interview Prep</h3>
                </div>

                {result.interviewQuestions && result.interviewQuestions.length > 0 ? (
                  <div className="space-y-3.5">
                    {result.interviewQuestions.map((item, idx) => {
                      const isOpen = expandedQuestion === idx;
                      return (
                        <div 
                          key={idx} 
                          className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50/10 dark:bg-zinc-900/10 hover:border-zinc-200 dark:hover:border-zinc-700/50 transition-all shadow-sm"
                        >
                          <button
                            onClick={() => setExpandedQuestion(isOpen ? null : idx)}
                            className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 cursor-pointer focus:outline-none bg-white dark:bg-zinc-900"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono tracking-wider font-extrabold text-violet-600 dark:text-violet-400 uppercase bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded-md">
                                Topic: {item.topic}
                              </span>
                              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug pt-1">
                                {item.question}
                              </h4>
                            </div>
                            <span className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </button>

                          {/* Accordion expand with Framer Motion height transition */}
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: 'easeInOut' }}
                              >
                                <div className="px-5 pb-5 border-t border-zinc-150 dark:border-zinc-800/50 pt-3.5 bg-zinc-50/20 dark:bg-zinc-800/5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                                  <div className="font-bold text-zinc-700 dark:text-zinc-200 text-[10px] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Model Answer Explanation</span>
                                  </div>
                                  <div className="markdown-body prose dark:prose-invert max-w-none">
                                    <Markdown>{item.answer}</Markdown>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">No specific Interview QA maps are compiled.</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
