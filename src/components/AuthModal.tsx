import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, accessToken: string, refreshToken: string) => void;
}

type AuthTab = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('developer');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setResetToken('');
    setNewPassword('');
    setRole('developer');
    setError(null);
    setSuccessMessage(null);
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
  };

  // 1. LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        onAuthSuccess(data.user, data.accessToken, data.refreshToken);
        resetForm();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all registry fields.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMessage('Account created successfully!');
      setTimeout(() => {
        onAuthSuccess(data.user, data.accessToken, data.refreshToken);
        resetForm();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed.');
      }

      setSuccessMessage('Reset token generated! Copy the token below or check console logs.');
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate reset link.');
    } finally {
      setLoading(false);
    }
  };

  // 4. RESET PASSWORD
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Please provide the reset token and your new password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset operation failed.');
      }

      setSuccessMessage('Password changed successfully! You can login now.');
      setTimeout(() => {
        switchTab('login');
        setPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { resetForm(); onClose(); }}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
      />

      {/* Main dialog box */}
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col"
      >
        {/* Header elements */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/10">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {activeTab === 'login' && 'Sign In'}
              {activeTab === 'register' && 'Create Account'}
              {activeTab === 'forgot' && 'Reset Request'}
              {activeTab === 'reset' && 'Reset Password'}
            </span>
          </div>
          <button 
            onClick={() => { resetForm(); onClose(); }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl flex gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold items-center"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl flex gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold items-center"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Forms according to tabs */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  onClick={() => switchTab('forgot')}
                  className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Enter 8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              New to Copilot Chat?{' '}
              <button 
                type="button" 
                onClick={() => switchTab('register')}
                className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Organization Security Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-bold cursor-pointer"
                >
                  <option value="developer">Developer (Standard scanning and reading)</option>
                  <option value="analyst">Security Analyst (Vulnerability diagnostic & fixing)</option>
                  <option value="auditor">Compliance Auditor (Read-only, export reports)</option>
                  <option value="admin">Administrator (Super user, user administration console)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 disabled:bg-zinc-200 dark:disabled:bg-zinc-800"
            >
              {loading ? 'Registering...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => switchTab('login')}
                className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {activeTab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Enter your email address and we will generate a password reset token. 
              In this preview environment, the token is printed to terminal logs and returned directly to the UI.
            </p>

            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  placeholder="your-registered-email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 disabled:bg-zinc-200 dark:disabled:bg-zinc-800"
            >
              {loading ? 'Requesting...' : 'Request Reset Token'}
              <KeyRound className="w-4 h-4" />
            </button>

            {resetToken && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase">Generated Reset Token</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs select-all text-violet-600 dark:text-violet-400 font-bold truncate flex-1">{resetToken}</span>
                  <button
                    type="button"
                    onClick={() => switchTab('reset')}
                    className="text-xs text-zinc-950 dark:text-white font-bold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-650 px-2.5 py-1 rounded-lg"
                  >
                    Go to Reset
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button 
                type="button" 
                onClick={() => switchTab('login')}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {activeTab === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Reset Token</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Paste reset token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Choose a strong password (8+ chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 disabled:bg-zinc-200 dark:disabled:bg-zinc-800"
            >
              {loading ? 'Saving...' : 'Save New Password'}
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <button 
                type="button" 
                onClick={() => switchTab('login')}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
              >
                Cancel and sign in
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
