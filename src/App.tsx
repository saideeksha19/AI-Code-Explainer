import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricsPanel from './components/MetricsPanel';
import CodePanel from './components/CodePanel';
import ExplanationPanel from './components/ExplanationPanel';
import SecurityReport from './components/SecurityReport';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import AdminDashboard from './components/AdminDashboard';
import { AnalysisMode, AnalysisHistoryItem, AnalysisResult } from './types';
import { LANGUAGES } from './constants';

export default function App() {
  // Global code state
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [targetLanguage, setTargetLanguage] = useState<string>('typescript');
  const [activeMode, setActiveMode] = useState<AnalysisMode>('explain');
  const [showSecurityReport, setShowSecurityReport] = useState<boolean>(false);
  
  // Loading & Results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Dynamic User & Auth State
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Extended Security, Profile and Session States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(5);
  const [isTimeoutEnabled, setIsTimeoutEnabled] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [isTimeoutWarningOpen, setIsTimeoutWarningOpen] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Unified History (from Mongo when logged in, or localStorage when guest)
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : true;
  });

  // Apply dark mode on mount & change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load auth state and initial guest state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');

    if (storedUser && storedAccess) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccess);
        if (storedRefresh) {
          setRefreshToken(storedRefresh);
        }
      } catch (err) {
        console.error('Failed to parse logged user details:', err);
      }
    }

    // Load initial code snippet for JavaScript
    const defaultLang = LANGUAGES.find(l => l.value === 'javascript');
    if (defaultLang) {
      setCode(defaultLang.defaultSnippet);
    }
  }, []);

  // 1. Detect User Interactions to Reset Securing Token Timeout
  useEffect(() => {
    if (!user || !isTimeoutEnabled) {
      setIsTimeoutWarningOpen(false);
      return;
    }

    const handleUserActivity = () => {
      setLastActivity(Date.now());
      if (isTimeoutWarningOpen) {
        setIsTimeoutWarningOpen(false);
        setSecondsRemaining(30);
      }
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleUserActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [user, isTimeoutEnabled, isTimeoutWarningOpen]);

  // 2. Automated Token Inactivity Watcher Loop
  useEffect(() => {
    if (!user || !isTimeoutEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const warningMs = timeoutMs - 30000; // Warning starts 30 seconds before timeout

      if (isTimeoutWarningOpen) {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleLogout();
            setIsTimeoutWarningOpen(false);
            alert('Your secure session has timed out due to inactivity.');
            return 30;
          }
          return prev - 1;
        });
      } else if (elapsedMs >= warningMs) {
        setIsTimeoutWarningOpen(true);
        setSecondsRemaining(30);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isTimeoutEnabled, lastActivity, timeoutMinutes, isTimeoutWarningOpen]);

  // Sync / Load History
  useEffect(() => {
    if (user && accessToken) {
      fetchUserHistory(accessToken);
    } else {
      // Local history fallback for guest experience
      const storedHistory = localStorage.getItem('copilot_history');
      if (storedHistory) {
        try {
          setHistory(JSON.parse(storedHistory));
        } catch (err) {
          console.error('Error parsing guest history:', err);
        }
      } else {
        setHistory([]);
      }
    }
  }, [user, accessToken]);

  // Handle Token Expiry & Auto-Refresh helper
  const handleAutoRefreshToken = async (): Promise<string | null> => {
    const rToken = refreshToken || localStorage.getItem('refresh_token');
    if (!rToken) return null;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rToken })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          localStorage.setItem('access_token', data.accessToken);
          return data.accessToken;
        }
      } else {
        // Clear auth state to prevent infinite loops on expired tokens
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (err) {
      console.error('Auto-token renew process failed:', err);
    }
    return null;
  };

  // Fetch logged user history from Mongo backend
  const fetchUserHistory = async (token: string) => {
    try {
      const response = await fetch('/api/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Try token renew
        const renewedToken = await handleAutoRefreshToken();
        if (renewedToken) {
          fetchUserHistory(renewedToken);
          return;
        } else {
          // Clear auth state to prevent infinite loops on expired tokens
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      if (response.ok) {
        const data = await response.json();
        // Transform backend DB Explanation records into client-compatible Sidebar items
        const transformed: AnalysisHistoryItem[] = data.map((item: any) => ({
          id: item._id,
          title: item.title,
          timestamp: item.createdAt || new Date().toISOString(),
          code: item.code,
          language: item.language,
          mode: item.mode,
          targetLanguage: item.targetLanguage,
          result: item.result
        }));
        setHistory(transformed);
      }
    } catch (err) {
      console.error('Failed to load authenticated user history:', err);
    }
  };

  // Save auth credentials
  const handleAuthSuccess = (authUser: any, access: string, refresh: string) => {
    setUser(authUser);
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };

  // Handle Profile changes
  const handleProfileUpdate = (updatedUser: any, newAccessToken?: string) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      localStorage.setItem('access_token', newAccessToken);
    }
    // If the user role is no longer admin, hide the admin dashboard automatically
    if (updatedUser?.role !== 'admin') {
      setShowAdminDashboard(false);
    }
  };

  // Perform full server & client logout
  const handleLogout = async () => {
    try {
      const rToken = refreshToken || localStorage.getItem('refresh_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rToken })
      });
    } catch (err) {
      console.error('Server logout request errored:', err);
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Fallback back to guest history loaded from local storage
    const storedHistory = localStorage.getItem('copilot_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (err) {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  };

  // Select a historical item to reload
  const handleSelectHistory = (item: AnalysisHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setActiveMode(item.mode);
    if (item.targetLanguage) {
      setTargetLanguage(item.targetLanguage);
    }
    setResult(item.result);
  };

  // Delete a history item (DB deletion if logged-in, local-storage deletion if guest)
  const handleDeleteHistory = async (id: string) => {
    if (user && accessToken) {
      try {
        const res = await fetch(`/api/history/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (res.status === 401) {
          const renewedToken = await handleAutoRefreshToken();
          if (renewedToken) {
            await fetch(`/api/history/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${renewedToken}`
              }
            });
          }
        }
        
        // Refresh local history list
        fetchUserHistory(accessToken);
      } catch (err) {
        console.error('Failed to delete db history item:', err);
      }
    } else {
      // Local Guest storage update
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      localStorage.setItem('copilot_history', JSON.stringify(updated));
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire local analysis history?')) {
      setHistory([]);
      localStorage.setItem('copilot_history', JSON.stringify([]));
    }
  };

  // Triggered when clicking "New Session"
  const handleNewSession = () => {
    setResult(null);
    const selectedOption = LANGUAGES.find(l => l.value === language);
    if (selectedOption) {
      setCode(selectedOption.defaultSnippet);
    } else {
      setCode('');
    }
  };

  // Reset to empty state
  const handleReset = () => {
    setCode('');
    setResult(null);
  };

  // Analyze code using Express server -> Gemini API Proxy
  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      let response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          language,
          mode: activeMode,
          targetLanguage: activeMode === 'convert' ? targetLanguage : undefined
        })
      });

      // Handle token expiration & retry exactly once
      if (response.status === 401 && accessToken) {
        const renewedToken = await handleAutoRefreshToken();
        if (renewedToken) {
          headers['Authorization'] = `Bearer ${renewedToken}`;
          response = await fetch('/api/analyze', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              code,
              language,
              mode: activeMode,
              targetLanguage: activeMode === 'convert' ? targetLanguage : undefined
            })
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error status.');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      if (user && accessToken) {
        // Automatically sync & load newly persisted record from database
        fetchUserHistory(accessToken);
      } else {
        // Create local guest history title
        const cleanCode = code.trim();
        const firstLine = cleanCode.split('\n')[0].replace(/[\/*#]/g, '').trim();
        const title = firstLine.substring(0, 30) || `${activeMode.toUpperCase()} Analysis`;

        const newHistoryItem: AnalysisHistoryItem = {
          id: Date.now().toString(),
          title: title,
          timestamp: new Date().toISOString(),
          code,
          language,
          mode: activeMode,
          targetLanguage: activeMode === 'convert' ? targetLanguage : undefined,
          result: data
        };

        const updatedHistory = [newHistoryItem, ...history].slice(0, 25);
        setHistory(updatedHistory);
        localStorage.setItem('copilot_history', JSON.stringify(updatedHistory));
      }

    } catch (err: any) {
      console.error('Analysis error:', err);
      alert(`Analysis Failed: ${err.message || 'Please check connection.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Sidebar - responsive behavior */}
      <div className="hidden md:block h-full">
        <Sidebar
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          history={history}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
          onNewSession={handleNewSession}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          activeMode={activeMode}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          onReset={handleReset}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
          showSecurityReport={showSecurityReport}
          onToggleSecurityReport={() => setShowSecurityReport(!showSecurityReport)}
          showAdminDashboard={showAdminDashboard}
          onToggleAdminDashboard={() => setShowAdminDashboard(!showAdminDashboard)}
        />

        {/* Dashboard Stage */}
        {showAdminDashboard ? (
          <AdminDashboard 
            onBack={() => setShowAdminDashboard(false)} 
            accessToken={accessToken} 
            currentUser={user} 
          />
        ) : showSecurityReport ? (
          <SecurityReport onBack={() => setShowSecurityReport(false)} />
        ) : (
          <main className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col">
            {/* Top Diagnostics Dashboard */}
            <MetricsPanel
              metrics={result}
              isLoading={isLoading}
            />

            {/* Interactive Dual-Panel Split Code & Explanation */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
              {/* Left Hand Code Editor */}
              <CodePanel
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                activeMode={activeMode}
                isLoading={isLoading}
                onAnalyze={handleAnalyze}
                darkMode={darkMode}
              />

              {/* Right Hand Explanation & Insights */}
              <ExplanationPanel
                result={result}
                isLoading={isLoading}
                language={language}
                setCode={setCode}
              />
            </div>
          </main>
        )}
      </div>

      {/* Authentication Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile & Security Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onProfileUpdate={handleProfileUpdate}
        timeoutMinutes={timeoutMinutes}
        setTimeoutMinutes={setTimeoutMinutes}
        isTimeoutEnabled={isTimeoutEnabled}
        setIsTimeoutEnabled={setIsTimeoutEnabled}
      />

      {/* Session Timeout Warning Countdown Modal */}
      <SessionTimeoutModal
        isOpen={isTimeoutWarningOpen}
        secondsRemaining={secondsRemaining}
        onExtend={() => {
          setLastActivity(Date.now());
          setIsTimeoutWarningOpen(false);
          setSecondsRemaining(30);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
