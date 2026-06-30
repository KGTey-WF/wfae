
import React, { useState, useEffect } from 'react';
import { Lock, User, KeyRound, AlertCircle, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

type LoginMode = 'LOGIN' | 'FORGOT' | 'SENT' | 'RESET';

const AdminLogin: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<LoginMode>('LOGIN');
  
  // Forgot password states
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Persist password in LocalStorage for local testing and persistence
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('admin_password') || 'WongFongE';
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.toLowerCase() === 'admin' && password === adminPassword) {
      onLoginSuccess();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSending(true);

    // Simulate sending email to the administrator
    setTimeout(() => {
      setIsSending(false);
      setMode('SENT');
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Persist new password
    localStorage.setItem('admin_password', newPassword);
    setAdminPassword(newPassword);
    
    // Switch back to login with success alert/message
    setMode('LOGIN');
    setPassword('');
    setError('');
    alert('Password updated successfully! You can now log in with your new password.');
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            {mode === 'LOGIN' && <Lock size={32} />}
            {mode === 'FORGOT' && <Mail size={32} />}
            {mode === 'SENT' && <CheckCircle2 size={32} className="text-emerald-400" />}
            {mode === 'RESET' && <ShieldCheck size={32} className="text-indigo-400" />}
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'LOGIN' && 'Admin Portal'}
            {mode === 'FORGOT' && 'Password Recovery'}
            {mode === 'SENT' && 'Reset Link Sent'}
            {mode === 'RESET' && 'Set New Password'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'LOGIN' && 'Authorized Access Only'}
            {mode === 'FORGOT' && 'Enter admin email to request reset'}
            {mode === 'SENT' && 'Simulated dispatch successful'}
            {mode === 'RESET' && 'Create a strong new password'}
          </p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mx-8 mt-6 bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3 text-sm animate-in shake duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT');
                      setError('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              Authenticate
            </button>
          </form>
        )}

        {/* MODE: FORGOT */}
        {mode === 'FORGOT' && (
          <form onSubmit={handleForgotPassword} className="p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Please enter the registered administrator email. A password reset instruction will be generated and simulated.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="kayguan.tey@wongfong.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? 'Sending Reset Email...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          </form>
        )}

        {/* MODE: SENT */}
        {mode === 'SENT' && (
          <div className="p-8 text-center space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-slate-700 space-y-3">
              <p className="text-sm font-medium">
                A password reset request has been dispatched to:
              </p>
              <p className="font-bold text-indigo-600 text-sm break-all select-all">
                {email || 'kayguan.tey@wongfong.com'}
              </p>
              <div className="h-px bg-emerald-100/60 my-2" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Since this is a client-side environment, we have generated an active, direct recovery link below for you to perform the reset instantly.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('RESET');
                }}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                Click Reset Link
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          </div>
        )}

        {/* MODE: RESET */}
        {mode === 'RESET' && (
          <form onSubmit={handleResetPassword} className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                Save New Password
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            SYSTEM NOTICE: All activities in the admin portal are logged. Unauthorized access attempts are prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
