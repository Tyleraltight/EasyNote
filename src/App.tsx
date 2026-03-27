import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './Dashboard';
import LoginPage from './components/LoginPage';
import UpdateLogCard from './components/UpdateLogCard';
import TodoArchive from './components/TodoArchive';
import FlagSummary from './components/FlagSummary';
import PrivacyPolicy from './components/PrivacyPolicy';

export default function App() {
  const { user, loading, signInWithGitHub, signInWithGoogle, signOut } = useAuth();
  const [view, setView] = useState<'dashboard' | 'archive' | 'summary'>('dashboard');
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const privacyFooter = (
    <footer className="py-4 text-center">
      <button
        onClick={() => setShowPrivacy(true)}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        隐私政策与免责声明（Privacy Policy & Disclaimer）
      </button>
    </footer>
  );

  if (!user) {
    return (
      <>
        <LoginPage onLoginGithub={signInWithGitHub} onLoginGoogle={signInWithGoogle} loading={false} />
        {privacyFooter}
        {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      </>
    );
  }

  return (
    <>
      {view === 'dashboard' ? (
        <Dashboard user={user} onSignOut={signOut} onOpenArchive={() => setView('archive')} onOpenSummary={() => setView('summary')} />
      ) : view === 'archive' ? (
        <TodoArchive user={user} onSignOut={signOut} onBack={() => setView('dashboard')} />
      ) : (
        <FlagSummary user={user} onSignOut={signOut} onBack={() => setView('dashboard')} />
      )}
      <UpdateLogCard />
      {privacyFooter}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </>
  );
}
