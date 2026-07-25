export type AnalysisMode = 
  | 'explain' 
  | 'optimize' 
  | 'comments' 
  | 'debug' 
  | 'convert'
  | 'explain-errors'
  | 'generate-docs'
  | 'generate-tests'
  | 'code-review'
  | 'code-smells'
  | 'time-complexity'
  | 'space-complexity'
  | 'refactor';

export interface CodeMetrics {
  timeComplexity: string;
  spaceComplexity: string;
  qualityScore: number;
  issuesCount: number;
  keyConcepts: string[];
}

export interface LineExplanation {
  lineRange: string;
  codeSnippet: string;
  explanation: string;
}

export interface CodeBug {
  bug: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface SecurityIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

export interface CodeImprovement {
  point: string;
  description: string;
}

export interface DryRunStep {
  step: string;
  variablesState: string;
  description: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  topic: string;
}

export interface AnalysisResult {
  // Required fields for EVERY response based on Phase 1 instructions
  summary: string;
  lineByLineExplanation: LineExplanation[];
  timeComplexity: string;
  spaceComplexity: string;
  bestPractices: string[];
  potentialBugs: CodeBug[];
  securityIssues: SecurityIssue[];
  optimizedVersion: string;
  beginnerFriendlyExplanation: string;
  
  // Legacy / Additional fields from previous modes
  explanation?: string;
  qualityScore?: number;
  issuesCount?: number;
  keyConcepts?: string[];
  overallExplanation?: string;
  improvements?: CodeImprovement[];
  dryRun?: DryRunStep[];
  interviewQuestions?: InterviewQuestion[];
  bestComplexity?: string;
  averageComplexity?: string;
  worstComplexity?: string;
  complexityExplanation?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  code: string;
  language: string;
  mode: AnalysisMode;
  targetLanguage?: string;
  result: AnalysisResult;
}

export interface LanguageOption {
  value: string;
  label: string;
  extension: string;
  defaultSnippet: string;
}
