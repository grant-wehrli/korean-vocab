import { useState, useEffect } from 'react';
import { useVocabStore, loadFromSupabase, migrateGuestData } from './hooks/useVocabStore';
import { useAuth } from './hooks/useAuth';
import { BUILTIN_VOCAB } from './data/vocab';
import HomeView from './components/HomeView';
import SelectSetsView from './components/SelectSetsView';
import StudyView from './components/StudyView';
import StatsView from './components/StatsView';
import ImportView from './components/ImportView';
import AuthView from './components/AuthView';
import './index.css';

export default function App() {
  const auth = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [migrationBanner, setMigrationBanner] = useState(false);
  const [view, setView] = useState('home');
  const [sessionConfig, setSessionConfig] = useState(null);

  const userId = auth.user?.id ?? null;
  const store = useVocabStore(userId);

  // When user signs in, load their data from Supabase
  useEffect(() => {
    if (!userId) return;
    // Check if there's legacy guest data to offer migration
    const hasGuest = !!localStorage.getItem('korean_vocab_v1');
    if (hasGuest) setMigrationBanner(true);

    loadFromSupabase(userId).then(({ cards, customSets }) => {
      store.replaceState({ cards, customSets });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleMigrate() {
    await migrateGuestData(userId);
    localStorage.removeItem('korean_vocab_v1');
    setMigrationBanner(false);
    // Reload merged state
    loadFromSupabase(userId).then(({ cards, customSets }) => {
      store.replaceState({ cards, customSets });
    });
  }

  const allSets = { ...BUILTIN_VOCAB, ...store.customSets };

  function startSession(config) {
    setSessionConfig(config);
    setView('study');
  }

  function endSession() {
    setSessionConfig(null);
    setView('home');
  }

  // Loading spinner while auth initialises
  if (auth.loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text3)',
        fontSize: '0.85rem',
      }}>
        Loading...
      </div>
    );
  }

  // Show auth screen unless signed in or guest mode chosen
  if (!auth.user && !guestMode) {
    return <AuthView auth={auth} onGuest={() => setGuestMode(true)} />;
  }

  return (
    <div className="app">
      {migrationBanner && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 200,
        }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--text2)' }}>
            Import your local progress into your account?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMigrate}>
              Import
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setMigrationBanner(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {view === 'home' && (
        <HomeView
          store={store}
          allSets={allSets}
          auth={auth}
          onSignIn={() => setGuestMode(false)}
          onStudy={() => setView('select')}
          onStats={() => setView('stats')}
          onImport={() => setView('import')}
        />
      )}
      {view === 'select' && (
        <SelectSetsView
          allSets={allSets}
          store={store}
          onStart={startSession}
          onBack={() => setView('home')}
        />
      )}
      {view === 'study' && sessionConfig && (
        <StudyView
          config={sessionConfig}
          store={store}
          allSets={allSets}
          onDone={endSession}
        />
      )}
      {view === 'stats' && (
        <StatsView
          store={store}
          onBack={() => setView('home')}
        />
      )}
      {view === 'import' && (
        <ImportView
          store={store}
          onBack={() => setView('home')}
        />
      )}
    </div>
  );
}
