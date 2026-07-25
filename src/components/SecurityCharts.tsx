import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Activity, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface SecurityChartsProps {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  trendData: Array<{
    id: string;
    date: string;
    total: number;
    critical: number;
    high: number;
    med: number;
    low: number;
    label: string;
  }>;
  selectedSeverity: string;
  onSelectSeverity: (severity: string) => void;
  healthScore: number;
}

export default function SecurityCharts({
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  trendData,
  selectedSeverity,
  onSelectSeverity,
  healthScore
}: SecurityChartsProps) {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Health grade calculator
  const getGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', label: 'Excellent Security', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 75) return { letter: 'B', label: 'Good Configuration', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' };
    if (score >= 60) return { letter: 'C', label: 'Guarded Exposure', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' };
    if (score >= 40) return { letter: 'D', label: 'Elevated Threat', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10' };
    return { letter: 'F', label: 'Critical Risk', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10' };
  };

  const grade = getGrade(healthScore);

  // SVG calculations for Area chart
  const maxVal = Math.max(...trendData.map(d => d.total), 5);
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 25;

  const points = trendData.map((d, index) => {
    const x = paddingX + (index / Math.max(trendData.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.total / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  // Donut chart calculations
  const totalIssues = criticalCount + highCount + mediumCount + lowCount;
  const radius = 35;
  const circ = 2 * Math.PI * radius; // ~219.9

  const categories = [
    { key: 'critical', count: criticalCount, color: '#f43f5e', label: 'Critical', bg: 'bg-rose-500' },
    { key: 'high', count: highCount, color: '#f97316', label: 'High', bg: 'bg-orange-500' },
    { key: 'medium', count: mediumCount, color: '#f59e0b', label: 'Medium', bg: 'bg-amber-500' },
    { key: 'low', count: lowCount, color: '#3b82f6', label: 'Low', bg: 'bg-blue-500' }
  ];

  let accumulatedCirc = 0;
  const segments = categories
    .filter(cat => cat.count > 0)
    .map(cat => {
      const percentage = (cat.count / totalIssues) * 100;
      const strokeLength = (cat.count / totalIssues) * circ;
      const strokeOffset = circ - strokeLength - accumulatedCirc;
      accumulatedCirc += strokeLength;
      return {
        ...cat,
        percentage,
        strokeLength,
        strokeOffset
      };
    });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* 1. Security Health Score Radial Gauge */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Security Posture</h3>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">Enterprise Health Index</h4>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${grade.bg} ${grade.color} flex items-center gap-1`}>
            <Sparkles className="w-3 h-3" />
            <span>Grade {grade.letter}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center my-2">
          {/* Circular gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Track */}
              <circle
                cx="72"
                cy="72"
                r="55"
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Dynamic Value Arc */}
              <motion.circle
                cx="72"
                cy="72"
                r="55"
                stroke={healthScore >= 90 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 55}
                initial={{ strokeDashoffset: 2 * Math.PI * 55 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 55 * (1 - healthScore / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {healthScore}
              </span>
              <span className="text-zinc-400 text-xs block -mt-1">/100</span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 text-center sm:text-left">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Compliance Status</span>
              <p className={`text-sm font-bold mt-0.5 ${grade.color}`}>
                {grade.label}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block text-center sm:text-left">Risk Weight Calculation</span>
              <div className="flex gap-2 justify-center sm:justify-start mt-1 text-[10px] text-zinc-400 font-mono">
                <span>Crit: -15pt</span>
                <span>High: -8pt</span>
                <span>Med: -3pt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Vulnerability Trend Graph */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Historical Diagnostics</h3>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">Vulnerability Remediation Trend</h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <TrendingUp className="w-4 h-4 text-violet-500 animate-pulse" />
              <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">Real-time</span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 mt-2 min-h-[140px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#e4e4e7" strokeDasharray="3 3" className="dark:stroke-zinc-800" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#e4e4e7" strokeDasharray="3 3" className="dark:stroke-zinc-800" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e4e4e7" strokeDasharray="3 3" className="dark:stroke-zinc-800" />

            {/* Gradient background */}
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {points.length > 0 && (
              <>
                {/* Area under line */}
                <path d={areaPath} fill="url(#chart-grad)" />

                {/* Line Path */}
                <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Interactive points */}
                {points.map((pt, idx) => (
                  <g key={pt.id}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#8b5cf6"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer dark:stroke-zinc-900 drop-shadow-sm"
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />
                    {/* Tick labels on bottom axis */}
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="fill-zinc-400 dark:fill-zinc-500 font-mono text-[9px] font-bold"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>

          {/* Line Tooltip Overlay */}
          <AnimatePresence>
            {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-800/80 shadow-md text-[10px] font-mono pointer-events-none z-10 w-[140px]"
                style={{
                  left: `${(points[hoveredTrendIndex].x / chartWidth) * 100}%`,
                  top: '10px',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-bold text-zinc-400">{points[hoveredTrendIndex].label}</div>
                <div className="border-t border-zinc-800 my-1 pt-1 flex justify-between">
                  <span>Total Threats:</span>
                  <span className="font-extrabold text-violet-400">{points[hoveredTrendIndex].total}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[8px] text-zinc-500 mt-0.5">
                  <span className="text-rose-400">Crit: {points[hoveredTrendIndex].critical}</span>
                  <span className="text-orange-400">High: {points[hoveredTrendIndex].high}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Severity Distribution Pie/Donut Chart */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Threat Segmentation</h3>
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">Severity Distribution</h4>
        </div>

        <div className="flex items-center justify-around gap-4 flex-1 my-2">
          {/* Donut graphic */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            {totalIssues === 0 ? (
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-xs font-bold text-emerald-500">Secure</span>
                <span className="text-[9px] text-zinc-400">0 vulnerabilities</span>
              </div>
            ) : (
              <svg className="w-full h-full transform -rotate-90">
                {segments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke={seg.color}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circ}
                    strokeDashoffset={seg.strokeOffset}
                    className="cursor-pointer transition-all hover:stroke-zinc-600 dark:hover:stroke-zinc-400"
                    style={{ strokeDasharray: `${seg.strokeLength} ${circ - seg.strokeLength}` }}
                    onClick={() => onSelectSeverity(selectedSeverity === seg.key ? 'all' : seg.key)}
                  />
                ))}
              </svg>
            )}
            {totalIssues > 0 && (
              <div className="absolute text-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  {totalIssues}
                </span>
                <span className="text-[9px] text-zinc-400 block -mt-1">Issues</span>
              </div>
            )}
          </div>

          {/* Interactive Legend */}
          <div className="flex-1 space-y-1.5">
            {categories.map((cat) => {
              const isActive = selectedSeverity === cat.key;
              const hasItems = cat.count > 0;
              const pct = totalIssues > 0 ? Math.round((cat.count / totalIssues) * 100) : 0;

              return (
                <button
                  key={cat.key}
                  onClick={() => onSelectSeverity(isActive ? 'all' : cat.key)}
                  disabled={!hasItems}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-all ${
                    isActive 
                      ? 'bg-zinc-100 dark:bg-zinc-800 font-bold border-l-2 border-zinc-700 dark:border-zinc-300' 
                      : !hasItems 
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.bg}`} />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-500 shrink-0">
                    <span>{cat.count}</span>
                    <span className="text-zinc-400">({pct}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
