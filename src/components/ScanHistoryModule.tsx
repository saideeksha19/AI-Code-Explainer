import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Trash2, 
  Eye, 
  Download, 
  GitCompare, 
  Calendar, 
  Clock, 
  FileCode, 
  ShieldAlert, 
  Activity, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  DownloadCloud,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Vulnerability, INITIAL_VULNERABILITIES } from './SecurityData';

export interface ScanHistoryItem {
  id: string;
  date: string;
  repoName: string;
  totalFiles: number;
  durationMs: number;
  vulnerabilities: Vulnerability[];
  totalVulnerabilities: number;
  riskScore: number;
  type: 'ZIP' | 'Folder' | 'GitHub' | 'Workspace';
}

interface ScanHistoryModuleProps {
  currentVulnerabilities: Vulnerability[];
  onLoadScanVulnerabilities: (vulns: Vulnerability[], scanName: string, healthScore: number) => void;
  onScanTriggered?: () => void;
  // External triggers to register a new scan history item
  registerNewScanExternal?: (scan: ScanHistoryItem) => void;
}

export default function ScanHistoryModule({
  currentVulnerabilities,
  onLoadScanVulnerabilities,
  onScanTriggered
}: ScanHistoryModuleProps) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  
  // Scans selected for comparison
  const [compareScanAId, setCompareScanAId] = useState<string>('');
  const [compareScanBId, setCompareScanBId] = useState<string>('');
  const [showComparison, setShowComparison] = useState<boolean>(false);

  // Initialize history from localStorage or pre-populate with rich mock scans
  useEffect(() => {
    const storedHistory = localStorage.getItem('aegis_scan_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Error parsing stored scan history, loading defaults', e);
        loadDefaultHistory();
      }
    } else {
      loadDefaultHistory();
    }
  }, []);

  const loadDefaultHistory = () => {
    // We create a history progression showing the process of fixing the vulnerabilities
    
    // 1. Baseline Scan (All 4 vulnerabilities unresolved)
    const baselineVulns: Vulnerability[] = INITIAL_VULNERABILITIES.map(v => ({
      ...v,
      status: 'Needs Review'
    }));
    const baselineScan: ScanHistoryItem = {
      id: 'h-scan-1',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      repoName: 'Aegis Core Backend',
      totalFiles: 14,
      durationMs: 4800,
      vulnerabilities: baselineVulns,
      totalVulnerabilities: 4,
      riskScore: 45, // Low security score due to critical, high, medium, low issues
      type: 'Folder'
    };

    // 2. JWT & Rate Limit Patch Scan (JWT and Rate Limiting fixed, Lax password & Security Headers still needs review)
    const midPatchVulns: Vulnerability[] = INITIAL_VULNERABILITIES.map(v => {
      if (v.id === 'vuln-1' || v.id === 'vuln-2') {
        return { ...v, status: 'Fixed' };
      }
      return { ...v, status: 'Needs Review' };
    });
    const midScan: ScanHistoryItem = {
      id: 'h-scan-2',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      repoName: 'Aegis Core Backend (v1.1 Patch)',
      totalFiles: 15,
      durationMs: 3200,
      vulnerabilities: midPatchVulns,
      totalVulnerabilities: 4, // 4 total tracked, 2 open
      riskScore: 91, // Higher score as critical & high are remediated
      type: 'Workspace'
    };

    // 3. Hardened Security Audit (All 4 remediated)
    const cleanVulns: Vulnerability[] = INITIAL_VULNERABILITIES.map(v => ({
      ...v,
      status: 'Fixed'
    }));
    const finalScan: ScanHistoryItem = {
      id: 'h-scan-3',
      date: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      repoName: 'Aegis Enterprise Release',
      totalFiles: 18,
      durationMs: 5100,
      vulnerabilities: cleanVulns,
      totalVulnerabilities: 4,
      riskScore: 100, // Perfect score
      type: 'GitHub'
    };

    const initialHistory = [finalScan, midScan, baselineScan];
    setHistory(initialHistory);
    localStorage.setItem('aegis_scan_history', JSON.stringify(initialHistory));

    // Initialize compare selector IDs with defaults
    if (initialHistory.length >= 2) {
      setCompareScanAId(initialHistory[2].id); // Baseline Scan
      setCompareScanBId(initialHistory[0].id); // Final Release Scan
    }
  };

  // Expose function to save a new scan from the parent
  useEffect(() => {
    const handleAddExternalScan = (e: CustomEvent<Omit<ScanHistoryItem, 'id' | 'date'>>) => {
      const newScan: ScanHistoryItem = {
        ...e.detail,
        id: `scan-${Date.now()}`,
        date: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setHistory(prev => {
        const updated = [newScan, ...prev];
        localStorage.setItem('aegis_scan_history', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('aegis-add-scan' as any, handleAddExternalScan as any);
    return () => {
      window.removeEventListener('aegis-add-scan' as any, handleAddExternalScan as any);
    };
  }, []);

  const saveHistory = (updatedHistory: ScanHistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('aegis_scan_history', JSON.stringify(updatedHistory));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this scan from history? This action is permanent.')) {
      const updated = history.filter(item => item.id !== id);
      saveHistory(updated);
      
      // Update comparison IDs if deleted
      if (compareScanAId === id) setCompareScanAId('');
      if (compareScanBId === id) setCompareScanBId('');
      if (selectedScan?.id === id) setSelectedScan(null);
    }
  };

  const handleView = (scan: ScanHistoryItem) => {
    setSelectedScan(scan);
    // Load the vulnerabilities state of this historical scan to the parent so user can browse, fix, etc.
    onLoadScanVulnerabilities(scan.vulnerabilities, scan.repoName, scan.riskScore);
  };

  const handleDownloadReport = (scan: ScanHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a beautifully structured JSON report
    const reportData = {
      reportType: 'Aegis SAST Security Compliance Report',
      repositoryName: scan.repoName,
      scanDate: scan.date,
      totalFilesScanned: scan.totalFiles,
      scanDurationSeconds: (scan.durationMs / 1000).toFixed(2) + 's',
      securityPostureScore: scan.riskScore,
      totalVulnerabilitiesTracked: scan.totalVulnerabilities,
      summary: {
        totalCritical: scan.vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'Needs Review').length,
        totalHigh: scan.vulnerabilities.filter(v => v.severity === 'high' && v.status === 'Needs Review').length,
        totalMedium: scan.vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'Needs Review').length,
        totalLow: scan.vulnerabilities.filter(v => v.severity === 'low' && v.status === 'Needs Review').length,
        totalRemediated: scan.vulnerabilities.filter(v => v.status === 'Fixed').length
      },
      vulnerabilitiesList: scan.vulnerabilities.map(v => ({
        id: v.id,
        vulnerabilityType: v.vulnerabilityType,
        severity: v.severity,
        filePath: v.fileName,
        owaspCategory: v.owaspCategory,
        cvssScore: v.cvssScore,
        status: v.status,
        remediationSolutionApplied: v.secureFix
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegis_security_report_${scan.repoName.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Scan Comparison Logic
  const getScanComparisonData = () => {
    const scanA = history.find(s => s.id === compareScanAId);
    const scanB = history.find(s => s.id === compareScanBId);

    if (!scanA || !scanB) return null;

    // We assume scanA is "older" or reference, scanB is "newer" or comparator
    // (We sort them based on chronological index or date if needed, but user picks anyway)
    
    const riskDiff = scanB.riskScore - scanA.riskScore;
    
    // Count open vulnerabilities in both
    const openA = scanA.vulnerabilities.filter(v => v.status === 'Needs Review');
    const openB = scanB.vulnerabilities.filter(v => v.status === 'Needs Review');

    const openCountDiff = openB.length - openA.length;

    // Grouping by severity comparison
    const severityDiff = {
      critical: scanB.vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'Needs Review').length - 
                scanA.vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'Needs Review').length,
      high: scanB.vulnerabilities.filter(v => v.severity === 'high' && v.status === 'Needs Review').length - 
            scanA.vulnerabilities.filter(v => v.severity === 'high' && v.status === 'Needs Review').length,
      medium: scanB.vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'Needs Review').length - 
              scanA.vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'Needs Review').length,
      low: scanB.vulnerabilities.filter(v => v.severity === 'low' && v.status === 'Needs Review').length - 
            scanA.vulnerabilities.filter(v => v.severity === 'low' && v.status === 'Needs Review').length,
    };

    // Resolved vulnerabilities (present & open in scanA, but fixed or absent in scanB)
    const resolvedVulns = scanA.vulnerabilities.filter(vA => {
      const openInA = vA.status === 'Needs Review';
      const resolvedOrAbsentInB = !scanB.vulnerabilities.some(vB => vB.vulnerabilityType === vA.vulnerabilityType && vB.status === 'Needs Review');
      return openInA && resolvedOrAbsentInB;
    });

    // Newly introduced vulnerabilities (open in scanB, but absent or fixed in scanA)
    const newVulns = scanB.vulnerabilities.filter(vB => {
      const openInB = vB.status === 'Needs Review';
      const absentOrFixedInA = !scanA.vulnerabilities.some(vA => vA.vulnerabilityType === vB.vulnerabilityType && vA.status === 'Needs Review');
      return openInB && absentOrFixedInA;
    });

    return {
      scanA,
      scanB,
      riskDiff,
      openCountDiff,
      severityDiff,
      resolvedVulns,
      newVulns,
      openCountA: openA.length,
      openCountB: openB.length
    };
  };

  const comparison = getScanComparisonData();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col">
      {/* Module Title Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-500" />
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            SecOps Scan History Registry
          </h3>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          disabled={history.length < 2}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            showComparison 
              ? 'bg-violet-600 text-white hover:bg-violet-700' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Compare Scans</span>
        </button>
      </div>

      {/* Main Container Grid */}
      <div className="p-5 space-y-6">
        
        {/* Comparison Console Panel */}
        <AnimatePresence>
          {showComparison && comparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-2 border-violet-500/20 bg-violet-500/[0.02] dark:bg-violet-500/[0.01] rounded-2xl p-5 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Diff Engine Workspace</span>
                </div>
                <button 
                  onClick={() => setShowComparison(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Reference Baseline (Scan A)</label>
                  <select
                    value={compareScanAId}
                    onChange={(e) => setCompareScanAId(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-200 rounded-xl py-2 px-3 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select Scan A</option>
                    {history.map(s => (
                      <option key={s.id} value={s.id} disabled={s.id === compareScanBId}>
                        {s.repoName} ({s.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Comparison Target (Scan B)</label>
                  <select
                    value={compareScanBId}
                    onChange={(e) => setCompareScanBId(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-200 rounded-xl py-2 px-3 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select Scan B</option>
                    {history.map(s => (
                      <option key={s.id} value={s.id} disabled={s.id === compareScanAId}>
                        {s.repoName} ({s.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Results Card */}
              {comparison && (
                <div className="space-y-4 pt-2">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Security Health Score Comparison */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Risk Score Delta</span>
                      <div className="flex items-center justify-center gap-3 mt-1.5">
                        <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500 font-bold">{comparison.scanA.riskScore}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                        <span className="text-xl font-mono font-extrabold text-zinc-800 dark:text-zinc-100">{comparison.scanB.riskScore}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        {comparison.riskDiff > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{comparison.riskDiff} Score (Improved)</span>
                          </span>
                        ) : comparison.riskDiff < 0 ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" />
                            <span>{comparison.riskDiff} Score (Warning)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                            No Score Difference
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Threat Count Difference */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Unresolved Threat Load</span>
                      <div className="flex items-center justify-center gap-3 mt-1.5">
                        <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500 font-bold">{comparison.openCountA} open</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                        <span className="text-xl font-mono font-extrabold text-zinc-800 dark:text-zinc-100">{comparison.openCountB} open</span>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        {comparison.openCountDiff < 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {comparison.openCountDiff} Solved Security Gaps
                          </span>
                        ) : comparison.openCountDiff > 0 ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                            +{comparison.openCountDiff} New Security Threats
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                            Security baseline unchanged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Delta */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Resource Index Gaps</span>
                      <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-left">
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-1.5 rounded-lg border border-zinc-200/45 text-center">
                          <span className="text-[8px] text-zinc-400 font-mono block">Files Indexed</span>
                          <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
                            {comparison.scanA.totalFiles} vs {comparison.scanB.totalFiles}
                          </span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-1.5 rounded-lg border border-zinc-200/45 text-center">
                          <span className="text-[8px] text-zinc-400 font-mono block">Duration Delta</span>
                          <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
                            {(comparison.scanA.durationMs / 1000).toFixed(1)}s vs {(comparison.scanB.durationMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resolved and New Issues Detail Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Resolved Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-emerald-500/10 shadow-sm">
                      <span className="text-[10px] font-extrabold text-emerald-500 uppercase flex items-center gap-1.5 mb-2.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Remediated Vulnerabilities ({comparison.resolvedVulns.length})</span>
                      </span>
                      {comparison.resolvedVulns.length === 0 ? (
                        <div className="text-[11px] text-zinc-400 py-4 text-center font-semibold">
                          No threats resolved between these checkpoints.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                          {comparison.resolvedVulns.map((v, i) => (
                            <div key={i} className="bg-emerald-500/[0.03] border border-emerald-500/15 p-2 rounded-lg flex items-start gap-2">
                              <span className="text-emerald-500 font-bold text-xs mt-0.5">✓</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                                  {v.vulnerabilityType}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-zinc-400">
                                  <span className="text-emerald-600 font-bold uppercase">{v.severity}</span>
                                  <span>•</span>
                                  <span className="truncate">{v.fileName}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* New/Open Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-rose-500/10 shadow-sm">
                      <span className="text-[10px] font-extrabold text-rose-500 uppercase flex items-center gap-1.5 mb-2.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Unresolved Threats in Target ({comparison.newVulns.length})</span>
                      </span>
                      {comparison.newVulns.length === 0 ? (
                        <div className="text-[11px] text-emerald-500 py-4 text-center font-bold">
                          ✓ Excellent! No new threat vulnerabilities introduced.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                          {comparison.newVulns.map((v, i) => (
                            <div key={i} className="bg-rose-500/[0.03] border border-rose-500/15 p-2 rounded-lg flex items-start gap-2">
                              <span className="text-rose-500 font-bold text-xs mt-0.5">⚠️</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                                  {v.vulnerabilityType}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-zinc-400">
                                  <span className="text-rose-600 font-bold uppercase">{v.severity}</span>
                                  <span>•</span>
                                  <span className="truncate">{v.fileName}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan History Log Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5">Target / Repository Name</th>
                <th className="py-2.5"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-400" />Scan Date</span></th>
                <th className="py-2.5 text-center"><span className="flex items-center justify-center gap-1"><FileCode className="w-3.5 h-3.5 text-zinc-400" />Files</span></th>
                <th className="py-2.5 text-center"><span className="flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-400" />Duration</span></th>
                <th className="py-2.5 text-center"><span className="flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />Threats Tracked</span></th>
                <th className="py-2.5 text-center"><span className="flex items-center justify-center gap-1"><Activity className="w-3.5 h-3.5 text-zinc-400" />Risk Score</span></th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {history.map((scan) => {
                const isSelected = selectedScan?.id === scan.id;
                const openCount = scan.vulnerabilities.filter(v => v.status === 'Needs Review').length;

                return (
                  <tr 
                    key={scan.id} 
                    onClick={() => handleView(scan)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-violet-50/50 dark:bg-violet-950/10 font-medium' 
                        : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-850/15'
                    }`}
                  >
                    <td className="py-3.5 font-bold text-zinc-800 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          scan.riskScore >= 90 ? 'bg-emerald-500' : scan.riskScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className="truncate max-w-[200px]" title={scan.repoName}>{scan.repoName}</span>
                        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {scan.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      {scan.date}
                    </td>
                    <td className="py-3.5 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {scan.totalFiles}
                    </td>
                    <td className="py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">
                      {(scan.durationMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-3.5 text-center">
                      {openCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px]">
                          {openCount} Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                          ✓ Clear
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-mono">
                      <span className={`text-sm font-extrabold ${
                        scan.riskScore >= 90 ? 'text-emerald-500' : scan.riskScore >= 75 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {scan.riskScore}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">/100</span>
                    </td>
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleView(scan)}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all"
                          title="View detailed results from this checkpoint"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadReport(scan, e)}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all"
                          title="Download security assessment report JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(scan.id, e)}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                          title="Delete scan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedScan && (
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Displaying security checkpoint: <strong className="text-zinc-700 dark:text-zinc-200">{selectedScan.repoName}</strong> ({selectedScan.date})
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedScan(null);
                // Reset parent to show modern default live baseline vulnerabilities list
                onLoadScanVulnerabilities(INITIAL_VULNERABILITIES, 'Workspace Baseline', 45);
              }}
              className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-lg font-bold"
            >
              Reset to Active Baseline
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
