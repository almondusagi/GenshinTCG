import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const ELEMENT_COLORS = {
  氷: '#93c5fd', 水: '#60a5fa', 炎: '#f87171', 雷: '#c084fc',
  風: '#34d399', 岩: '#fbbf24', 草: '#4ade80', 無色: '#94a3b8',
};

export default function Analytics({ metaDecks, cards, analyticsData }) {
  const { charCount = {}, actionCount = {} } = analyticsData || {};

  const topChars = useMemo(() =>
    Object.entries(charCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count, card: cards[id] }))
  , [charCount, cards]);

  const topActions = useMemo(() =>
    Object.entries(actionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id, count]) => ({ id, count, card: cards[id] }))
  , [actionCount, cards]);

  const maxCharCount = topChars[0]?.count || 1;
  const maxActionCount = topActions[0]?.count || 1;

  if (!metaDecks || metaDecks.length === 0) {
    return (
      <div className="analytics-view">
        <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px' }}>
          <BarChart3 size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>メタデッキデータがありません。「データ管理」タブでデータを追加してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-view">
      {/* Summary */}
      <div className="glass-panel stat-card" style={{ gridColumn: '1/-1' }}>
        <h3 className="stat-title">メタ概要</h3>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{metaDecks.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>登録デッキ数</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#60a5fa' }}>{Object.keys(charCount).length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>使用キャラ種類</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399' }}>{Object.keys(actionCount).length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>使用アクション種類</div>
          </div>
        </div>
      </div>

      {/* Top characters */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title">使用率 TOP キャラ</h3>
        <ul className="stat-list">
          {topChars.map(({ id, count, card }, i) => (
            <li key={id} className="stat-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {card?.url && (
                  <img src={card.url} alt="" style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }}
                       onError={e => { e.target.style.display='none'; }} />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{card?.name || id}</div>
                  <div style={{ color: ELEMENT_COLORS[card?.element] || '#94a3b8', fontSize: '0.8rem' }}>
                    {card?.element}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: i === 0 ? 'var(--accent-gold)' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--text-main)' }}>
                  {count}デッキ
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {Math.round(count / metaDecks.length * 100)}%
                </div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${count / maxCharCount * 100}%`, background: ELEMENT_COLORS[card?.element] || 'var(--primary-color)' }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Top action cards */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title">使用率 TOP アクションカード</h3>
        <ul className="stat-list">
          {topActions.map(({ id, count, card }, i) => (
            <li key={id} className="stat-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {card?.url && (
                  <img src={card.url} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4 }}
                       onError={e => { e.target.style.display='none'; }} />
                )}
                <span style={{ fontWeight: 500 }}>{card?.name || id}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{count}デッキ</div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${count / maxActionCount * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}