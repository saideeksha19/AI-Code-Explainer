import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  Printer, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileCode, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  FileSpreadsheet, 
  Briefcase, 
  User, 
  Globe, 
  Check, 
  Eye,
  Info
} from 'lucide-react';
import { Vulnerability } from './SecurityData';

interface ReportGeneratorProps {
  vulnerabilities: Vulnerability[];
  healthScore: number;
  repoName: string;
  totalFilesScanned: number;
  isOpen: boolean;
  onClose: () => void;
}

// Full Security Compliance mapping rules for standard and custom vulnerabilities
export const getExtendedMappings = (vuln: Vulnerability) => {
  const type = vuln.vulnerabilityType.toLowerCase();
  const desc = vuln.explanation.toLowerCase();

  // 1. JWT / Cryptographic Key Fallbacks
  if (type.includes('jwt') || type.includes('key') || type.includes('crypto') || type.includes('hardcoded')) {
    return {
      cwe: 'CWE-321: Use of Hard-coded Cryptographic Key',
      cweId: 'CWE-321',
      mitre: 'T1552.001 - Unsecured Credentials: Credentials In Files',
      mitreId: 'T1552.001',
      compliance: [
        'PCI-DSS v4.0 Requirement 6.4.3: Secure key storage and authentication integrity.',
        'SOC 2 Type II CC6.1: Restrict physical & logical access to keys and credentials.',
        'ISO 27001 A.10.1.1: Policy on the use of cryptographic controls.',
        'HIPAA § 164.312(a)(2)(iv): Encryption and decryption access controls.'
      ],
      recommendation: 'Eliminate all fallback credentials from source code. Load cryptographic signature keys exclusively via zero-privileged system environment variables. Incorporate a key rotation policy.'
    };
  }

  // 2. Rate Limiting / DDoS
  if (type.includes('rate') || type.includes('limit') || type.includes('brute') || type.includes('dos')) {
    return {
      cwe: 'CWE-307: Improper Restriction of Excessive Authentication Attempts',
      cweId: 'CWE-307',
      mitre: 'T1110.001 - Brute Force: Password Guessing',
      mitreId: 'T1110.001',
      compliance: [
        'PCI-DSS v4.0 Requirement 8.1.6: Lockout mechanisms for repeated authentication attempts.',
        'SOC 2 Type II CC6.3: Implement boundaries, filters, and rate limiters on ingress endpoints.',
        'ISO 27001 A.18.1.3: Protection of system test data and API flood control.',
        'HIPAA § 164.312(a)(2)(v): Automatic logoff and rate restriction controls.'
      ],
      recommendation: 'Enforce rigid sliding-window rate limiters at the load balancer or application gateway level. Return HTTP status code 429 along with a transparent Retry-After header.'
    };
  }

  // 3. Password Requirements
  if (type.includes('password') || type.includes('auth') || type.includes('credential') || type.includes('length')) {
    return {
      cwe: 'CWE-521: Weak Password Requirements',
      cweId: 'CWE-521',
      mitre: 'T1110.002 - Brute Force: Password Cracking',
      mitreId: 'T1110.002',
      compliance: [
        'PCI-DSS v4.0 Requirement 8.3.1: Enforce strong multi-factor password structures and complexity.',
        'SOC 2 Type II CC6.1: Establish credentials strength validations on user sign-ups.',
        'ISO 27001 A.9.4.3: Use of high-entropy user password management systems.',
        'HIPAA § 164.312(a)(2)(i): Unique user identifier and access complexity constraints.'
      ],
      recommendation: 'Enforce a minimum length of 12+ characters with combinations of uppercase, lowercase, numeric, and special symbols. Reject common lists of weak breached passwords.'
    };
  }

  // 4. Missing Headers / Fingerprints
  if (type.includes('header') || type.includes('fingerprint') || type.includes('xss') || type.includes('leak')) {
    return {
      cwe: 'CWE-200: Exposure of Sensitive Information Through Sent Data',
      cweId: 'CWE-200',
      mitre: 'T1592 - Gather Victim Host Information: Software & Versions',
      mitreId: 'T1592',
      compliance: [
        'PCI-DSS v4.0 Requirement 6.5.1: Protect system endpoints against common web software injection.',
        'SOC 2 Type II CC7.1: Mitigate active scanning by disabling infrastructure fingerprints.',
        'ISO 27001 A.14.2.5: Secure system engineering principles and HTTP defenses.',
        'HIPAA § 164.312(c)(1): Integrity mechanisms to block reflective payload executions.'
      ],
      recommendation: 'Configure global server parameters to strip framework identifier headers (e.g., X-Powered-By). Deploy standard OWASP HTTP defense headers such as X-Content-Type-Options: nosniff.'
    };
  }

  // Default Fallback
  return {
    cwe: 'CWE-693: Protection Mechanism Failure',
    cweId: 'CWE-693',
    mitre: 'T1595 - Active Scanning: Vulnerability Mapping',
    mitreId: 'T1595',
    compliance: [
      'PCI-DSS v4.0 Requirement 6.3.2: Review custom code to detect vulnerabilities.',
      'SOC 2 Type II CC7.1: Monitor system vulnerabilities using SAST engines.',
      'ISO 27001 A.12.6.1: Management of technical vulnerabilities.',
      'HIPAA § 164.308(a)(8): Periodic evaluation of technical security controls.'
    ],
    recommendation: 'Incorporate automated static analysis testing (SAST) directly inside the continuous integration and deployment (CI/CD) pipelines to review code modifications continuously.'
  };
};

export default function ReportGenerator({
  vulnerabilities,
  healthScore,
  repoName,
  totalFilesScanned,
  isOpen,
  onClose
}: ReportGeneratorProps) {
  // Report configurations
  const [reportTitle, setReportTitle] = useState<string>('Aegis Enterprise SecOps Compliance Audit');
  const [auditorName, setAuditorName] = useState<string>('ddsaideeksha@gmail.com');
  const [selectedCompliance, setSelectedCompliance] = useState({
    pci: true,
    soc2: true,
    iso: true,
    hipaa: true
  });
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeCodeSnippets, setIncludeCodeSnippets] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'HTML' | 'DOCX' | 'JSON' | 'CSV'>('HTML');

  if (!isOpen) return null;

  // Compute counts
  const critical = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'Needs Review').length;
  const high = vulnerabilities.filter(v => v.severity === 'high' && v.status === 'Needs Review').length;
  const medium = vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'Needs Review').length;
  const low = vulnerabilities.filter(v => v.severity === 'low' && v.status === 'Needs Review').length;
  const totalOpen = critical + high + medium + low;
  const totalFixed = vulnerabilities.filter(v => v.status === 'Fixed').length;
  const totalTracked = vulnerabilities.length;

  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Dynamic Executive Summary
  const getExecutiveSummary = () => {
    const statusText = healthScore >= 90 
      ? 'Strong Security Posture' 
      : healthScore >= 70 
        ? 'Moderate Security Posture' 
        : 'Critical Action Required';

    return `This comprehensive compliance assessment was initiated on the codebase targeting "${repoName}". Aegis static application security testing (SAST) parsed and evaluated ${totalFilesScanned} source files. The codebase received a Security Posture Index of ${healthScore}/100, indicating a ${statusText.toLowerCase()}. A total of ${totalTracked} distinct threat vectors were tracked. Currently, ${totalFixed} vulnerabilities have been fully patched and verified, leaving ${totalOpen} active vulnerabilities that require immediate remediation to satisfy industrial compliance standards.`;
  };

  // Generate SVG Severity Pie Chart as raw SVG string
  const generateSeveritySvgString = () => {
    const total = (critical + high + medium + low) || 1;
    const critPct = (critical / total) * 100;
    const highPct = (high / total) * 100;
    const medPct = (medium / total) * 100;
    const lowPct = (low / total) * 100;

    // Standard high-quality SVG circle stroke representation
    return `
      <svg width="220" height="220" viewBox="0 0 36 36" style="margin: 0 auto; display: block;">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" stroke-width="3"></circle>
        
        <!-- Critical -->
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" stroke-width="3" 
                stroke-dasharray="${critPct} ${100 - critPct}" stroke-dashoffset="100"></circle>
        
        <!-- High -->
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" stroke-width="3" 
                stroke-dasharray="${highPct} ${100 - highPct}" stroke-dashoffset="${100 - critPct}"></circle>
        
        <!-- Medium -->
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308" stroke-width="3" 
                stroke-dasharray="${medPct} ${100 - medPct}" stroke-dashoffset="${100 - critPct - highPct}"></circle>
        
        <!-- Low -->
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" stroke-width="3" 
                stroke-dasharray="${lowPct} ${100 - lowPct}" stroke-dashoffset="${100 - critPct - highPct - medPct}"></circle>
        
        <g transform="translate(0, 0)">
          <text x="18" y="19" font-family="sans-serif" font-size="5" font-weight="bold" fill="#27272a" text-anchor="middle">${totalOpen}</text>
          <text x="18" y="24" font-family="sans-serif" font-size="2" fill="#71717a" text-anchor="middle">OPEN THREATS</text>
        </g>
      </svg>
    `;
  };

  // Generate SVG Progress Bar string
  const generateProgressBarSvgString = () => {
    const total = totalTracked || 1;
    const fixedPct = Math.round((totalFixed / total) * 100);
    const openPct = 100 - fixedPct;

    return `
      <svg width="100%" height="32" viewBox="0 0 400 32" style="display: block;">
        <rect x="0" y="8" width="400" height="16" rx="8" fill="#f4f4f5"></rect>
        <rect x="0" y="8" width="${400 * (fixedPct / 100)}" height="16" rx="8" fill="#10b981"></rect>
        <text x="12" y="19" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff">${fixedPct}% Remediated</text>
      </svg>
    `;
  };

  // Helper to compile report payload
  const buildReportPayload = () => {
    return {
      title: reportTitle,
      auditor: auditorName,
      date: currentDate,
      repo: repoName,
      filesScanned: totalFilesScanned,
      riskScore: healthScore,
      openThreats: totalOpen,
      remediatedThreats: totalFixed,
      summary: getExecutiveSummary(),
      complianceTargets: Object.entries(selectedCompliance)
        .filter(([_, active]) => active)
        .map(([key]) => key.toUpperCase()),
      vulnerabilities: vulnerabilities.map(v => {
        const ext = getExtendedMappings(v);
        return {
          id: v.id,
          fileName: v.fileName,
          lineRange: v.lineRange,
          type: v.vulnerabilityType,
          severity: v.severity.toUpperCase(),
          status: v.status,
          cvss: v.cvssScore,
          explanation: v.explanation,
          owasp: v.owaspCategory,
          cwe: ext.cwe,
          mitre: ext.mitre,
          compliance: ext.compliance,
          remediation: ext.recommendation,
          beforeCode: includeCodeSnippets ? v.beforeCode : '',
          afterCode: includeCodeSnippets ? v.afterCode : ''
        };
      })
    };
  };

  // 1. DOWNLOAD JSON
  const handleDownloadJSON = () => {
    const payload = buildReportPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    triggerDownload(dataStr, `aegis_secops_compliance_report_${Date.now()}.json`);
  };

  // 2. DOWNLOAD CSV
  const handleDownloadCSV = () => {
    const payload = buildReportPayload();
    const headers = ['Vulnerability ID', 'Target File', 'Line Range', 'Threat Type', 'Severity', 'Current Status', 'CVSS Score', 'OWASP Category', 'CWE Mapping', 'MITRE ATT&CK Mapping', 'Actionable Recommendation'];
    
    const rows = payload.vulnerabilities.map(v => [
      `"${v.id}"`,
      `"${v.fileName}"`,
      `"${v.lineRange}"`,
      `"${v.type.replace(/"/g, '""')}"`,
      `"${v.severity}"`,
      `"${v.status}"`,
      `"${v.cvss}"`,
      `"${v.owasp.replace(/"/g, '""')}"`,
      `"${v.cwe.replace(/"/g, '""')}"`,
      `"${v.mitre.replace(/"/g, '""')}"`,
      `"${v.remediation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    triggerDownload(dataStr, `aegis_secops_compliance_table_${Date.now()}.csv`);
  };

  // 3. DOWNLOAD HTML REPORT
  const getHTMLTemplate = () => {
    const payload = buildReportPayload();
    
    // Style sheets & layout building
    const complHTML = payload.complianceTargets.map(t => `
      <div class="card" style="border-left: 4px solid #8b5cf6; padding: 12px; background: #fafafa; border-radius: 8px;">
        <h4 style="margin: 0; color: #1f2937; font-size: 14px; font-weight: bold;">${t} Compliance Standard Mapping</h4>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
          All related security controls for the detected weaknesses align with certified ${t} audit parameters. See individual vulnerabilities for mapped security objectives.
        </p>
      </div>
    `).join('');

    const vulnsHTML = payload.vulnerabilities.map(v => {
      const isFixed = v.status === 'Fixed';
      const statusClass = isFixed ? 'badge-fixed' : 'badge-open';
      const severityClass = `badge-${v.severity.toLowerCase()}`;

      return `
        <div class="vulnerability-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 15px;">
            <div>
              <span class="badge ${severityClass}" style="font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;">${v.severity}</span>
              <span class="badge ${statusClass}" style="font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; margin-left: 6px;">${v.status}</span>
              <span style="font-family: monospace; font-size: 12px; color: #4b5563; margin-left: 10px; font-weight: bold;">${v.fileName}:${v.lineRange}</span>
            </div>
            <span style="font-weight: bold; font-size: 13px; color: #ef4444; font-family: monospace;">CVSS: ${v.cvss}</span>
          </div>
          
          <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 800;">${v.type}</h3>
          <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">${v.explanation}</p>
          
          <!-- Mappings Block -->
          <div style="display: grid; grid-template-cols: 1fr; md:grid-template-cols: 2fr; gap: 12px; background: #f9fafb; padding: 15px; border-radius: 10px; margin-bottom: 16px;">
            <div>
              <strong style="font-size: 11px; text-transform: uppercase; color: #9ca3af; display: block; margin-bottom: 3px;">OWASP 2021 Class</strong>
              <span style="font-size: 12px; color: #1f2937; font-weight: bold;">${v.owasp}</span>
            </div>
            <div style="margin-top: 8px;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #9ca3af; display: block; margin-bottom: 3px;">CWE Common Weakness</strong>
              <span style="font-size: 12px; color: #1f2937; font-weight: bold; font-family: monospace;">${v.cwe}</span>
            </div>
            <div style="margin-top: 8px;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #9ca3af; display: block; margin-bottom: 3px;">MITRE ATT&CK Matrix</strong>
              <span style="font-size: 12px; color: #1f2937; font-weight: bold; font-family: monospace;">${v.mitre}</span>
            </div>
          </div>

          <!-- Compliance Checklist -->
          <div style="margin-bottom: 16px;">
            <strong style="font-size: 11px; text-transform: uppercase; color: #9ca3af; display: block; margin-bottom: 5px;">Compliance Standards Alignment</strong>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #374151; line-height: 1.5;">
              ${v.compliance.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
            </ul>
          </div>

          <!-- Recommendations -->
          <div style="border-left: 3px solid #10b981; padding-left: 12px; margin-bottom: 16px;">
            <strong style="font-size: 11px; text-transform: uppercase; color: #059669; display: block; margin-bottom: 2px;">Remediation Recommendation</strong>
            <p style="margin: 0; font-size: 12px; color: #111827; line-height: 1.5; font-weight: 500;">${v.remediation}</p>
          </div>

          ${includeCodeSnippets ? `
            <!-- Code Block Compare -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 15px;">
              <div style="background: #18181b; border-radius: 8px; overflow: hidden; font-family: monospace; font-size: 11px;">
                <div style="background: #ef4444/15; padding: 6px 12px; color: #fca5a5; font-weight: bold; border-bottom: 1px solid #3f3f46;">Before Fix (Vulnerable Source)</div>
                <pre style="margin: 0; padding: 12px; color: #f4f4f5; overflow-x: auto; font-family: monospace;"><code>${escapeHTML(v.beforeCode)}</code></pre>
              </div>
              <div style="background: #18181b; border-radius: 8px; overflow: hidden; font-family: monospace; font-size: 11px; margin-top: 10px;">
                <div style="background: #10b981/15; padding: 6px 12px; color: #6ee7b7; font-weight: bold; border-bottom: 1px solid #3f3f46;">After Fix (Remediated Source)</div>
                <pre style="margin: 0; padding: 12px; color: #f4f4f5; overflow-x: auto; font-family: monospace;"><code>${escapeHTML(v.afterCode)}</code></pre>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${payload.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f4f5; color: #18181b; line-height: 1.5; padding: 40px 20px; }
          .container { max-width: 900px; margin: 0 auto; }
          .header { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 8px 0; }
          .meta { font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .score-card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
          .score-val { font-size: 36px; font-weight: 900; color: #8b5cf6; }
          .summary-box { background: #8b5cf6/5; border-left: 4px solid #8b5cf6; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
          .badge-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
          .badge-high { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
          .badge-medium { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
          .badge-low { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
          .badge-fixed { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
          .badge-open { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
          @media print {
            body { background: white; padding: 0; }
            .container { max-width: 100%; }
            .vulnerability-card { page-break-inside: avoid; }
            .score-grid { grid-template-columns: 1fr 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${payload.title}</h1>
            <div class="meta">AUDITOR: ${payload.auditor} | DATE: ${payload.date}</div>
            
            <div class="summary-box">
              <strong style="font-size: 12px; text-transform: uppercase; color: #8b5cf6;">Executive Summary</strong>
              <p style="margin: 6px 0 0 0; font-size: 14px; line-height: 1.6; color: #374151;">${payload.summary}</p>
            </div>

            <div class="score-grid">
              <div class="score-card">
                <span style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block;">Security Posture Index</span>
                <div class="score-val" style="color: ${healthScore >= 90 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#ef4444'}">${payload.riskScore}/100</div>
                <span style="font-size: 11px; font-weight: bold; color: #71717a;">Assessment Metric Score</span>
              </div>
              <div class="score-card">
                <span style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block;">Remediation Statistics</span>
                <div class="score-val" style="color: #6b7280;">${payload.remediatedThreats} / ${totalTracked}</div>
                <span style="font-size: 11px; font-weight: bold; color: #71717a;">Threat Vectors Patched</span>
              </div>
            </div>

            ${includeCharts ? `
              <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; display: grid; grid-template-columns: 1fr; md:grid-template-cols: 2fr; gap: 20px; align-items: center; justify-items: center;">
                <div style="text-align: center;">
                  <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; font-weight: bold;">Threat Severity Distribution</h4>
                  ${generateSeveritySvgString()}
                  <div style="display: flex; justify-content: center; gap: 8px; font-size: 10px; margin-top: 10px; font-weight: bold;">
                    <span style="color: #ef4444;">Critical: ${critical}</span>
                    <span style="color: #f97316;">High: ${high}</span>
                    <span style="color: #eab308;">Medium: ${medium}</span>
                    <span style="color: #3b82f6;">Low: ${low}</span>
                  </div>
                </div>
                <div style="width: 100%; max-width: 320px; text-align: center; margin-top: 20px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; font-weight: bold;">Remediation Completion Curve</h4>
                  ${generateProgressBarSvgString()}
                </div>
              </div>
            ` : ''}
          </div>

          <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; color: #4b5563; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Compliance Scope Mapping</h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 30px;">
            ${complHTML}
          </div>

          <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; color: #4b5563; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Security Vulnerability Details</h2>
          <div class="vulnerabilities-list">
            ${vulnsHTML}
          </div>

          <!-- Bottom compliance signoff -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; text-align: center; font-size: 11px; color: #9ca3af;">
            Report digitally compiled via Aegis Enterprise SecOps Engines. All source validation procedures occurred locally.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadHTML = () => {
    const html = getHTMLTemplate();
    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    triggerDownload(dataStr, `aegis_compliance_audit_report_${Date.now()}.html`);
  };

  // 4. PRINT / PDF INTEGRATION
  const handlePrintPDF = () => {
    const htmlContent = getHTMLTemplate();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Delay slightly to allow asset rendering, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      alert('Unable to open print preview. Please check and allow browser popups for this page.');
    }
  };

  // 5. DOWNLOAD DOCX FILE (Microsoft Word XML/HTML Format)
  const handleDownloadDOCX = () => {
    const payload = buildReportPayload();
    const htmlContent = getHTMLTemplate();

    // Word XML wrapped document
    const docxContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>${payload.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: "Calibri", sans-serif; color: #222222; }
          h1 { color: #8b5cf6; font-size: 24pt; font-weight: bold; }
          h2 { color: #4b5563; font-size: 16pt; border-bottom: 1px solid #cccccc; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          td, th { border: 1px solid #dddddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .vulnerability-box { border: 1px solid #cccccc; padding: 15px; background: #ffffff; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docxContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `aegis_compliance_audit_report_${Date.now()}.doc`);
    URL.revokeObjectURL(url);
  };

  const triggerDownload = (url: string, filename: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const escapeHTML = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                  Enterprise Compliance Audit Center
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Configure, map frameworks, and download professional assessment reports</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content - Side-by-side Configuration & Live Preview */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-150 dark:divide-zinc-800">
            
            {/* LEFT CONFIGURATION PANEL (5 Cols) */}
            <div className="p-5 lg:col-span-5 space-y-5">
              
              {/* Target Metadata Setup */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-violet-500 uppercase flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Report Identity Configuration</span>
                </span>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Report Document Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 text-xs font-semibold text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Certifying Auditor</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={auditorName}
                      onChange={(e) => setAuditorName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 text-xs font-semibold text-zinc-800 dark:text-zinc-100 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Compliance Standard Controls */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-violet-500 uppercase flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Regulatory Framework Mappings</span>
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCompliance(prev => ({ ...prev, pci: !prev.pci }))}
                    className={`p-2.5 border rounded-xl text-left transition-all flex items-start gap-2 ${
                      selectedCompliance.pci 
                        ? 'border-violet-500/30 bg-violet-500/[0.03] text-violet-700 dark:text-violet-400' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedCompliance.pci ? 'opacity-100 text-violet-500' : 'opacity-0'}`} />
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase">PCI-DSS v4.0</h4>
                      <p className="text-[8px] text-zinc-400 mt-0.5 leading-relaxed">Payment Cards Security</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedCompliance(prev => ({ ...prev, soc2: !prev.soc2 }))}
                    className={`p-2.5 border rounded-xl text-left transition-all flex items-start gap-2 ${
                      selectedCompliance.soc2 
                        ? 'border-violet-500/30 bg-violet-500/[0.03] text-violet-700 dark:text-violet-400' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedCompliance.soc2 ? 'opacity-100 text-violet-500' : 'opacity-0'}`} />
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase">SOC 2 Type II</h4>
                      <p className="text-[8px] text-zinc-400 mt-0.5 leading-relaxed">Trust & Security Audits</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedCompliance(prev => ({ ...prev, iso: !prev.iso }))}
                    className={`p-2.5 border rounded-xl text-left transition-all flex items-start gap-2 ${
                      selectedCompliance.iso 
                        ? 'border-violet-500/30 bg-violet-500/[0.03] text-violet-700 dark:text-violet-400' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedCompliance.iso ? 'opacity-100 text-violet-500' : 'opacity-0'}`} />
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase">ISO 27001</h4>
                      <p className="text-[8px] text-zinc-400 mt-0.5 leading-relaxed">InfoSec Controls Management</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedCompliance(prev => ({ ...prev, hipaa: !prev.hipaa }))}
                    className={`p-2.5 border rounded-xl text-left transition-all flex items-start gap-2 ${
                      selectedCompliance.hipaa 
                        ? 'border-violet-500/30 bg-violet-500/[0.03] text-violet-700 dark:text-violet-400' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedCompliance.hipaa ? 'opacity-100 text-violet-500' : 'opacity-0'}`} />
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase">HIPAA Security</h4>
                      <p className="text-[8px] text-zinc-400 mt-0.5 leading-relaxed">Healthcare ePHI Protection</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Extra Document Exclusions */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-violet-500 uppercase block tracking-wider">Report Components</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="rounded text-violet-500 focus:ring-violet-500 h-3.5 w-3.5 bg-zinc-100 border-zinc-300"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">Include Visual Dashboard & Charts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCodeSnippets}
                      onChange={(e) => setIncludeCodeSnippets(e.target.checked)}
                      className="rounded text-violet-500 focus:ring-violet-500 h-3.5 w-3.5 bg-zinc-100 border-zinc-300"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">Include Code Snippets & Diff Compare</span>
                  </label>
                </div>
              </div>

              {/* Format Select & Export Action */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 space-y-3">
                <label className="text-[10px] font-extrabold text-violet-500 uppercase block">Export Audit Document Format</label>
                <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-100 dark:bg-zinc-850 rounded-xl text-[10px] font-bold">
                  {(['HTML', 'PDF', 'DOCX', 'JSON', 'CSV'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`py-1.5 rounded-lg transition-all ${
                        selectedFormat === fmt 
                          ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow font-extrabold' 
                          : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {selectedFormat === 'HTML' && (
                  <button
                    onClick={handleDownloadHTML}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-violet-500/10"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Interactive HTML Report</span>
                  </button>
                )}

                {selectedFormat === 'PDF' && (
                  <button
                    onClick={handlePrintPDF}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-violet-500/10"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print to High-Fidelity PDF</span>
                  </button>
                )}

                {selectedFormat === 'DOCX' && (
                  <button
                    onClick={handleDownloadDOCX}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-violet-500/10"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Download MS Word (.doc) Report</span>
                  </button>
                )}

                {selectedFormat === 'JSON' && (
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-violet-500/10"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Download Structured Audit JSON</span>
                  </button>
                )}

                {selectedFormat === 'CSV' && (
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-violet-500/10"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download Tabular Threats CSV</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 p-2 bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/10 rounded-xl text-[10px] text-zinc-500">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>All PDF exports leverage native vectors ensuring crisp text layout and high fidelity printing.</span>
                </div>
              </div>

            </div>

            {/* RIGHT PREVIEW WORKSPACE (7 Cols) */}
            <div className="p-5 lg:col-span-7 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col min-h-[400px]">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>Live Audit Report Document Preview</span>
              </span>

              {/* Scrollable Document Container mimicking the printed sheet */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-2xl shadow-inner max-h-[500px] text-zinc-800 dark:text-zinc-200 space-y-5 select-none text-[11px] leading-relaxed">
                
                {/* Preview Document Title Block */}
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-center">
                  <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{reportTitle}</h1>
                  <p className="text-[9px] text-zinc-400 uppercase font-bold mt-1">
                    Audited by: {auditorName} | Date: {currentDate.slice(0, 15)}
                  </p>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded-xl text-center border border-zinc-200/40">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase block">Security Health Score</span>
                    <span className={`text-base font-mono font-black ${healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {healthScore}/100
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded-xl text-center border border-zinc-200/40">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase block">Open Threats Index</span>
                    <span className="text-base font-mono font-black text-rose-500">
                      {totalOpen} / {totalTracked}
                    </span>
                  </div>
                </div>

                {/* Executive summary block */}
                <div className="p-3 bg-violet-500/[0.03] border-l-2 border-violet-500 rounded text-[10px]">
                  <strong className="text-violet-600 dark:text-violet-400 uppercase tracking-widest text-[8px] block mb-1">Executive Compliance Summary</strong>
                  <p className="text-zinc-600 dark:text-zinc-300 italic">{getExecutiveSummary()}</p>
                </div>

                {/* Mapped Frameworks Preview */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Scope Scanned Standards</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedCompliance).map(([key, active]) => active && (
                      <span key={key} className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase">
                        ✓ {key === 'pci' ? 'PCI-DSS v4.0' : key === 'soc2' ? 'SOC 2 Type II' : key === 'iso' ? 'ISO 27001' : 'HIPAA Security'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Vector Charts Placeholder inside Preview */}
                {includeCharts && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/40 text-center space-y-2">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase block">Report Charts Visualizer</span>
                    <div className="flex items-center justify-around gap-2 py-1">
                      <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 flex items-center justify-center font-mono font-bold text-[9px]">
                        {totalOpen} Open
                      </div>
                      <div className="flex-1 max-w-[120px] text-left space-y-1">
                        <div className="flex justify-between text-[8px]">
                          <span>Remediated</span>
                          <span className="font-bold text-emerald-500">{totalFixed}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(totalFixed/totalTracked)*100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations overview */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Strategic Recommendations Overview</span>
                  <div className="space-y-1.5">
                    {vulnerabilities.map((v, idx) => {
                      const ext = getExtendedMappings(v);
                      return (
                        <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-850 rounded-lg border border-zinc-250/20 text-[10px]">
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="text-zinc-800 dark:text-zinc-100">{v.vulnerabilityType}</span>
                            <span className="text-[8px] font-mono text-zinc-400">{v.cvssScore} / 10.0</span>
                          </div>
                          <p className="text-zinc-500 text-[9px] leading-relaxed mb-1.5">{ext.cwe} • {ext.mitre}</p>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.03] border-l border-emerald-500 pl-1.5 py-0.5">
                            <strong>Action: </strong> {ext.recommendation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
