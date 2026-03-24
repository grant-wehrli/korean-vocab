import { useState } from 'react';
import { useVocabStore } from './hooks/useVocabStore';
import { BUILTIN_VOCAB } from './data/vocab';
import HomeView from './components/HomeView';
import SelectSetsView from './components/SelectSetsView';
import StudyView from './components/StudyView';
import StatsView from './components/StatsView';
import ImportView from './components/ImportView';
import './index.css';

export default function App() {
  const store = useVocabStore();
  const [view, setView] = useState('home');
  const [sessionConfig, setSessionConfig] = useState(null);

  const allSets = { ...BUILTIN_VOCAB, ...store.customSets };

  function startSession(config) {
    setSessionConfig(config);
    setView('study');
  }

  function endSession() {
    setSessionConfig(null);
    setView('home');
  }

  return (
    <div className="app">
      {view === 'home' && (
        <HomeView
          store={store}
          allSets={allSets}
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
