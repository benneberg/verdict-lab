import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Arena } from './pages/Arena';
import { TestLab } from './pages/TestLab';
import { Registry } from './pages/Registry';
import { DressingRoom } from './pages/DressingRoom';
import { History } from './pages/History';
import { Leaderboard } from './pages/Leaderboard';
import { Beaker, FlaskConical, History as HistoryIcon, User, Settings as SettingsIcon, Mail, Lock, UserPlus, Info, CheckCircle2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/realtime';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useStore();
  
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs text-slate-500 uppercase bg-slate-50 tracking-widest gap-2">
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
        INITIALIZING_LAB_FACILITY...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function Login() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google login failed:', error);
      setError(error.message || 'Google Auth linkage failed.');
    }
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    if (isSignUp && !displayName) {
      setError('Please provide a Display Name.');
      return;
    }

    if (!supabase) {
      setError('Supabase connection string is missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Settings menu to activate credentials, or bypass using Guest Mode below.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              displayName: displayName
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccess('Account created successfully! You can now log in.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setError(signInError.message);
        } else if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || 'Researcher',
            isGuest: false
          });
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected auth failure occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    setUser({
      id: 'guest_user',
      email: 'guest@verdict-lab.internal',
      displayName: 'Guest Researcher',
      isGuest: true
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E5E4E1] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="lab-card max-w-md w-full bg-white shadow-2xl p-6 sm:p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tighter uppercase italic text-slate-900">Verdict Lab</h1>
          <p className="text-[10px] opacity-60 font-mono tracking-wider mt-1 text-slate-500 uppercase">BEHAVIORAL_EVALUATION_INFRASTRUCTURE</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-[11px] font-mono leading-relaxed text-red-600 flex gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-[11px] font-mono leading-relaxed text-green-700 flex gap-2">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSupabaseAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Richard"
                  className="lab-input pl-10 text-xs h-10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Coordinates</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="researcher@agency.org"
                className="lab-input pl-10 text-xs h-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Keyphrase</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="password"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="lab-input pl-10 text-xs h-10"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="lab-button w-full flex items-center justify-center gap-2 h-11 text-xs font-bold uppercase tracking-widest mt-6"
          >
            {loading ? 'SYNCHRONIZING...' : isSignUp ? 'CREATE_CORE_IDENTITY' : 'AUTHORIZE_SESSION'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }} 
            className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wide"
          >
            {isSignUp ? '← Back to Session Login' : 'Create new credential profile →'}
          </button>
        </div>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-mono">FEDERATED_BYPASS</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="space-y-3">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider transition-all">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.6a5.64 5.64 0 0 1-2.45 3.7v3.08h3.9c2.3-2.1 3.65-5.2 3.65-8.63z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.08c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.72-2.1-6.66-4.9H1.3l-.01.07A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.34 14.28a7.16 7.16 0 0 1 0-4.56v-3.1H1.4a12 12 0 0 0 0 10.76l3.94-3.1z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.94 3.1c.94-2.8 3.56-4.97 6.77-4.97z" />
            </svg>
            LINK_VIA_GOOGLE_SECURE
          </button>
          
          <button 
            type="button"
            onClick={handleBypass} 
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 font-mono text-[10px] font-bold uppercase text-slate-500 tracking-wide flex items-center justify-center gap-2 transition-all"
          >
            <FlaskConical size={14} />
            BYPASS_LOGIN (GUEST_MODE)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { setUser, setInitializing } = useStore();

  useEffect(() => {
    setInitializing(true);
    
    // Check if there is an active guest session stored in Zustand
    const { user } = useStore.getState();
    if (user?.isGuest) {
      setInitializing(false);
      return;
    }

    // Initialize Supabase session listener if configured
    let supabaseUnsubscribe = () => {};
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email || '',
            displayName: u.user_metadata?.displayName || u.email?.split('@')[0] || 'Researcher',
            isGuest: false,
          });
        } else {
          setUser(null);
        }
        setInitializing(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email || '',
            displayName: u.user_metadata?.displayName || u.email?.split('@')[0] || 'Researcher',
            isGuest: false,
          });
        } else {
          // If the status has changed to signed out, but we are NOT in guest mode, sign out
          const currentUserState = useStore.getState().user;
          if (!currentUserState?.isGuest) {
            setUser(null);
          }
        }
      });

      supabaseUnsubscribe = () => {
        subscription.unsubscribe();
      };
    } else {
      // If supabase is not configured, we just keep whatever status is in the persistent Zustand store,
      // which allows our robust mock user and Guest bypass mode to work perfectly!
      setInitializing(false);
    }

    // Fallback/secondary link with Firebase
    const firebaseUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          isGuest: false
        });
      }
    });

    return () => {
      supabaseUnsubscribe();
      firebaseUnsubscribe();
    };
  }, [setUser, setInitializing]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Arena />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/lab" element={
          <ProtectedRoute>
            <Layout>
              <TestLab />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/registry" element={
          <ProtectedRoute>
            <Layout>
              <Registry />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <Layout>
              <History />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/benchmarks" element={
          <ProtectedRoute>
            <Layout>
              <Leaderboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <DressingRoom />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
