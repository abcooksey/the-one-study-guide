import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TriviaSession from './pages/TriviaSession';
import SessionResults from './pages/SessionResults';
import FlashcardLibrary from './pages/FlashcardLibrary';
import AddFlashcard from './pages/AddFlashcard';
import EditFlashcard from './pages/EditFlashcard';

function App() {
  const initializeFlashcards = useAppStore((state) => state.initializeFlashcards);
  const initializeCloudSync = useAppStore((state) => state.initializeCloudSync);

  useEffect(() => {
    const initialize = async () => {
      // Try to initialize cloud sync first
      await initializeCloudSync();
      // Then initialize flashcards (will use cloud data if available)
      initializeFlashcards();
    };
    initialize();
  }, [initializeFlashcards, initializeCloudSync]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session" element={<TriviaSession />} />
        <Route path="/results" element={<SessionResults />} />
        <Route path="/library" element={<FlashcardLibrary />} />
        <Route path="/add" element={<AddFlashcard />} />
        <Route path="/edit/:id" element={<EditFlashcard />} />
      </Routes>
    </Layout>
  );
}

export default App;
