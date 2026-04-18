import React, { useState, useMemo } from 'react';
import { saveUserRatings } from '../utils/scoring';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_LABELS = {
  character: 'キャラ', weapon: '武器', artifact: '聖遺物',
  talent: '天賦', support: 'サポート', event: 'イベント',
};

const TYPE_COLORS = {
  character: '#f87171', weapon: '#60a5fa', artifact: '#c084fc',
  talent: '#fbbf24', support: '#34d399', event: '#94a3b8',
};

const ELEMENT_COLORS = {
  氷: '#93c5fd', 水: '#60a5fa', 炎: '#f87171', 雷: '#c084fc',
  風: '#34d399', 岩: '#fbbf24', 草: '#4ade80', 無色: '#94a3b8',
};

const PAGE_SIZE = 50;
const TYPE_FILTERS = ['all', 'character', 'weapon', 'artifact', 'talent', 'support', 'event'];

export default function CardReviewTable({ cards, ratings, onRatingsChange }) {
  const [localRatings, setLocalRatings] = useState({ ...ratings });
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name | rating | type
  const [page, setPage] = useState(0);
  const [saved, setSaved] = useState(false);

  // Sync when parent ratings change (e.g., initial load)
  React.useEffect(() => {
    setLocalRatings({ ...ratings });
  }, [ratings]);

  const filtered = useMemo(() => {
    let list = Object.values(cards);
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (search) list = list.filter(c => c.name.includes(search));
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'rating') list.sort((a, b) => (localRatings[b.id] || 0) - (localRatings[a.id] || 0));
    else if (sortBy === 'type') list.sort((a, b) => a.type.localeCompare(b.type));
    return list;
  }, [cards, typeFilter, search, sortBy, localRatings]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageCards = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleRating = (id, val) => {
    const num = Math.max(-5, Math.min(5, Number(val) || 0));
    setLocalRatings(prev => ({ ...prev, [id]: num }));
    setSaved(false);
  };

  const handleSave = () => {
    saveUserRatings(localRatings);
    onRatingsChange(localRatings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetAll = () => {
    setLocalRatings({});
    setSaved(false);
  };

  const ratedCount = Object.values(localRatings).filter(v => v !== 0).length;
  const avgRating = ratedCount > 0
    ? (Object.values(localRatings).filter(v => v !== 0).reduce((s, v) => s + v, 0) / ratedCount).toFixed(1)
    : 0;

  return (
    <div className="review-wrapper">
      {/* Header */}
      <div className="review-header-bar glass-panel">
        <div className="review-stats">
          <div className="rev-stat">
            <span className="rev-stat-num">{ratedCount}</span>
            <span className="rev-stat-label">評価済み</span>
          </div>
          <div className="rev-stat">
            <span className="rev-stat-num" style={{ color: avgRating > 0 ? '#34d399' : avgRating < 0 ? '#f87171' : '#94a3b8' }}>
              {avgRating > 0 ? '+' : ''}{avgRating}
            </span>
            <span className="rev-stat-label">平均評価</span>
          </div>
          <div className="rev-stat">
            <span className="rev-stat-num">{Object.keys(cards).length}</span>
            <span className="rev-stat-label">カード総数</span>
          </div>
        </div>
        <div className="review-controls">
          <button className="deck-btn" onClick={resetAll}>リセット</button>
          <button className={`deck-btn save-confirm-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            <Save size={15} />
            {saved ? '✓ 保存しました' : '評価を保存'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel review-filter-bar">
        <input
          className="search-input"
          placeholder="カード名で検索..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <div className="filters">
          {TYPE_FILTERS.map(t => (
            <button key={t}
              className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => { setTypeFilter(t); setPage(0); }}
            >
              {t === 'all' ? '全て' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="sort-row">
          <span className="rev-stat-label">並び替え：</span>
          {[['name','名前'],['rating','評価'],['type','タイプ']].map(([v, l]) => (
            <button key={v}
              className={`filter-btn ${sortBy === v ? 'active' : ''}`}
              onClick={() => setSortBy(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel review-table-wrap">
        <div className="review-table">
          <div className="review-col-header">
            <span className="rcol-card">カード</span>
            <span className="rcol-type">タイプ</span>
            <span className="rcol-elem">元素</span>
            <span className="rcol-rating">評価 (-5〜5)</span>
          </div>
          {pageCards.map(card => {
            const r = localRatings[card.id] || 0;
            return (
              <div key={card.id} className={`review-row ${r !== 0 ? 'rated' : ''}`}>
                <div className="rcol-card">
                  <img src={card.url} alt="" className="review-thumb"
                       onError={e => { e.target.style.display = 'none'; }} />
                  <span className="review-card-name">{card.name}</span>
                </div>
                <span className="rcol-type">
                  <span className="type-chip" style={{ color: TYPE_COLORS[card.type], borderColor: TYPE_COLORS[card.type] + '55' }}>
                    {TYPE_LABELS[card.type] || card.type}
                  </span>
                </span>
                <span className="rcol-elem">
                  <span className="elem-chip" style={{ color: ELEMENT_COLORS[card.element] || '#94a3b8' }}>
                    {card.element}
                  </span>
                </span>
                <div className="rcol-rating">
                  <input
                    type="range" min="-5" max="5" step="1"
                    value={r}
                    onChange={e => handleRating(card.id, e.target.value)}
                    className={`rating-slider ${r > 0 ? 'positive' : r < 0 ? 'negative' : ''}`}
                  />
                  <input
                    type="number" min="-5" max="5"
                    value={r}
                    onChange={e => handleRating(card.id, e.target.value)}
                    className="rating-num"
                  />
                  <span className="rating-display" style={{ color: r > 0 ? '#34d399' : r < 0 ? '#f87171' : '#475569' }}>
                    {r > 0 ? `+${r}` : r}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="page-info">{page + 1} / {Math.max(1, totalPages)}  ({filtered.length}枚)</span>
        <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
