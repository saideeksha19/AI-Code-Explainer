import { Clock, Activity, ShieldCheck, ShieldAlert, PlayCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ScanItem {
  id: string;
  name: string;
  type: string;
  filesCount: number;
  issuesFound: number;
  healthScore: number;
  date: string;
  status: 'Completed' | 'Needs Review' | 'Active';
}

interface ScanTimelineProps {
  recentScans: ScanItem[];
  onTriggerPlayground?: () => void;
}

export default function ScanTimeline({ recentScans, onTriggerPlayground }: ScanTimelineProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Recent Scans Log List */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Audit logs</h3>
            </div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Recent Vulnerability Reports</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Scan Target / Name</th>
                  <th className="py-2.5">Scope</th>
                  <th className="py-2.5 text-center">Threats</th>
                  <th className="py-2.5 text-center">Health Index</th>
                  <th className="py-2.5 text-right">Date</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/25 transition-colors">
                    <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-200 truncate max-w-[150px]" title={scan.name}>
                      {scan.name}
                    </td>
                    <td className="py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                      {scan.type} ({scan.filesCount} f)
                    </td>
                    <td className="py-3 text-center">
                      {scan.issuesFound > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          ⚠️ {scan.issuesFound}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          ✓ 0
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono font-bold">
                      <span className={scan.healthScore >= 90 ? 'text-emerald-500' : scan.healthScore >= 70 ? 'text-amber-500' : 'text-rose-500'}>
                        {scan.healthScore}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-zinc-400 dark:text-zinc-500 text-[10px] font-mono">
                      {scan.date}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        scan.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : scan.status === 'Needs Review'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {onTriggerPlayground && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
            <button
              onClick={onTriggerPlayground}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Simulate Custom Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Chronological Scan Timeline */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-violet-500" />
          <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chronology</h3>
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-auto">Scan Timeline</h4>
        </div>

        <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-1.5 space-y-5 py-1">
          {recentScans.slice(0, 4).map((scan, index) => {
            const isLatest = index === 0;
            const hasIssues = scan.issuesFound > 0;

            return (
              <div key={scan.id} className="relative">
                {/* Connector Dot */}
                <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                  isLatest
                    ? hasIssues
                      ? 'bg-rose-500 border-rose-500 animate-ping'
                      : 'bg-emerald-500 border-emerald-500'
                    : hasIssues
                      ? 'bg-rose-400 border-white dark:border-zinc-900'
                      : 'bg-zinc-300 border-white dark:border-zinc-900'
                }`} />

                <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                  isLatest
                    ? hasIssues
                      ? 'bg-rose-500 border-rose-500'
                      : 'bg-emerald-500 border-emerald-500'
                    : hasIssues
                      ? 'bg-rose-400 border-white dark:border-zinc-900'
                      : 'bg-zinc-300 border-white dark:border-zinc-900'
                }`} />

                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isLatest ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'}`}>
                      {scan.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                      {scan.date}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {scan.type} • {scan.filesCount} file(s) indexed
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {hasIssues ? (
                      <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{scan.issuesFound} threats require patching</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Security baseline verified clean</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
