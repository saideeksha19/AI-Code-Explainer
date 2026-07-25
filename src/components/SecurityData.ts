export interface Vulnerability {
  id: string;
  fileName: string;
  lineRange: string;
  vulnerabilityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  owaspCategory: string;
  cvssScore: string;
  whyDangerous: string;
  secureFix: string;
  beforeCode: string;
  afterCode: string;
  bestPractices: string[];
  references: string[];
  status: 'Fixed' | 'Needs Review';
}

export const INITIAL_VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-1',
    fileName: 'src/backend/config/jwt.ts',
    lineRange: '1 - 25',
    vulnerabilityType: 'Hardcoded Signature Key & Token Forgery Risk',
    severity: 'critical',
    explanation: 'The application was configured to fall back to a hardcoded string (\'YOUR_SUPER_SECRET_JWT_SIGNING_KEY\') when the process.env.JWT_SECRET environment variable was missing or unconfigured. This allowed malicious actors to forge arbitrary JWT claims and bypass authentication mechanisms entirely, granting complete control over server operations.',
    owaspCategory: 'A02:2021-Cryptographic Failures',
    cvssScore: '9.8',
    whyDangerous: 'Since the fallback key is public/constant, any external actor could sign their own JSON Web Tokens claiming admin authorization. They could then send requests to secure backend endpoints, fully bypassing authentication checks without knowing a real password.',
    secureFix: 'Introduced a dynamic, high-entropy (512-bit) cryptographically secure random secret initialization flow. The signature key is generated on boot and stored with highly restricted permissions (0o600) in `.jwt_secret.key` to maintain authentication state stability across server restarts while precluding dictionary/pre-calculation token forgery attacks.',
    beforeCode: `// Old vulnerable signature verification fallback
const token = req.headers.authorization.split(' ')[1];
const decoded = jsonwebtoken.verify(
  token,
  process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_JWT_SIGNING_KEY'
);`,
    afterCode: `// New secure configuration in src/backend/config/jwt.ts
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const secretPath = path.join(process.cwd(), '.jwt_secret.key');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing && existing.length >= 32) return existing;
    }
  } catch (err) {}

  const newSecret = crypto.randomBytes(64).toString('hex');
  try {
    fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
  } catch (err) {}
  return newSecret;
})();`,
    bestPractices: [
      'Never commit cryptographic secret keys or private fallback keys directly into version control systems.',
      'Use highly secure cryptographically random bytes of at least 256 bits or 512 bits to sign tokens.',
      'Restrict filesystem access configurations to local credential files to minimize host privilege levels.'
    ],
    references: [
      'CWE-321: Use of Hard-coded Cryptographic Key',
      'OWASP Top 10:2021 - Cryptographic Failures',
      'RFC 7519: JSON Web Token (JWT) Security Considerations'
    ],
    status: 'Fixed'
  },
  {
    id: 'vuln-2',
    fileName: 'src/backend/middleware/rateLimiter.ts',
    lineRange: '1 - 60',
    vulnerabilityType: 'Missing Rate Limiting & Brute-Force Vulnerability',
    severity: 'high',
    explanation: 'Critical authentication endpoints (user registration, logins, password reset triggers) had no access rate controls. Attackers could perform high-velocity credential stuffing, brute-force queries, or initiate distributed denial of service (DDoS) requests on authentication backends without any constraints.',
    owaspCategory: 'A05:2021-Security Misconfiguration',
    cvssScore: '8.1',
    whyDangerous: 'An attacker could automate millions of login attempts using dictionary wordlists to crack weak passwords, or exhaust CPU resources and database connections to take down the auth service entirely.',
    secureFix: 'Designed and applied a high-precision sliding-window rate limiting middleware. Registered distinct strict policy limits: maximum 10 authorization requests per 15-minute window for registering/logging in, and 5 requests for resetting passwords, returning 429 Too Many Requests with correct headers.',
    beforeCode: `// No rate limiter on authentication endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);`,
    afterCode: `// Custom sliding-window rate limiters applied on sensitive routes
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15m
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again after 15 minutes.'
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);`,
    bestPractices: [
      'Implement global and route-specific rate limits to protect APIs from abuse and credential stuffing.',
      'Configure proxy headers trust setting securely (e.g., trust proxy) when running behind load balancers.',
      'Return standard HTTP Status 429 with Retry-After header fields to inform clients of limits.'
    ],
    references: [
      'CWE-307: Improper Restriction of Excessive Authentication Attempts',
      'OWASP Cheat Sheet: Denial of Service Defense',
      'OWASP Top 10:2021 - Security Misconfiguration'
    ],
    status: 'Fixed'
  },
  {
    id: 'vuln-3',
    fileName: 'src/backend/controllers/authController.ts',
    lineRange: '37 - 40, 249 - 252',
    vulnerabilityType: 'Weak Minimum Password Length Policy',
    severity: 'medium',
    explanation: 'The registration policy accepted passwords of just 6 characters. This is highly susceptible to fast offline hashing cracking, graphical processing unit (GPU) dictionary attacks, and low-entropy guess work, failing to meet standard modern password complexity guidelines.',
    owaspCategory: 'A07:2021-Identification and Authentication Failures',
    cvssScore: '5.3',
    whyDangerous: 'Extremely short passwords can be brute-forced in minutes if the database hashes are ever leaked or intercepted, significantly lowering the barrier for account takeovers.',
    secureFix: 'Upgraded minimum password rules to a strict 8-character standard across both the user registration controller and reset-password pipelines. Strengthened verification parameters inside the MongoDB User schema and matching React visual field guides.',
    beforeCode: `// Lax password requirement
if (password.length < 6) {
  return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
}`,
    afterCode: `// Modern safe minimum validation rules (8+ characters)
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
}`,
    bestPractices: [
      'Enforce password length requirements of at least 8 characters, ideally recommending 12+ characters.',
      'Optionally validate password strength against common patterns, sequential numbers, or known breached lists.',
      'Enforce password requirements on both client and server layers to guarantee input integrity.'
    ],
    references: [
      'CWE-521: Weak Password Requirements',
      'NIST Special Publication 800-63B: Digital Identity Guidelines',
      'OWASP Authentication Cheat Sheet'
    ],
    status: 'Fixed'
  },
  {
    id: 'vuln-4',
    fileName: 'server.ts',
    lineRange: '19 - 28',
    vulnerabilityType: 'Missing Security Headers & Fingerprint Leakage',
    severity: 'low',
    explanation: 'The server lacked vital HTTP defense headers and explicitly announced internal engine specs (Express header), making it trivial for attackers to map application architecture, launch targeted exploits, or execute MIME-sniffing drive-by scripts.',
    owaspCategory: 'A05:2021-Security Misconfiguration',
    cvssScore: '3.7',
    whyDangerous: 'Exposing exact framework versions makes it easy for attackers to find public CVEs for your stack, while lacking Content-Type headers enables cross-site scripting attacks via user file uploads.',
    secureFix: 'Disabled the default Express \'x-powered-by\' fingerprint header. Added specialized global middlewares to set secure HTTP headers: \'X-Content-Type-Options: nosniff\' to prevent content sniffing, \'X-XSS-Protection: 1; mode=block\' to lock client reflected scripts, and \'Referrer-Policy: strict-origin-when-cross-origin\'.',
    beforeCode: `// Missing server headers and Express fingerprint active
const app = express();
connectDB();
app.use(express.json({ limit: '10mb' }));`,
    afterCode: `// Restricting fingerprinting and setting custom defense headers
const app = express();
connectDB();

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});`,
    bestPractices: [
      'Always disable server runtime identification headers (like Server, X-Powered-By) in production.',
      'Implement strict Content-Type nosniff headers to instruct browsers not to run uploaded content.',
      'Configure standard security frameworks like Helmet to apply robust header configurations automatically.'
    ],
    references: [
      'CWE-200: Exposure of Sensitive Information Through Sent Data',
      'OWASP Top 10:2021 - Security Misconfiguration',
      'Mozilla Observatory Web Security Guidelines'
    ],
    status: 'Fixed'
  }
];

export const isSourceFile = (path: string): boolean => {
  const normalized = path.toLowerCase();
  
  const excludedPatterns = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    'coverage/',
    'vendor/',
    '.next/',
    'out/',
    '__tests__/',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'gradle-wrapper.jar',
    '.DS_Store'
  ];
  
  if (excludedPatterns.some(pattern => normalized.includes(pattern))) {
    return false;
  }
  
  const sourceExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb',
    '.php', '.cs', '.cpp', '.c', '.h', '.html', '.css', '.rs',
    '.swift', '.kt', '.kts', '.m', '.sh', '.yaml', '.yml'
  ];
  
  return sourceExtensions.some(ext => normalized.endsWith(ext));
};

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  language: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'sample-1',
    name: 'Broken JWT Auth Service',
    description: 'A Node.js/Express service that contains insecure cryptography, raw SQL injection, and a hardcoded token fallback key.',
    language: 'JavaScript',
    files: [
      {
        path: 'authService.js',
        content: `const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Vulnerable login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // CRITICAL: Raw SQL injection string concatenation
  const sql = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    
    const user = results[0];
    
    // CRITICAL: Hardcoded fallback secret allows arbitrary token forgery
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_JWT_SIGNING_KEY'
    );
    
    res.json({ token, role: user.role });
  });
});`
      }
    ]
  },
  {
    id: 'sample-2',
    name: 'Unsafe Flask Command Runner',
    description: 'A Python Flask backend utility designed to parse files that performs direct shell execution with unescaped input.',
    language: 'Python',
    files: [
      {
        path: 'logParser.py',
        content: `import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

# Vulnerable custom file path validator and parser
@app.route('/api/parse-log', methods=['POST'])
def parse_log():
    data = request.get_json()
    log_file = data.get('file_path')
    
    if not log_file:
        return jsonify({"error": "No file path provided"}), 400
        
    # CRITICAL: Vulnerable to shell Command Injection via unescaped string formatting
    command = f"cat {log_file} | grep -i 'error'"
    
    try:
        # executing shell=True runs the command directly in system shell
        output = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT)
        return jsonify({"results": output.decode('utf-8')})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Execution failed", "details": e.output.decode('utf-8')}), 500`
      }
    ]
  },
  {
    id: 'sample-3',
    name: 'Vulnerable C++ Buffer Manager',
    description: 'A C++ application utility containing buffer bounds overflow, format string risks, and missing boundary parameters.',
    language: 'C++',
    files: [
      {
        path: 'buffer_utils.cpp',
        content: `#include <iostream>
#include <cstring>
#include <cstdio>

// Vulnerable request logging structure
void handleClientRequest(const char* userInput, int inputLength) {
    char internalBuffer[64];
    
    // CRITICAL: Unbounded strcpy causes stack overflow if userInput is longer than 64 characters
    std::strcpy(internalBuffer, userInput);
    
    std::cout << "Buffer successfully copied: " << internalBuffer << std::endl;
    
    // CRITICAL: Format string vulnerability. Unsanitized user input passed directly to printf
    std::printf(userInput);
    std::printf("\\n");
}

int main() {
    char maliciousPayload[] = "%x %x %x %s overflowing the bounds with a super long input string...";
    handleClientRequest(maliciousPayload, std::strlen(maliciousPayload));
    return 0;
}`
      }
    ]
  }
];
