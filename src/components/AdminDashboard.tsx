import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Trash2, 
  ShieldAlert as AlertIcon, 
  RotateCw, 
  Search, 
  Shield, 
  Database, 
  History, 
  ArrowLeft,
  Filter,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
  accessToken: string | null;
  currentUser: any;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function AdminDashboard({ onBack, accessToken, currentUser }: AdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: '1', action: 'User authentication (Login)', user: 'admin@aegis.io', ip: '192.168.1.42', timestamp: 'Just Now', status: 'SUCCESS' },
    { id: '2', action: 'Role escalation (developer ➜ admin)', user: 'system_root', ip: '127.0.0.1', timestamp: '5 mins ago', status: 'SUCCESS' },
    { id: '3', action: 'Security scan completed recursively', user: 'analyst@aegis.io', ip: '10.0.0.14', timestamp: '20 mins ago', status: 'SUCCESS' },
    { id: '4', action: 'Password reset token requested', user: 'forgotten_pwd@gmail.com', ip: '185.12.92.51', timestamp: '1 hour ago', status: 'WARNING' },
    { id: '5', action: 'Unauthorized access block to admin/users', user: 'malicious_actor@tor.org', ip: '82.201.10.3', timestamp: '3 hours ago', status: 'FAILED' }
  ]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users.');
      }
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error loading user records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);

  // Handle role modification
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role.');
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      // Log audit
      const targetUser = users.find(u => u.id === userId);
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: `Role updated for ${targetUser?.name || 'User'} ➜ ${newRole}`,
        user: currentUser?.email || 'admin@aegis.io',
        ip: '127.0.0.1',
        timestamp: 'Just Now',
        status: 'SUCCESS'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own active admin session.');
      return;
    }
    if (!confirm('Are you absolutely sure you want to permanently revoke and delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }

      const deletedUser = users.find(u => u.id === userId);
      setUsers(prev => prev.filter(u => u.id !== userId));

      // Log audit
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: `Account permanently deleted: ${deletedUser?.email}`,
        user: currentUser?.email || 'admin@aegis.io',
        ip: '127.0.0.1',
        timestamp: 'Just Now',
        status: 'WARNING'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  // Filter users based on query and role
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate quick metrics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const analystCount = users.filter(u => u.role === 'analyst').length;
  const isMockDB = users.some(u => u.isMock);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 overflow-y-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-850 pb-5">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Explainer Stage</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-violet-500" />
              <span>Identity & Access Administration (IAM)</span>
            </h1>
            <span className="text-[10px] bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-mono font-bold px-2 py-0.5 rounded uppercase">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-zinc-400">Manage user groups, security credentials, and view active platform logs</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all shadow-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Directory</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono mt-1 block">
              {loading ? '...' : totalUsers}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Administrators</span>
            <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono mt-1 block">
              {loading ? '...' : adminCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Analysts & Auditors</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {loading ? '...' : analystCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Identity Database</span>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mt-2.5">
              <Database className={`w-3.5 h-3.5 ${isMockDB ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
              <span>{isMockDB ? 'Memory (Sandbox)' : 'MongoDB Atlas'}</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <CheckCircle2 className={`w-5 h-5 ${isMockDB ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
        </div>
      </div>

      {/* Directory & Audit split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Directory Column */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">User Directory</h3>
              <p className="text-[10px] text-zinc-400">Search and manage platform roles and permissions</p>
            </div>

            {/* Filter / Search Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter by name/email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none text-zinc-900 dark:text-zinc-50 w-full font-medium"
                />
              </div>

              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-zinc-600 dark:text-zinc-300 border-none outline-none focus:ring-0 cursor-pointer p-0"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="developer">Developers</option>
                  <option value="analyst">Analysts</option>
                  <option value="auditor">Auditors</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertIcon className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 font-mono text-xs">
              <RotateCw className="w-8 h-8 text-violet-500 animate-spin mb-2" />
              <span>Scanning databases...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
              <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">No user records match</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Try modifying your query or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-2.5">User Identity</th>
                    <th className="pb-2.5">Platform Privilege Role</th>
                    <th className="pb-2.5">Registered</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/15">
                        <td className="py-3">
                          <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs px-2 py-1 font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:border-violet-500 cursor-pointer"
                          >
                            <option value="developer">Developer</option>
                            <option value="analyst">Analyst</option>
                            <option value="auditor">Auditor</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="py-3 font-mono text-[10px] text-zinc-400">
                          {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot delete self' : 'Permanently Delete User'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isSelf 
                                ? 'border-zinc-100 dark:border-zinc-850 text-zinc-300 dark:text-zinc-750 cursor-not-allowed'
                                : 'border-zinc-200 dark:border-zinc-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-100 dark:hover:border-rose-900/20'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Audit Log Column */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col min-h-[400px]">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-violet-500" />
              <span>Real-Time Audit Trail</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Security operation log events and logins</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {auditLogs.map((log) => {
              const statusColor = log.status === 'SUCCESS' 
                ? 'bg-emerald-500' 
                : log.status === 'WARNING' 
                  ? 'bg-amber-500' 
                  : 'bg-red-500';
              return (
                <div 
                  key={log.id} 
                  className="p-2.5 bg-zinc-50/70 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
                      {log.action}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${statusColor}`} title={log.status} />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span className="truncate max-w-[120px]" title={log.user}>{log.user}</span>
                    <span>{log.ip}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 font-semibold">{log.timestamp}</div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-850 pt-3 text-[10px] text-zinc-400 font-semibold flex items-center justify-between">
            <span>Enforcing SOC-2 logging guidelines</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
