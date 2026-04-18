import React, { useState, useEffect } from 'react';
import DeckBuilder from './components/DeckBuilder';
import Analytics from './components/Analytics';
import TournamentUploader from './components/TournamentUploader';
import CardReviewTable from './components/CardReviewTable';
import dbData from './data/cards_db.json';
import defaultMetaDecks from './data/tournament_decks.json';
import { calculateDeckScore, getMetaAnalytics, getUserRatings, saveUserRatings } from './utils/scoring';
import { Swords, BarChart3, Database, Star } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('build');
  const [cards, setCards] = useState({});
  const [metaDecks, setMetaDecks] = useState([]);
  const [ratings, setRatings] = useState({});

  // Deck state
  const [selectedChars, setSelectedChars] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);

  useEffect(() => {
    setCards(dbData.cards);
    setRatings(getUserRatings());

    const savedMeta = localStorage.getItem('genshin_tcg_meta');
    if (savedMeta) {
      try { setMetaDecks(JSON.parse(savedMeta)); }
      catch { setMetaDecks(defaultMetaDecks); }
    } else {
      setMetaDecks(defaultMetaDecks);
    }
  }, []);

  const score = calculateDeckScore(selectedChars, selectedActions, ratings);

  const handleRatingsChange = (newRatings) => {
    setRatings(newRatings);
  };

  const handleUpdateMeta = (newDecks) => {
    const combined = [...metaDecks, ...newDecks];
    setMetaDecks(combined);
    localStorage.setItem('genshin_tcg_meta', JSON.stringify(combined));
  };

  const clearMeta = () => {
    setMetaDecks(defaultMetaDecks);
    localStorage.removeItem('genshin_tcg_meta');
  };

  const NAV_ITEMS = [
    { id: 'build',     label: '構築',      Icon: Swords },
    { id: 'review',    label: 'カード評価', Icon: Star },
    { id: 'analytics', label: 'メタ分析',  Icon: BarChart3 },
    { id: 'data',      label: 'データ管理', Icon: Database },
  ];

  return (
    <div className="app-container">
      <nav className="glass-panel navbar">
        <div className="brand">
          <Swords size={28} />
          GI-TCG Analyzer
        </div>
        <div className="nav-tabs">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'build' && (
          <DeckBuilder
            cards={cards}
            selectedChars={selectedChars}
            setSelectedChars={setSelectedChars}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
            score={score}
            ratings={ratings}
          />
        )}

        {activeTab === 'review' && (
          <CardReviewTable
            cards={cards}
            ratings={ratings}
            onRatingsChange={handleRatingsChange}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            metaDecks={metaDecks}
            cards={cards}
            analyticsData={getMetaAnalytics(metaDecks)}
          />
        )}

        {activeTab === 'data' && (
          <TournamentUploader
            metaDecks={metaDecks}
            onUpdateMeta={handleUpdateMeta}
            onClearMeta={clearMeta}
          />
        )}
      </main>
    </div>
  );
}

export default App;