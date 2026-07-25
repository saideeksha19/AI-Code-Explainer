import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Lock, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound, 
  RefreshCw,
  Sliders,
  UserCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  accessToken: string | null;
  onProfileUpdate: (updatedUser: any, newAccessToken?: string) => void;
  timeoutMinutes: number;
  setTimeoutMinutes: (minutes: number) => void;
  isTimeoutEnabled: boolean;
  setIsTimeoutEnabled: (enabled: boolean) => void;
}

type ProfileTab = 'info' | 'password' | 'session';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  accessToken,
  onProfileUpdate,
  timeoutMinutes,
  setTimeoutMinutes,
  isTimeoutEnabled,
  setIsTimeoutEnabled
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // Info Tab Fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'developer');

  // Password Tab Fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync internal state when user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'developer');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const switchTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    resetMessages();
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // 1. UPDATE PROFILE INFO
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email cannot be blank.');
      return;
    }
    setLoading(true);
    resetMessages();

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name, email, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      onProfileUpdate(data.user, data.accessToken);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  // 2. CHANGE PASSWORD
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setError('Please provide current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    resetMessages();

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
      />

      {/* Main Container */}
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                My Security Profile
              </h3>
              <p className="text-[10px] text-zinc-400">Manage account information, credentials, and session policies</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 gap-4 text-xs font-semibold text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/30">
          <button
            onClick={() => switchTab('info')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'info' ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-extrabold' : 'border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Profile Info
          </button>
          <button
            onClick={() => switchTab('password')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'password' ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-extrabold' : 'border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Password & Security
          </button>
          <button
            onClick={() => switchTab('session')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'session' ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-extrabold' : 'border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Session Timeout
          </button>
        </div>

        {/* Status Alerts */}
        <div className="px-5 pt-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl flex gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold items-center"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl flex gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold items-center"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'developer', label: 'Developer', desc: 'Read/write, run scanner' },
                    { value: 'analyst', label: 'Security Analyst', desc: 'Advanced diagnostics, vulnerability reports' },
                    { value: 'auditor', label: 'Compliance Auditor', desc: 'Read-only view, full compliance reports' },
                    { value: 'admin', label: 'Super Admin', desc: 'All privileges, User Administration Dashboard' }
                  ].map((r) => {
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-2.5 border rounded-xl text-left transition-all flex flex-col ${
                          isSelected 
                            ? 'border-violet-500 bg-violet-500/[0.03] text-violet-700 dark:text-violet-400 shadow-sm' 
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {isSelected && <UserCheck className="w-3.5 h-3.5 text-violet-500" />}
                          {r.label}
                        </span>
                        <span className="text-[8px] text-zinc-400 mt-0.5 leading-relaxed truncate">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 cursor-pointer hidden" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Saving Changes...' : 'Update Account Info'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      placeholder="Min 8 chars"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Changing Password...' : 'Change Account Password'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'session' && (
            <div className="space-y-5">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">How Inactivity Logout Works</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                    To satisfy enterprise SOC 2 and PCI-DSS guidelines, sessions must be terminated automatically when left unattended. 
                    If enabled, a warning prompt will appear 30 seconds before your session expires, allowing you to click to extend your session.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Automatic Timeout Enforcement</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isTimeoutEnabled}
                      onChange={(e) => setIsTimeoutEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {isTimeoutEnabled && (
                  <div className="space-y-2.5 p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-150 dark:border-zinc-800 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inactivity Timeout Interval</span>
                      <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                        {timeoutMinutes === 1 ? '1 Minute' : `${timeoutMinutes} Minutes`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-400">1m</span>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={timeoutMinutes}
                        onChange={(e) => setTimeoutMinutes(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                      <span className="text-[10px] font-bold text-zinc-400">30m</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-zinc-500">
                      {[1, 5, 15, 30].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTimeoutMinutes(val)}
                          className={`py-1 rounded-lg border transition-all ${
                            timeoutMinutes === val
                              ? 'border-violet-500 bg-violet-500/[0.04] text-violet-600 dark:text-violet-400 font-black'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {val}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Session Identity: JWT State Verified</span>
                </span>
                <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase font-bold text-emerald-600 dark:text-emerald-400">Secure</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
