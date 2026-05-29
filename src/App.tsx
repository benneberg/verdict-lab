import React, { useEffect } from 'react';
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
import { Beaker, FlaskConical, History as HistoryIcon, User, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useStore();
  
  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center font-mono">INITIALIZING_LAB...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function Login() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
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
    <div className="flex h-screen items-center justify-center bg-[#E4E3E0]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lab-card max-w-md w-full text-center"
      >
        <h1 className="text-4xl font-bold mb-2 tracking-tighter uppercase italic">Verdict Lab</h1>
        <p className="text-sm opacity-60 mb-8 font-mono">BEHAVIORAL_EVALUATION_INFRASTRUCTURE</p>
        <div className="space-y-4">
          <button onClick={handleLogin} className="lab-button w-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
            <User size={18} />
            ACCESS_LAB_WITH_GOOGLE
          </button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>

          <button 
            onClick={handleBypass} 
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all text-sm font-bold uppercase tracking-tight flex items-center justify-center gap-2"
          >
            <FlaskConical size={18} />
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const { user } = useStore.getState();
      
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
        });
      } else if (!user?.isGuest) {
        // Only clear the session if the user isn't logged in via guest mode
        setUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

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
