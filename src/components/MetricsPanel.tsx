import { motion } from 'motion/react';
import { 
  Timer, 
  HardDrive, 
  Award, 
  AlertTriangle, 
  Brain,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface MetricsPanelProps {
  metrics: AnalysisResult | null;
  isLoading: boolean;
}

export default function MetricsPanel({ metrics, isLoading }: MetricsPanelProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 h-28 flex flex-col justify-between" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-zinc-50/50 dark:bg-zinc-800/10 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-500 dark:text-violet-400 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Interactive Code Diagnostics</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Complexity metrics, quality rating, and CS concepts will render instantly upon analysis.</p>
          </div>
        </div>
        <div className="hidden md:flex gap-1.5">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">O(f)</span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">Quality Score</span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">Bugs Check</span>
        </div>
      </div>
    );
  }

  // Get color for Time Complexity
  const getComplexityColor = (comp: string) => {
    const c = comp.toLowerCase();
    if (c.includes('1') || c.includes('log')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/10';
    if (c.includes('n^2') || c.includes('n!') || c.includes('2^n')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/10';
    if (c.includes('n')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/10';
    return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60';
  };

  // Get quality score color and message
  const getQualityDetails = (score: number) => {
    if (score >= 90) return { color: 'text-emerald-500 stroke-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/10', stroke: 'stroke-emerald-500', label: 'Excellent' };
    if (score >= 70) return { color: 'text-indigo-500 stroke-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/10', stroke: 'stroke-indigo-500', label: 'Good' };
    if (score >= 50) return { color: 'text-amber-500 stroke-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/10', stroke: 'stroke-amber-500', label: 'Fair' };
    return { color: 'text-rose-500 stroke-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/10', stroke: 'stroke-rose-500', label: 'Critical' };
  };

  const issuesCount = metrics.issuesCount !== undefined 
    ? metrics.issuesCount 
    : (((metrics as any).bugs?.length || 0) + ((metrics as any).securityIssues?.length || 0));

  const qualityScore = metrics.qualityScore !== undefined 
    ? metrics.qualityScore 
    : Math.max(30, 100 - (issuesCount * 15));

  const keyConcepts = metrics.keyConcepts || [];

  const qual = getQualityDetails(qualityScore);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {/* Time Complexity Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Time Complexity</span>
          <Timer className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="mt-3">
          <div className={`inline-flex items-center font-mono font-bold text-sm px-2.5 py-1 rounded-xl border ${getComplexityColor(metrics.timeComplexity)}`}>
            {metrics.timeComplexity}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 leading-none">CPU execution scaling bounds</p>
        </div>
      </div>

      {/* Space Complexity Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Space Complexity</span>
          <HardDrive className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="mt-3">
          <div className={`inline-flex items-center font-mono font-bold text-sm px-2.5 py-1 rounded-xl border ${getComplexityColor(metrics.spaceComplexity)}`}>
            {metrics.spaceComplexity}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 leading-none">Memory consumption scaling</p>
        </div>
      </div>

      {/* Quality Score Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r="24" className="stroke-zinc-100 dark:stroke-zinc-800 fill-transparent" strokeWidth="4" />
            <motion.circle 
              cx="28" cy="28" r="24" 
              className={`fill-transparent ${qual.stroke}`}
              strokeWidth="4" 
              strokeDasharray={2 * Math.PI * 24}
              initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - qualityScore / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <span className="absolute text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">{qualityScore}%</span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Quality Rating</span>
          <span className={`inline-block text-xs font-bold mt-1 px-2 py-0.5 rounded-lg border ${qual.color}`}>
            {qual.label}
          </span>
        </div>
      </div>

      {/* Issues Count Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Bugs & Risks</span>
          {issuesCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-mono font-bold ${issuesCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {issuesCount}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {issuesCount === 1 ? 'issue' : 'issues'} found
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 leading-none">Vulnerabilities and logic defects</p>
        </div>
      </div>

      {/* Computer Science Concepts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-sm col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Concepts Detected</span>
          <Brain className="w-4 h-4 text-violet-500" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {keyConcepts.map((concept, index) => (
            <span 
              key={index}
              className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/10"
            >
              {concept}
            </span>
          ))}
          {keyConcepts.length === 0 && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">None identified</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
