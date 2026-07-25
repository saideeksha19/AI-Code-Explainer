import { GoogleGenAI, Type } from '@google/genai';

// -----------------------------------------------------------------------------
// CLIENT INITIALIZATION
// -----------------------------------------------------------------------------

let aiClient: GoogleGenAI | null = null;

/**
 * Initializes and returns the Gemini client using the latest SDK.
 * Checks for the API key upfront and throws if missing.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Gemini API key is missing. Please configure the GEMINI_API_KEY environment variable in your .env file.'
      );
    }
    
    // Debug log to confirm key loading without exposing it
    console.log(`[Gemini Auth] Loaded API key starting with: ${apiKey.substring(0, 4)}... (length: ${apiKey.length})`);

    // The new @google/genai SDK takes an object with apiKey
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'ai-code-explainer',
        },
      },
    });
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// ERROR HANDLING WRAPPER
// -----------------------------------------------------------------------------

/**
 * A central wrapper to handle all API calls to Gemini and map SDK errors to user-friendly messages.
 */
async function callGemini(ai: GoogleGenAI, prompt: string, config: any) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini model returned an empty response.');
    }

    // The response text should be JSON due to responseMimeType: 'application/json'
    return JSON.parse(text);
  } catch (error: any) {
    const errorStr = String(error?.message || error);

    // Map common Google API Errors to friendly messages
    if (errorStr.includes('API_KEY_INVALID') || errorStr.includes('API key not valid')) {
      throw new Error('Your Gemini API key is invalid or revoked. Please get a new key from Google AI Studio and update your .env file.');
    }
    if (errorStr.includes('Quota') || errorStr.includes('429')) {
      throw new Error('Your Gemini API key has exceeded its quota or rate limit. Please try again later or upgrade your plan.');
    }
    if (errorStr.includes('not found') || errorStr.includes('404')) {
      throw new Error('The requested Gemini model was not found. Please ensure gemini-flash-latest is available for your API key.');
    }
    if (errorStr.includes('fetch') || errorStr.includes('network')) {
      throw new Error('A network error occurred while connecting to Google Gemini APIs. Please check your internet connection.');
    }

    // Re-throw generic or unknown errors
    throw new Error(`Gemini API Error: ${errorStr}`);
  }
}

// -----------------------------------------------------------------------------
// JSON SCHEMAS
// -----------------------------------------------------------------------------

/**
 * Shared JSON schema used across multiple tools to ensure consistent UI rendering.
 */
const STANDARD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    'summary',
    'lineByLineExplanation',
    'timeComplexity',
    'spaceComplexity',
    'bestPractices',
    'potentialBugs',
    'securityIssues',
    'optimizedVersion',
    'beginnerFriendlyExplanation'
  ],
  properties: {
    summary: { type: Type.STRING, description: "A comprehensive, high-level overview explaining what the code is trying to achieve." },
    lineByLineExplanation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['lineRange', 'codeSnippet', 'explanation'],
        properties: {
          lineRange: { type: Type.STRING },
          codeSnippet: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      },
      description: "An array of explanations mapping sequential parts of the code."
    },
    timeComplexity: { type: Type.STRING },
    spaceComplexity: { type: Type.STRING },
    bestPractices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of suggested best practices relevant to this code."
    },
    potentialBugs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['bug', 'severity', 'description', 'fix'],
        properties: {
          bug: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          description: { type: Type.STRING },
          fix: { type: Type.STRING }
        }
      }
    },
    securityIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['issue', 'severity', 'description', 'mitigation'],
        properties: {
          issue: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          description: { type: Type.STRING },
          mitigation: { type: Type.STRING }
        }
      }
    },
    optimizedVersion: { type: Type.STRING, description: "The complete, optimized, and fully-refactored version of the source code." },
    beginnerFriendlyExplanation: { type: Type.STRING, description: "A simple, analogy-driven explanation suitable for a beginner." },
    // Legacy fields for backward compatibility mapping
    explanation: { type: Type.STRING },
    qualityScore: { type: Type.INTEGER },
    issuesCount: { type: Type.INTEGER },
    keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
    overallExplanation: { type: Type.STRING },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['point', 'description'],
        properties: { point: { type: Type.STRING }, description: { type: Type.STRING } }
      }
    },
    dryRun: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['step', 'variablesState', 'description'],
        properties: { step: { type: Type.STRING }, variablesState: { type: Type.STRING }, description: { type: Type.STRING } }
      }
    },
    interviewQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['question', 'answer', 'topic'],
        properties: { question: { type: Type.STRING }, answer: { type: Type.STRING }, topic: { type: Type.STRING } }
      }
    },
    bestComplexity: { type: Type.STRING },
    averageComplexity: { type: Type.STRING },
    worstComplexity: { type: Type.STRING },
    complexityExplanation: { type: Type.STRING }
  }
};

// -----------------------------------------------------------------------------
// EXPLAIN CODE SERVICE
// -----------------------------------------------------------------------------

export interface AnalyzePayload {
  code: string;
  language?: string;
  mode: 'explain' | 'optimize' | 'comments' | 'debug' | 'convert' | 'explain-errors' | 'generate-docs' | 'generate-tests' | 'code-review' | 'code-smells' | 'time-complexity' | 'space-complexity' | 'refactor';
  targetLanguage?: string;
}

export async function generateCodeExplanation(payload: AnalyzePayload) {
  const { code, language, mode, targetLanguage } = payload;
  const ai = getGeminiClient();

  const systemInstruction = 
    "You are an elite, senior-level AI software engineering assistant and code explaining expert. " +
    "Your goal is to analyze, explain, and optimize user-provided code. You must provide a JSON output " +
    "conforming strictly to the requested schema.";

  let modeDescription = "";
  switch (mode) {
    case 'optimize': modeDescription = "Focus heavily on rewriting the code to optimize execution speed and memory usage."; break;
    case 'comments': modeDescription = "Focus on adding clean, exhaustive documentation and JSDoc/docstrings."; break;
    case 'debug': 
    case 'explain-errors': modeDescription = "Focus on finding logic flaws, memory leaks, security issues, or missing edge-cases."; break;
    case 'convert': modeDescription = `Focus on translating this code from ${language || 'source'} into highly correct ${targetLanguage || 'target language'}.`; break;
    case 'generate-docs': modeDescription = "Focus on generating comprehensive markdown documentation."; break;
    case 'generate-tests': modeDescription = "Focus on writing comprehensive unit tests."; break;
    case 'code-review': modeDescription = "Perform a thorough professional code review."; break;
    case 'code-smells': modeDescription = "Identify code smells and anti-patterns."; break;
    case 'time-complexity': 
    case 'space-complexity': modeDescription = "Focus entirely on analyzing and explaining the time and space complexity."; break;
    case 'refactor': modeDescription = "Focus on refactoring the code to be cleaner and more idiomatic."; break;
    default: modeDescription = "Provide a high-quality line-by-line explanation of how the code works."; break;
  }

  const prompt = `Analyze this ${language || 'source'} code:
\`\`\`${language || ''}
${code}
\`\`\`

Request Type: ${mode || 'explain'}
Guideline: ${modeDescription}

Your output must follow the JSON schema perfectly. Provide a detailed, professional explanation using the structured fields.`;

  return await callGemini(ai, prompt, {
    systemInstruction,
    temperature: 0.1,
    responseMimeType: 'application/json',
    responseSchema: STANDARD_RESPONSE_SCHEMA
  });
}

// -----------------------------------------------------------------------------
// VULNERABILITY REMEDIATION SERVICE
// -----------------------------------------------------------------------------

export interface RemediationPayload {
  vulnerabilityType?: string;
  beforeCode: string;
  fileName?: string;
  customPrompt?: string;
}

export interface RemediationResult {
  fileName: string;
  vulnerabilityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owaspCategory: string;
  cvssScore: string;
  explanation: string;
  whyDangerous: string;
  secureFix: string;
  beforeCode: string;
  afterCode: string;
  bestPractices: string[];
  references: string[];
}

export async function generateVulnerabilityRemediation(payload: RemediationPayload): Promise<RemediationResult> {
  const { vulnerabilityType, beforeCode, fileName, customPrompt } = payload;
  const ai = getGeminiClient();

  const systemInstruction = 
    "You are an elite, world-class DevSecOps engineer and application security auditor. " +
    "Analyze a given vulnerable code snippet, and generate a comprehensive, highly secure remediation report.";

  let prompt = `Analyze and remediate the following vulnerable code:\n\`\`\`\n${beforeCode}\n\`\`\``;
  if (vulnerabilityType) prompt += `\nIdentified Vulnerability Type: ${vulnerabilityType}`;
  if (fileName) prompt += `\nFile Name Context: ${fileName}`;
  if (customPrompt) prompt += `\nUser's Specific Custom Instructions: ${customPrompt}`;

  prompt += `\n\nGenerate the remediation output containing Vulnerability Explanation, Severity, OWASP Category, CVSS, Why Dangerous, Secure Fix, After Code, Best Practices, and References.`;

  return await callGemini(ai, prompt, {
    systemInstruction,
    temperature: 0.2,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: [
        'fileName', 'vulnerabilityType', 'severity', 'owaspCategory', 'cvssScore', 
        'explanation', 'whyDangerous', 'secureFix', 'beforeCode', 'afterCode', 
        'bestPractices', 'references'
      ],
      properties: {
        fileName: { type: Type.STRING },
        vulnerabilityType: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
        owaspCategory: { type: Type.STRING },
        cvssScore: { type: Type.STRING },
        explanation: { type: Type.STRING },
        whyDangerous: { type: Type.STRING },
        secureFix: { type: Type.STRING },
        beforeCode: { type: Type.STRING },
        afterCode: { type: Type.STRING },
        bestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
        references: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  });
}

// -----------------------------------------------------------------------------
// FILE SECURITY SCANNER SERVICE
// -----------------------------------------------------------------------------

export interface FileScanVulnerability {
  vulnerabilityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owaspCategory: string;
  cvssScore: string;
  explanation: string;
  whyDangerous: string;
  secureFix: string;
  beforeCode: string;
  afterCode: string;
  bestPractices: string[];
  references: string[];
}

export interface FileScanResult {
  vulnerabilities: FileScanVulnerability[];
}

export async function scanFileForVulnerabilities(fileName: string, fileContent: string): Promise<FileScanResult> {
  const ai = getGeminiClient();

  const systemInstruction = 
    "You are an elite Static Application Security Testing (SAST) tool powered by Gemini. " +
    "Analyze the provided source code file and identify actual security vulnerabilities. " +
    "If the file has no real vulnerabilities, return an empty array.";

  const prompt = `Analyze the following file for security vulnerabilities:\nFile Name: ${fileName}\nCode Content:\n\`\`\`\n${fileContent}\n\`\`\``;

  return await callGemini(ai, prompt, {
    systemInstruction,
    temperature: 0.1,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['vulnerabilities'],
      properties: {
        vulnerabilities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: [
              'vulnerabilityType', 'severity', 'owaspCategory', 'cvssScore',
              'explanation', 'whyDangerous', 'secureFix', 'beforeCode',
              'afterCode', 'bestPractices', 'references'
            ],
            properties: {
              vulnerabilityType: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
              owaspCategory: { type: Type.STRING },
              cvssScore: { type: Type.STRING },
              explanation: { type: Type.STRING },
              whyDangerous: { type: Type.STRING },
              secureFix: { type: Type.STRING },
              beforeCode: { type: Type.STRING },
              afterCode: { type: Type.STRING },
              bestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
              references: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    }
  });
}
