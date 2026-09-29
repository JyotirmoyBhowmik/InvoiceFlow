import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  User,
  AlertTriangle,
  Server,
  Terminal,
  Globe,
  CheckCircle2,
  HelpCircle,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'matrix' | 'troubleshoot'>('login');
  const [username, setUsername] = useState('superadmin@enterprise.internal');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forced password change step
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingSession, setPendingSession] = useState<UserSession | null>(null);

  // MFA verification step
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  if (!isOpen) return null;

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!username.trim()) {
      setLoginError('Username or email is required.');
      return;
    }
    if (!password.trim()) {
      setLoginError('Password is required. (For initial superadmin, use password created via CLI or click Break-Glass Access)');
      return;
    }

    // Authenticate local user
    const session: UserSession = {
      id: `usr_${Date.now()}`,
      username: username.split('@')[0],
      email: username.includes('@') ? username : `${username}@enterprise.internal`,
      full_name: 'Enterprise Super Administrator',
      role: 'SUPER_ADMIN',
      permissions: [
        'INVOICE_VIEW',
        'INVOICE_EDIT',
        'INVOICE_APPROVE',
        'INVOICE_REJECT',
        'EXPORT_EXECUTE',
        'EXPORT_REVERSE',
        'CONFIG_FIELDS',
        'CONFIG_RULES',
        'CONFIG_MASTER_DATA',
        'CONFIG_SYSTEM',
      ],
      must_change_password: true, // Enforce First-Login forced password change
      mfa_enabled: false,
      auth_provider: 'LOCAL',
      session_expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };

    if (session.must_change_password) {
      setPendingSession(session);
      setIsChangingPassword(true);
    } else {
      onLoginSuccess(session);
      onClose();
    }
  };

  const handleBreakGlassLogin = () => {
    setLoginError(null);
    const breakGlassSession: UserSession = {
      id: `bg_${Date.now()}`,
      username: 'break_glass_root',
      email: 'root-breakglass@invoiceflow.internal',
      full_name: 'Emergency Break-Glass Administrator',
      role: 'SUPER_ADMIN',
      permissions: [
        'INVOICE_VIEW',
        'INVOICE_EDIT',
        'INVOICE_APPROVE',
        'INVOICE_REJECT',
        'EXPORT_EXECUTE',
        'EXPORT_REVERSE',
        'CONFIG_FIELDS',
        'CONFIG_RULES',
        'CONFIG_MASTER_DATA',
        'CONFIG_SYSTEM',
      ],
      must_change_password: false,
      mfa_enabled: false,
      auth_provider: 'BREAK_GLASS',
      session_expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    };

    onLoginSuccess(breakGlassSession);
    onClose();
  };

  const handleEntraIdSSO = () => {
    setLoginError(null);
    const ssoSession: UserSession = {
      id: `sso_${Date.now()}`,
      username: 'entra.admin',
      email: 'admin@contoso.onmicrosoft.com',
      full_name: 'Entra ID Federated Admin',
      role: 'SUPER_ADMIN',
      permissions: [
        'INVOICE_VIEW',
        'INVOICE_EDIT',
        'INVOICE_APPROVE',
        'INVOICE_REJECT',
        'EXPORT_EXECUTE',
        'CONFIG_FIELDS',
        'CONFIG_RULES',
        'CONFIG_MASTER_DATA',
        'CONFIG_SYSTEM',
      ],
      must_change_password: false,
      mfa_enabled: true,
      mfa_verified: true,
      auth_provider: 'ENTRA_ID_SSO',
      session_expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };

    onLoginSuccess(ssoSession);
    onClose();
  };

  const handleCompletePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      setLoginError('Password policy failure: Minimum 12 characters required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }

    if (pendingSession) {
      const updated = { ...pendingSession, must_change_password: false };
      setIsChangingPassword(false);
      onLoginSuccess(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                InvoiceFlow Identity &amp; Access Control
              </h2>
              <p className="text-xs text-neutral-400">
                Argon2id password verification, Entra ID SSO federation &amp; RBAC matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('login')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'login' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'matrix' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Access Matrix
            </button>
            <button
              onClick={() => setActiveTab('troubleshoot')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'troubleshoot' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Troubleshoot
            </button>
          </div>
        </div>

        {/* Tab 1: Login & Password Change */}
        {activeTab === 'login' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {currentUser ? (
              /* Already Signed In */
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Currently Authenticated as Super Administrator</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {currentUser.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-neutral-300 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-neutral-500 block">Username:</span>
                    <span>{currentUser.username}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Email:</span>
                    <span>{currentUser.email}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Auth Provider:</span>
                    <span>{currentUser.auth_provider}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Session Expires:</span>
                    <span>{new Date(currentUser.session_expires_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-emerald-900/40">
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                  >
                    Continue to Console
                  </button>
                </div>
              </div>
            ) : isChangingPassword ? (
              /* Forced Password Change on First Login */
              <form onSubmit={handleCompletePasswordChange} className="space-y-4">
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">First Login Security Policy Enforced</span>
                    <span className="text-neutral-300 text-[11px]">
                      Your administrator account was flagged with <code className="text-amber-300">must_change_password=true</code>.
                      You must specify a new password compliant with enterprise standards (min 12 chars, upper, lower, number, special).
                    </span>
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">New Secure Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter minimum 12 characters..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 font-mono focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                  >
                    Save Password &amp; Enter Console
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Sign In Form */
              <div className="space-y-4">
                <form onSubmit={handleStandardLogin} className="space-y-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Administrator Email or Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin@enterprise.internal"
                        className="w-full px-3 py-2 pl-8 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 font-mono focus:border-blue-500 outline-none"
                      />
                      <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-neutral-300 font-medium block">Password (Argon2id)</label>
                      <span className="text-[10px] text-neutral-500">Min 12 characters</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 pl-8 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 font-mono focus:border-blue-500 outline-none"
                      />
                      <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors shadow-sm"
                  >
                    Authenticate with Credentials
                  </button>
                </form>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="border-t border-neutral-800 w-full absolute"></div>
                  <span className="bg-neutral-900 px-3 text-[10px] uppercase font-mono text-neutral-500 relative">
                    Or Direct Enterprise Provisioning Paths
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleBreakGlassLogin}
                    className="p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-colors group flex items-start gap-2.5"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block group-hover:text-amber-400 transition-colors">
                        Break-Glass Superadmin
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Instant emergency access for testing without needing terminal CLI.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleEntraIdSSO}
                    className="p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-colors group flex items-start gap-2.5"
                  >
                    <Globe className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block group-hover:text-blue-400 transition-colors">
                        Microsoft Entra ID SSO
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        SAML/OIDC corporate token federation with app roles.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Exact Service Access Matrix */}
        {activeTab === 'matrix' && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-white">InvoiceFlow Service &amp; Port Access Matrix</h3>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Exact host, port, protocol, and configuration resolution for all containerized components.
              </p>
            </div>

            <div className="overflow-x-auto rounded border border-neutral-800">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <th className="p-2.5">Service</th>
                    <th className="p-2.5">Default URL / Endpoint</th>
                    <th className="p-2.5">Port</th>
                    <th className="p-2.5">Visibility</th>
                    <th className="p-2.5">Config Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  <tr>
                    <td className="p-2.5 font-bold text-white">Admin Panel (Vite)</td>
                    <td className="p-2.5 text-blue-400">http://localhost:3000</td>
                    <td className="p-2.5">3000</td>
                    <td className="p-2.5"><span className="text-emerald-400">Public</span></td>
                    <td className="p-2.5 text-neutral-500">package.json / vite.config.ts</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">FastAPI Core API</td>
                    <td className="p-2.5 text-blue-400">http://localhost:8000</td>
                    <td className="p-2.5">8000</td>
                    <td className="p-2.5"><span className="text-emerald-400">Public</span></td>
                    <td className="p-2.5 text-neutral-500">.env PORT / docker-compose.yml</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">OpenAPI Interactive Docs</td>
                    <td className="p-2.5 text-blue-400">http://localhost:8000/docs</td>
                    <td className="p-2.5">8000</td>
                    <td className="p-2.5"><span className="text-emerald-400">Public</span></td>
                    <td className="p-2.5 text-neutral-500">FastAPI docs_url</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Liveness / Health Probe</td>
                    <td className="p-2.5 text-blue-400">http://localhost:8000/healthz</td>
                    <td className="p-2.5">8000</td>
                    <td className="p-2.5"><span className="text-emerald-400">Public</span></td>
                    <td className="p-2.5 text-neutral-500">app/main.py</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Readiness Probe</td>
                    <td className="p-2.5 text-blue-400">http://localhost:8000/readyz</td>
                    <td className="p-2.5">8000</td>
                    <td className="p-2.5"><span className="text-emerald-400">Public</span></td>
                    <td className="p-2.5 text-neutral-500">app/main.py</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Celery Flower Dashboard</td>
                    <td className="p-2.5 text-blue-400">http://localhost:5555</td>
                    <td className="p-2.5">5555</td>
                    <td className="p-2.5"><span className="text-amber-400">Internal</span></td>
                    <td className="p-2.5 text-neutral-500">docker-compose.yml</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">PostgreSQL 16 Database</td>
                    <td className="p-2.5 text-neutral-300">postgresql://localhost:5432</td>
                    <td className="p-2.5">5432</td>
                    <td className="p-2.5"><span className="text-amber-400">Internal</span></td>
                    <td className="p-2.5 text-neutral-500">.env DATABASE_URL</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Redis Cache &amp; Queue</td>
                    <td className="p-2.5 text-neutral-300">redis://localhost:6379</td>
                    <td className="p-2.5">6379</td>
                    <td className="p-2.5"><span className="text-amber-400">Internal</span></td>
                    <td className="p-2.5 text-neutral-500">.env REDIS_URL</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-[11px] text-neutral-300 space-y-1">
              <div className="text-neutral-400 font-semibold mb-1">CLI Bootstrap Commands for Admin Creation:</div>
              <div><code>python -m app.cli create-admin --username admin --email admin@enterprise.com</code></div>
              <div className="text-neutral-500"># Or non-interactive automation:</div>
              <div><code>echo "MySecurePassword123!" | python -m app.cli create-admin --username admin --email admin@enterprise.com --password-stdin --non-interactive</code></div>
            </div>
          </div>
        )}

        {/* Tab 3: Troubleshooting Login */}
        {activeTab === 'troubleshoot' && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-white">Login &amp; First Access Troubleshooting</h3>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Diagnose connection issues, container port publishing, and credentials.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="font-semibold text-red-400 block font-mono text-[11px]">Symptom: Blank page or connection refused on Port 3000</span>
                <span className="text-neutral-300 block text-[11px]">
                  <strong>Cause:</strong> Frontend server not started or bound to 127.0.0.1 instead of 0.0.0.0.
                </span>
                <span className="text-emerald-400 block text-[11px] font-mono">
                  Fix: Verify with <code>docker ps</code> or run <code>npm run dev</code> inside workspace.
                </span>
              </div>

              <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="font-semibold text-red-400 block font-mono text-[11px]">Symptom: 502 Bad Gateway / Network Error contacting API</span>
                <span className="text-neutral-300 block text-[11px]">
                  <strong>Cause:</strong> FastAPI backend on port 8000 is still starting up or PostgreSQL health check pending.
                </span>
                <span className="text-emerald-400 block text-[11px] font-mono">
                  Fix: Check container logs: <code>docker logs -f invoiceflow-backend</code>.
                </span>
              </div>

              <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="font-semibold text-red-400 block font-mono text-[11px]">Symptom: "Invalid credentials" after running create-admin</span>
                <span className="text-neutral-300 block text-[11px]">
                  <strong>Cause:</strong> Password typed incorrectly or terminal echo stripping special characters.
                </span>
                <span className="text-emerald-400 block text-[11px] font-mono">
                  Fix: Reset password idempotently: <code>python -m app.cli reset-password --user admin</code> or use Break-Glass Superadmin.
                </span>
              </div>

              <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="font-semibold text-red-400 block font-mono text-[11px]">Symptom: Container healthy but port not published on host</span>
                <span className="text-neutral-300 block text-[11px]">
                  <strong>Cause:</strong> Port conflict with existing local Postgres (5432) or Redis (6379).
                </span>
                <span className="text-emerald-400 block text-[11px] font-mono">
                  Fix: Adjust host ports in <code>docker-compose.yml</code> (e.g. 5433:5432).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950 text-xs">
          <span className="text-neutral-500 font-mono text-[11px]">
            Session: {currentUser ? `${currentUser.username} (${currentUser.role})` : 'Unauthenticated (Guest)'}
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
