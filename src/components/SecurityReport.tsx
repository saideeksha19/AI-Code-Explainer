import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Copy,
  RefreshCw,
  X,
  Sparkles,
  Wand2,
  PlusCircle,
  Play,
  Check,
  AlertCircle,
  Bookmark,
  ExternalLink,
  Layers,
  Github,
  Trash2,
  PlayCircle,
  FileCode,
  LayoutGrid,
  Sun,
  Moon,
  Upload,
  FolderOpen,
  FileText
} from 'lucide-react';
import JSZip from 'jszip';

// Modular Imports
import { 
  Vulnerability, 
  INITIAL_VULNERABILITIES, 
  isSourceFile,
  SAMPLE_PROJECTS,
  SampleProject
} from './SecurityData';
import SecurityCharts from './SecurityCharts';
import FileTreeExplorer from './FileTreeExplorer';
import ScanTimeline from './ScanTimeline';
import ScanHistoryModule from './ScanHistoryModule';
import ReportGenerator from './ReportGenerator';

interface SecurityReportProps {
  onBack: () => void;
}

const getSeverityStyles = (severity: 'low' | 'medium' | 'high' | 'critical') => {
  switch (severity) {
    case 'critical':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30';
    case 'high':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30';
    default:
      return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  }
};

export default function SecurityReport({ onBack }: SecurityReportProps) {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(INITIAL_VULNERABILITIES);
  const [projectScanState, setProjectScanState] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [scannedFilesCount, setScannedFilesCount] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [currentScanningFile, setCurrentScanningFile] = useState('');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [projectScanName, setProjectScanName] = useState('');
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [scannedFilesList, setScannedFilesList] = useState<{ path: string; status: 'secure' | 'vulnerable' | 'error'; vulnerabilitiesCount: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeScanTab, setActiveScanTab] = useState<'zip' | 'folder' | 'github' | 'samples'>('samples');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('vuln-1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Playground States
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundBeforeCode, setPlaygroundBeforeCode] = useState('');
  const [playgroundFileName, setPlaygroundFileName] = useState('src/controllers/userController.ts');
  const [playgroundType, setPlaygroundType] = useState('SQL Injection Vulnerability');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Regeneration states for inline AI customization
  const [regDirectives, setRegDirectives] = useState<{ [id: string]: string }>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // --- Redesign Feature States ---
  const [selectedTreePath, setSelectedTreePath] = useState<string | null>(null);
  const [showReportCenter, setShowReportCenter] = useState(false);
  
  // Local light/dark mode override switcher
  const [darkModeLocal, setDarkModeLocal] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const nextDark = !darkModeLocal;
    setDarkModeLocal(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Recent Scans State (dynamic updates)
  const [recentScans, setRecentScans] = useState<Array<{
    id: string;
    name: string;
    type: string;
    filesCount: number;
    issuesFound: number;
    healthScore: number;
    date: string;
    status: 'Completed' | 'Needs Review' | 'Active';
  }>>([
    { id: 'scan-1', name: 'Baseline Security Audit', type: 'System Audit', filesCount: 14, issuesFound: 16, healthScore: 45, date: '22 Jun', status: 'Needs Review' },
    { id: 'scan-2', name: 'jwt.ts Signature Hotfix', type: 'Single File', filesCount: 1, issuesFound: 0, healthScore: 100, date: '25 Jun', status: 'Completed' },
    { id: 'scan-3', name: 'Rate Limiter Hardening', type: 'Single File', filesCount: 1, issuesFound: 0, healthScore: 100, date: '30 Jun', status: 'Completed' },
    { id: 'scan-4', name: 'Local Workspace Check', type: 'Workspace', filesCount: 4, issuesFound: 4, healthScore: 81, date: '04 Jul', status: 'Active' }
  ]);

  // Historical trend dataset (dynamic updates)
  const [trendData, setTrendData] = useState<Array<{
    id: string;
    date: string;
    total: number;
    critical: number;
    high: number;
    med: number;
    low: number;
    label: string;
  }>>([
    { id: 't-1', date: 'Jun 20', total: 12, critical: 3, high: 5, med: 3, low: 1, label: 'Initial Baseline' },
    { id: 't-2', date: 'Jun 25', total: 8, critical: 1, high: 4, med: 2, low: 1, label: 'Hotfix v1.1' },
    { id: 't-3', date: 'Jun 30', total: 5, critical: 1, high: 2, med: 1, low: 1, label: 'Security Hardening' },
    { id: 't-4', date: 'Jul 04', total: 4, critical: 1, high: 1, med: 1, low: 1, label: 'Workspace Audit' }
  ]);

  // General counts
  const total = vulnerabilities.length;
  const fixedCount = vulnerabilities.filter(v => v.status === 'Fixed').length;
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'Needs Review').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high' && v.status === 'Needs Review').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'Needs Review').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low' && v.status === 'Needs Review').length;

  // Real-time Dynamic Security Health Score
  // Calculated dynamically as: 100 - (CriticalCount * 15 + HighCount * 8 + MediumCount * 3 + LowCount * 1)
  const healthScore = Math.max(0, 100 - (criticalCount * 15 + highCount * 8 + mediumCount * 3 + lowCount * 1));

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetProjectScan = () => {
    setProjectScanState('idle');
    setScannedFilesCount(0);
    setTotalFilesCount(0);
    setCurrentScanningFile('');
    setScanLogs([]);
    setProjectScanName('');
    setScannedFilesList([]);
    setScanError(null);
  };

  const toggleStatus = (id: string) => {
    setVulnerabilities(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: v.status === 'Fixed' ? 'Needs Review' : 'Fixed'
        };
      }
      return v;
    }));
  };

  const handleScanFiles = async (filesToScan: { path: string; getContent: () => Promise<string> }[], sourceName: string) => {
    if (filesToScan.length === 0) {
      setScanError("No valid source files found to scan.");
      setProjectScanState('error');
      return;
    }

    setProjectScanName(sourceName);
    setTotalFilesCount(filesToScan.length);
    setScannedFilesCount(0);
    setProjectScanState('scanning');
    setScanLogs([
      `[INFO] Starting recursive security scan for "${sourceName}"...`, 
      `[INFO] Identified ${filesToScan.length} source file(s) for SAST scanning.`
    ]);
    setScannedFilesList([]);

    let localVulsFound = 0;
    const incomingVulnerabilities: Vulnerability[] = [];

    for (let i = 0; i < filesToScan.length; i++) {
      const current = filesToScan[i];
      setCurrentScanningFile(current.path);
      setScanLogs(prev => [...prev, `[SCANNING] File (${i + 1}/${filesToScan.length}): ${current.path}`]);

      try {
        const content = await current.getContent();
        if (!content || content.trim().length === 0) {
          setScanLogs(prev => [...prev, `[SKIP] ${current.path} is empty.`]);
          setScannedFilesList(prev => [...prev, { path: current.path, status: 'secure', vulnerabilitiesCount: 0 }]);
          setScannedFilesCount(i + 1);
          continue;
        }

        const response = await fetch('/api/scan-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: current.path,
            fileContent: content
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const vuls = data.vulnerabilities || [];

        if (vuls.length > 0) {
          localVulsFound += vuls.length;
          
          const mapped: Vulnerability[] = vuls.map((v: any, index: number) => ({
            id: `scanned-${Date.now()}-${i}-${index}`,
            fileName: current.path,
            lineRange: 'Dynamic AI Scan',
            vulnerabilityType: v.vulnerabilityType,
            severity: v.severity,
            explanation: v.explanation,
            owaspCategory: v.owaspCategory,
            cvssScore: v.cvssScore,
            whyDangerous: v.whyDangerous,
            secureFix: v.secureFix,
            beforeCode: v.beforeCode,
            afterCode: v.afterCode,
            bestPractices: v.bestPractices,
            references: v.references,
            status: 'Needs Review'
          }));

          incomingVulnerabilities.push(...mapped);
          setScanLogs(prev => [
            ...prev, 
            `[VULNERABLE] ⚠️ ${current.path}: Found ${vuls.length} security threat(s)!`
          ]);
          setScannedFilesList(prev => [...prev, { path: current.path, status: 'vulnerable', vulnerabilitiesCount: vuls.length }]);
        } else {
          setScanLogs(prev => [...prev, `[SECURE] ✅ ${current.path} is clean.`]);
          setScannedFilesList(prev => [...prev, { path: current.path, status: 'secure', vulnerabilitiesCount: 0 }]);
        }
      } catch (err: any) {
        console.error(`Failed to scan ${current.path}:`, err);
        setScanLogs(prev => [...prev, `[ERROR] ❌ Failed to scan ${current.path}: ${err.message || 'Network error'}`]);
        setScannedFilesList(prev => [...prev, { path: current.path, status: 'error', vulnerabilitiesCount: 0 }]);
      }

      setScannedFilesCount(i + 1);
    }

    if (incomingVulnerabilities.length > 0) {
      setVulnerabilities(prev => [...incomingVulnerabilities, ...prev]);
    }

    setProjectScanState('complete');
    setScanLogs(prev => [
      ...prev,
      `[COMPLETE] 🎉 Security scan completed for "${sourceName}"!`,
      `[SUMMARY] Processed ${filesToScan.length} files. Identified ${localVulsFound} vulnerabilities requiring review.`
    ]);

    // Update charts & timeline dynamically
    const batchHealth = Math.max(0, 100 - (localVulsFound * 15));
    const newScanEntry = {
      id: `scan-${Date.now()}`,
      name: sourceName,
      type: sourceName.toLowerCase().includes('github') ? 'GitHub' : sourceName.endsWith('.zip') ? 'ZIP' : 'Folder',
      filesCount: filesToScan.length,
      issuesFound: localVulsFound,
      healthScore: batchHealth,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      status: localVulsFound > 0 ? ('Needs Review' as const) : ('Completed' as const)
    };
    setRecentScans(prev => [newScanEntry, ...prev]);

    // Dispatch Aegis Add Scan event for Scan History Module registry
    const scanPayload = {
      repoName: sourceName,
      totalFiles: filesToScan.length,
      durationMs: Math.round((2.5 + Math.random() * 3) * 1000), // simulate realistic scan duration
      vulnerabilities: incomingVulnerabilities.length > 0 ? [...incomingVulnerabilities] : INITIAL_VULNERABILITIES.map(v => ({ ...v, status: 'Fixed' as const })),
      totalVulnerabilities: incomingVulnerabilities.length,
      riskScore: batchHealth,
      type: sourceName.toLowerCase().includes('github') ? 'GitHub' : sourceName.endsWith('.zip') ? 'ZIP' : 'Folder'
    };
    const event = new CustomEvent('aegis-add-scan', { detail: scanPayload });
    window.dispatchEvent(event);

    setTrendData(prev => [
      ...prev,
      {
        id: `trend-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: vulnerabilities.length + localVulsFound,
        critical: criticalCount + incomingVulnerabilities.filter(v => v.severity === 'critical').length,
        high: highCount + incomingVulnerabilities.filter(v => v.severity === 'high').length,
        med: mediumCount + incomingVulnerabilities.filter(v => v.severity === 'medium').length,
        low: lowCount + incomingVulnerabilities.filter(v => v.severity === 'low').length,
        label: `Scan: ${sourceName}`
      }
    ]);
  };

  const processZipFile = async (file: File) => {
    try {
      setProjectScanState('scanning');
      setScanLogs([`[INFO] Loading ZIP archive: "${file.name}"...`]);
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      const filesToScan: { path: string; getContent: () => Promise<string> }[] = [];
      
      loadedZip.forEach((relativePath, fileEntry) => {
        if (!fileEntry.dir && isSourceFile(relativePath)) {
          filesToScan.push({
            path: relativePath,
            getContent: async () => await fileEntry.async('text')
          });
        }
      });

      await handleScanFiles(filesToScan, file.name);
    } catch (err: any) {
      console.error(err);
      setProjectScanState('error');
      setScanError(err.message || 'Failed to read ZIP file.');
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processZipFile(file);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const filesToScan: { path: string; getContent: () => Promise<string> }[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = file.webkitRelativePath || file.name;
        if (isSourceFile(path)) {
          filesToScan.push({
            path,
            getContent: async () => await file.text()
          });
        }
      }
      
      const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Local Folder';
      await handleScanFiles(filesToScan, folderName);
    } catch (err: any) {
      console.error(err);
      setProjectScanState('error');
      setScanError(err.message || 'Failed to read folder contents.');
    }
  };

  const handleGithubScan = async () => {
    if (!githubUrlInput.trim()) return;
    
    try {
      setProjectScanState('scanning');
      setScanLogs([`[INFO] Querying GitHub Repository: ${githubUrlInput}...`, `[INFO] Requesting project ZIPball via backend proxy...`]);
      
      const response = await fetch(`/api/github-zip?githubUrl=${encodeURIComponent(githubUrlInput.trim())}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(blob);
      
      const filesToScan: { path: string; getContent: () => Promise<string> }[] = [];
      
      loadedZip.forEach((relativePath, fileEntry) => {
        const pathParts = relativePath.split('/');
        const cleanedPath = pathParts.slice(1).join('/');
        
        if (!fileEntry.dir && cleanedPath && isSourceFile(cleanedPath)) {
          filesToScan.push({
            path: cleanedPath,
            getContent: async () => await fileEntry.async('text')
          });
        }
      });
      
      const urlParts = githubUrlInput.split('/');
      const repoName = urlParts[urlParts.length - 1] || 'GitHub Repository';

      await handleScanFiles(filesToScan, repoName);
    } catch (err: any) {
      console.error(err);
      setProjectScanState('error');
      setScanError(err.message || 'Failed to download and scan GitHub repository.');
      setScanLogs(prev => [...prev, `[ERROR] ❌ ${err.message || 'Network error'}`]);
    }
  };

  const handleRunScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundBeforeCode.trim()) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeCode: playgroundBeforeCode,
          vulnerabilityType: playgroundType,
          fileName: playgroundFileName
        })
      });

      if (!response.ok) {
        throw new Error('SAST Remediation proxy failed to respond correctly.');
      }

      const result = await response.json();
      
      const newVulnerability: Vulnerability = {
        id: `vuln-gen-${Date.now()}`,
        fileName: result.fileName || playgroundFileName,
        lineRange: 'Dynamic AI Scan',
        vulnerabilityType: result.vulnerabilityType || playgroundType,
        severity: result.severity || 'high',
        explanation: result.explanation || 'Analyzed code structure.',
        owaspCategory: result.owaspCategory || 'OWASP Generic Category',
        cvssScore: result.cvssScore || '7.5',
        whyDangerous: result.whyDangerous || 'Vulnerable code could be exploited.',
        secureFix: result.secureFix || 'Applied standard secure practices.',
        beforeCode: playgroundBeforeCode,
        afterCode: result.afterCode || playgroundBeforeCode,
        bestPractices: result.bestPractices || ['Enforce sanitization rules.'],
        references: result.references || ['CWE standards'],
        status: 'Needs Review'
      };

      setVulnerabilities(prev => [newVulnerability, ...prev]);
      setExpandedId(newVulnerability.id);
      setShowPlayground(false);
      setPlaygroundBeforeCode('');
    } catch (err: any) {
      console.error('AI Remediation engine execution failed:', err);
      setScanError(err.message || 'Server error occurred.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegenerateFix = async (id: string, beforeCode: string, type: string, fileName: string) => {
    const directive = regDirectives[id] || '';
    setRegeneratingId(id);

    try {
      const response = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeCode,
          vulnerabilityType: type,
          fileName,
          customPrompt: directive
        })
      });

      if (!response.ok) throw new Error('AI regeneration service failed.');

      const result = await response.json();

      setVulnerabilities(prev => prev.map(v => {
        if (v.id === id) {
          return {
            ...v,
            vulnerabilityType: result.vulnerabilityType || v.vulnerabilityType,
            severity: result.severity || v.severity,
            explanation: result.explanation || v.explanation,
            owaspCategory: result.owaspCategory || v.owaspCategory,
            cvssScore: result.cvssScore || v.cvssScore,
            whyDangerous: result.whyDangerous || v.whyDangerous,
            secureFix: result.secureFix || v.secureFix,
            afterCode: result.afterCode || v.afterCode,
            bestPractices: result.bestPractices || v.bestPractices,
            references: result.references || v.references,
            status: 'Needs Review'
          };
        }
        return v;
      }));

      setRegDirectives(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error('Regeneration failed:', err);
      alert('AI Regeneration failed. Please try again.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vulnerabilities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `security_remediation_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // List filtering logic
  const filteredVulnerabilities = vulnerabilities.filter(v => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      v.fileName.toLowerCase().includes(query) ||
      v.vulnerabilityType.toLowerCase().includes(query) ||
      v.owaspCategory.toLowerCase().includes(query);

    const matchesSeverity = selectedSeverity === 'all' || v.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    
    // File tree hierarchy filtering
    const matchesTree = !selectedTreePath || 
      v.fileName === selectedTreePath ||
      v.fileName.startsWith(`${selectedTreePath}/`);

    return matchesSearch && matchesSeverity && matchesStatus && matchesTree;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Enterprise Redesigned Header Bar */}
      <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3 py-2 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/60 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-all border border-zinc-200/40 dark:border-zinc-700/30"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Workspace</span>
          </button>
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Aegis <span className="text-violet-500">Enterprise</span> SecOps
            </span>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2">
          {/* Animated Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200/40 dark:border-zinc-700/20"
            title="Toggle Dashboard Theme"
          >
            {darkModeLocal ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-violet-600" />
            )}
          </button>

          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Remediation Playground</span>
          </button>

          <button
            onClick={() => setShowReportCenter(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-violet-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:bg-white">
        
        {/* Print Title Block */}
        <div className="hidden print:block border-b-2 border-zinc-900 pb-4 mb-6 text-black">
          <h1 className="text-3xl font-extrabold">Aegis SecOps Enterprise Compliance Audit</h1>
          <p className="text-sm text-zinc-500 mt-1">Date: {new Date().toLocaleDateString()} | Strategy: OWASP Top 10 SAST</p>
          <p className="text-sm font-bold text-violet-600">Workspace Assessment Index: {healthScore}/100</p>
        </div>

        {/* Remediation Playground */}
        <AnimatePresence>
          {showPlayground && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-emerald-500/20 dark:border-emerald-500/10 shadow-lg space-y-4 print:hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
                    Remediation Agent Simulator
                  </h3>
                </div>
                <button onClick={() => setShowPlayground(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRunScanner} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Threat Type</label>
                    <input
                      type="text"
                      value={playgroundType}
                      onChange={(e) => setPlaygroundType(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">File Path</label>
                    <input
                      type="text"
                      value={playgroundFileName}
                      onChange={(e) => setPlaygroundFileName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Vulnerable Code Snippet</label>
                  <textarea
                    value={playgroundBeforeCode}
                    onChange={(e) => setPlaygroundBeforeCode(e.target.value)}
                    className="w-full min-h-[120px] bg-zinc-900 text-zinc-100 font-mono text-xs rounded-xl p-4 border border-zinc-800 outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="// Paste unsafe code"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPlayground(false)}
                    className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScanning || !playgroundBeforeCode.trim()}
                    className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Applying Patch...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Run AI Patch</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REDESIGN SECTION 1: Advanced KPI Cards, Health Arc, and Trend Graphs */}
        <SecurityCharts
          criticalCount={criticalCount}
          highCount={highCount}
          mediumCount={mediumCount}
          lowCount={lowCount}
          trendData={trendData}
          selectedSeverity={selectedSeverity}
          onSelectSeverity={setSelectedSeverity}
          healthScore={healthScore}
        />

        {/* REDESIGN SECTION 2: Split Bento Panels (File Tree Explorer & Scanners on Left, Scans & Timeline on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: File Tree & SAST Scanner Container */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* File Tree Component */}
            <FileTreeExplorer
              vulnerabilities={vulnerabilities}
              scannedFilesList={scannedFilesList}
              selectedTreePath={selectedTreePath}
              onSelectTreePath={setSelectedTreePath}
            />

            {/* SAST Scanner Control Center */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-500" />
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Repository Scanner
                  </h3>
                </div>
                {projectScanState !== 'idle' && (
                  <button onClick={resetProjectScan} className="text-zinc-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {projectScanState === 'idle' ? (
                <div className="space-y-4">
                  {/* Selector tabs */}
                  <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-850 rounded-xl text-[10px] font-bold">
                    <button
                      onClick={() => setActiveScanTab('samples')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all ${activeScanTab === 'samples' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      Samples
                    </button>
                    <button
                      onClick={() => setActiveScanTab('zip')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all ${activeScanTab === 'zip' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      ZIP File
                    </button>
                    <button
                      onClick={() => setActiveScanTab('folder')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all ${activeScanTab === 'folder' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      Folder
                    </button>
                    <button
                      onClick={() => setActiveScanTab('github')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all ${activeScanTab === 'github' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      GitHub Repo
                    </button>
                  </div>

                  {/* Scan Tab Contents */}
                  {activeScanTab === 'samples' && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Select an intentionally vulnerable sample project to run a live AI SAST scan and analyze threats.
                      </p>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {SAMPLE_PROJECTS.map((project) => (
                          <div 
                            key={project.id}
                            className="p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{project.name}</span>
                                <span className="text-[9px] bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-mono font-semibold px-1.5 py-0.5 rounded">
                                  {project.language}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-normal">
                                {project.description}
                              </p>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const filesToScan = project.files.map(f => ({
                                  path: f.path,
                                  getContent: async () => f.content
                                }));
                                await handleScanFiles(filesToScan, project.name);
                              }}
                              className="mt-2.5 w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 shadow-sm hover:scale-[1.01]"
                            >
                              <PlayCircle className="w-3 h-3" />
                              <span>Analyze & Scan</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeScanTab === 'zip' && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file?.name.endsWith('.zip')) await processZipFile(file);
                      }}
                      onClick={() => document.getElementById('zip-upload')?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-900/40'}`}
                    >
                      <input type="file" id="zip-upload" accept=".zip" onChange={handleZipUpload} className="hidden" />
                      <Upload className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">Drag & Drop ZIP</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5 block">or click to browse local files</span>
                    </div>
                  )}

                  {activeScanTab === 'folder' && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Securely read and analyze source file structures from a directory in your local system using high-accuracy AI.
                      </p>
                      <button
                        onClick={() => document.getElementById('folder-upload')?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Select Workspace Folder</span>
                      </button>
                      <input
                        type="file"
                        id="folder-upload"
                        {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
                        onChange={handleFolderUpload}
                        className="hidden"
                      />
                    </div>
                  )}

                  {activeScanTab === 'github' && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Supply a link to a public repository to fetch, deconstruct, and analyze vulnerabilities via backend.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={githubUrlInput}
                          onChange={(e) => setGithubUrlInput(e.target.value)}
                          placeholder="https://github.com/username/repo"
                          className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <button
                          onClick={handleGithubScan}
                          disabled={!githubUrlInput.trim()}
                          className="px-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs"
                        >
                          Scan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                    <span className="flex items-center gap-1 text-violet-500 font-extrabold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{projectScanState === 'scanning' ? 'Scanning...' : 'Completed'}</span>
                    </span>
                    <span>{scannedFilesCount}/{totalFilesCount} Files</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${(scannedFilesCount / (totalFilesCount || 1)) * 100}%` }} />
                  </div>
                  <div className="bg-zinc-950 font-mono text-[9px] text-zinc-300 p-2.5 rounded-xl max-h-[110px] overflow-y-auto space-y-1">
                    {scanLogs.slice(-4).map((log, idx) => (
                      <div key={idx} className="truncate leading-tight">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Scan History and Comparison Module (Occupies 2 Cols on Large Layouts) */}
          <div className="lg:col-span-2 space-y-6">
            <ScanHistoryModule
              currentVulnerabilities={vulnerabilities}
              onLoadScanVulnerabilities={(vulns) => {
                setVulnerabilities(vulns);
              }}
              onScanTriggered={() => setShowPlayground(true)}
            />
          </div>
        </div>

        {/* Executive Remediation Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Fixed Ratio</p>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-none mt-1">
                {total > 0 ? Math.round((fixedCount / total) * 100) : 100}%
              </h3>
              <p className="text-[9px] text-zinc-400 mt-1 font-mono">{fixedCount}/{total} Remediated</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Critical & High</p>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-none mt-1">
                {criticalCount + highCount}
              </h3>
              <p className="text-[9px] text-zinc-400 mt-1 font-mono">{criticalCount} Crit • {highCount} High</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Medium Risks</p>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-none mt-1">
                {mediumCount}
              </h3>
              <p className="text-[9px] text-zinc-400 mt-1 font-mono">Assigned Protocols</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Low Risks</p>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-none mt-1">
                {lowCount}
              </h3>
              <p className="text-[9px] text-zinc-400 mt-1 font-mono">Hardened System</p>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by file, type, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-750">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 rounded-xl py-1 px-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 rounded-xl py-1 px-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="Fixed">Fixed</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interactive Vulnerabilities List */}
        <div className="space-y-4 print:space-y-8">
          {filteredVulnerabilities.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 text-center py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No vulnerabilities match filter</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Reset search, tree, or severity filters to review codebases.</p>
            </div>
          ) : (
            filteredVulnerabilities.map((vuln) => {
              const isExpanded = expandedId === vuln.id;
              const severityColor = getSeverityStyles(vuln.severity);

              return (
                <div 
                  key={vuln.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden transition-all duration-200 print:border-zinc-300"
                >
                  {/* Accordion Trigger */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : vuln.id)}
                    className="p-5 flex items-start gap-4 justify-between cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-all print:cursor-default"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mt-0.5 shrink-0">
                        <FileCode2 className="w-4.5 h-4.5 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${severityColor}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                            {vuln.fileName}:{vuln.lineRange}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(vuln.id);
                            }}
                            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                              vuln.status === 'Fixed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                            }`}
                          >
                            {vuln.status === 'Fixed' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            )}
                            <span>{vuln.status}</span>
                          </button>
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {vuln.vulnerabilityType}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 print:hidden">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800/85"
                      >
                        <div className="p-5 space-y-5 bg-zinc-50/30 dark:bg-zinc-900/10">
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white dark:bg-zinc-850 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                              <Bookmark className="w-4 h-4 text-violet-500 shrink-0" />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">OWASP Class</p>
                                <p className="font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{vuln.owaspCategory}</p>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-850 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">CVSS 3.1 Severity</p>
                                <p className="font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{vuln.cvssScore} <span className="text-[10px] text-zinc-400">/10.0</span></p>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-850 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Auditing Verified</p>
                                <p className={`font-bold mt-0.5 ${vuln.status === 'Fixed' ? 'text-emerald-500' : 'text-amber-500'}`}>{vuln.status === 'Fixed' ? 'Remediated & Safe' : 'Awaiting Patch'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white dark:bg-zinc-850 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-1">
                              <div className="flex items-center gap-1 text-rose-500 font-bold mb-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Threat Vector Explanation</span>
                              </div>
                              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-semibold">{vuln.whyDangerous}</p>
                              <p className="text-zinc-400 text-[11px] pt-1.5 border-t border-zinc-100 dark:border-zinc-800"><span className="font-bold">Root Cause:</span> {vuln.explanation}</p>
                            </div>

                            <div className="bg-white dark:bg-zinc-850 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
                              <div className="flex items-center gap-1 text-emerald-500 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Remediation Solution</span>
                              </div>
                              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-semibold">{vuln.secureFix}</p>

                              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1 space-y-2">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase block">Regenerate Patch with Custom Directive</span>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={regDirectives[vuln.id] || ''}
                                    onChange={(e) => setRegDirectives(prev => ({ ...prev, [vuln.id]: e.target.value }))}
                                    placeholder="e.g. use standard crypto, restrict exceptions..."
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1 text-xs outline-none text-zinc-800 dark:text-zinc-150"
                                  />
                                  <button
                                    onClick={() => handleRegenerateFix(vuln.id, vuln.beforeCode, vuln.vulnerabilityType, vuln.fileName)}
                                    disabled={regeneratingId !== null}
                                    className="px-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                                  >
                                    <Wand2 className="w-3 h-3" />
                                    <span>Regen</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Diff */}
                          <div className="space-y-2 text-xs">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Remediation Code Diff</span>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/5 dark:bg-zinc-950">
                                <div className="bg-zinc-50 dark:bg-zinc-900 px-3.5 py-1.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Vulnerable Block
                                  </span>
                                  <button onClick={() => handleCopy(vuln.beforeCode, `${vuln.id}-before`)} className="text-[10px] text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
                                    {copiedId === `${vuln.id}-before` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <pre className="p-3.5 font-mono text-[10.5px] text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-[160px] bg-zinc-50/50 dark:bg-zinc-950">
                                  <code>{vuln.beforeCode}</code>
                                </pre>
                              </div>

                              <div className="border border-emerald-200 dark:border-emerald-950/40 rounded-xl overflow-hidden bg-emerald-500/5 dark:bg-zinc-950">
                                <div className="bg-emerald-50/30 dark:bg-zinc-900 px-3.5 py-1.5 border-b border-emerald-100 dark:border-zinc-800 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Secure Applied Patch
                                  </span>
                                  <button onClick={() => handleCopy(vuln.afterCode, `${vuln.id}-after`)} className="text-[10px] text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
                                    {copiedId === `${vuln.id}-after` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <pre className="p-3.5 font-mono text-[10.5px] text-zinc-700 dark:text-emerald-300 overflow-x-auto max-h-[160px] bg-emerald-50/10 dark:bg-zinc-950">
                                  <code>{vuln.afterCode}</code>
                                </pre>
                              </div>
                            </div>
                          </div>

                          {/* Guidelines / Education links */}
                          {vuln.bestPractices && vuln.bestPractices.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200/30 dark:border-zinc-800/30 text-xs">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Secure Architecture Guardrails</span>
                              <ul className="space-y-1 text-zinc-600 dark:text-zinc-300 font-semibold">
                                {vuln.bestPractices.map((bp, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-emerald-500">✓</span>
                                    <span>{bp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {vuln.references && vuln.references.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200/30 dark:border-zinc-800/30 text-xs">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Industry standards</span>
                              <div className="flex flex-wrap gap-1.5">
                                {vuln.references.map((ref, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 bg-white dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800 px-2.5 py-0.5 rounded-md text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                    <ExternalLink className="w-3 h-3 text-violet-400" />
                                    <span>{ref}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

      </div>

      <ReportGenerator
        vulnerabilities={vulnerabilities}
        healthScore={healthScore}
        repoName={projectScanName || 'Aegis Core Baseline'}
        totalFilesScanned={scannedFilesList.length || 14}
        isOpen={showReportCenter}
        onClose={() => setShowReportCenter(false)}
      />
    </div>
  );
}
