import { useAuth } from './hooks/useAuth';
import Dashboard from './Dashboard';
import LoginPage from './components/LoginPage';
import UpdateLogCard from './components/UpdateLogCard';

export default function App() {
  const { user, loading, signInWithGitHub, signInWithGoogle, signOut } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginGithub={signInWithGitHub} onLoginGoogle={signInWithGoogle} loading={false} />;
  }

  return (
    <>
      <Dashboard user={user} onSignOut={signOut} />
      <UpdateLogCard />
    </>
  );
}
