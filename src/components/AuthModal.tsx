import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, User, LogIn, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [view, setView] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;
      } else if (view === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setRecoverySuccess(true);
        setLoading(false);
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      
      if (data?.url) {
        // Open in a new window to bypass iframe restrictions
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-md w-full glass-panel border border-dash-accent/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-dash-accent/10 rounded-full text-dash-accent">
                <Shield size={32} className="animate-pulse" />
              </div>
            </div>
            <div className="data-label text-dash-accent tracking-[0.3em] uppercase text-[10px]">Command Center Access</div>
            <h2 className="text-2xl font-bold text-dash-text tracking-tight uppercase">
              {view === 'login' ? 'Commander Login' : view === 'signup' ? 'Enlist Strategist' : 'Recover Access'}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {view === 'login' 
                ? 'Enter your email and password to access the Command Center' 
                : view === 'signup' 
                  ? 'Create your tactical profile to join the grandmaster ranks.'
                  : 'Enter your email to receive a secure recovery link.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 pl-10 text-sm text-white focus:border-dash-accent outline-none transition-all"
                    placeholder="STRATEGIST_ID"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-3 pl-10 text-sm text-white focus:border-dash-accent outline-none transition-all"
                  placeholder="commander@gmail.com"
                />
              </div>
            </div>
            {view !== 'recovery' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 pl-10 pr-10 text-sm text-white focus:border-dash-accent outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-dash-accent transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {recoverySuccess && (
              <div className="flex items-center gap-2 p-3 bg-dash-accent/10 border border-dash-accent/20 rounded text-dash-accent text-xs font-mono">
                <Shield size={14} />
                Recovery link transmitted. Check your secure inbox.
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-dash-accent text-dash-bg font-bold uppercase tracking-widest text-xs rounded hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-dash-bg border-t-transparent rounded-full animate-spin" />
                ) : (
                  view === 'login' ? (
                    <>
                      <LogIn size={16} />
                      Login
                    </>
                  ) : view === 'signup' ? (
                    <>
                      <Shield size={14} />
                      Register Profile
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Transmit Link
                    </>
                  )
                )}
              </button>

              {view === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('recovery')}
                    className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dash-accent transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0a0c10] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white/5 border border-white/10 text-dash-text font-bold uppercase tracking-widest text-xs rounded hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-4 h-4"
              referrerPolicy="no-referrer"
            />
            Continue with Google
          </button>

          <div className="text-center space-y-4">
            <button
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setRecoverySuccess(false);
                setError(null);
              }}
              className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dash-accent transition-all"
            >
              {view === 'login' ? "Don't have an account? Register here" : "Already have a profile? Login here"}
            </button>
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter opacity-50">
              End-to-end encrypted session via Supabase 256-bit AES
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
