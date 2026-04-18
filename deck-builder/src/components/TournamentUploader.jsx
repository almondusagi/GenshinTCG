import React, { useState } from 'react';
import { Upload, Trash2, Database } from 'lucide-react';

export default function TournamentUploader({ metaDecks, onUpdateMeta, onClearMeta }) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImport = () => {
    setError('');
    setSuccess('');
    try {
      const parsed = JSON.parse(jsonText);
      const decks = Array.isArray(parsed) ? parsed : [parsed];
      onUpdateMeta(decks);
      setSuccess(`${decks.length}件のデッキを追加しました`);
      setJsonText('');
    } catch (e) {
      setError('JSONパースエラー: ' + e.message);
    }
  };

  return (
    <div className="data-view">
      <div className="glass-panel stat-card">
        <h3 className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} />
          現在のデータ
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          登録済みデッキ数: <strong style={{ color: 'var(--accent-gold)' }}>{metaDecks.length}</strong>件
        </p>
        <div className="meta-deck-list">
          {metaDecks.slice(0, 10).map((d, i) => (
            <div key={d.id || i} className="meta-deck-item">
              <span>{d.name || `デッキ ${i + 1}`}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.source || ''}</span>
            </div>
          ))}
          {metaDecks.length > 10 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
              ...他 {metaDecks.length - 10} 件
            </p>
          )}
        </div>
        <button
          className="deck-btn"
          style={{ background: 'rgba(248,113,113,0.15)', borderColor: '#f8717155', marginTop: '16px' }}
          onClick={onClearMeta}
        >
          <Trash2 size={14} />
          データをリセット
        </button>
      </div>

      <div className="glass-panel stat-card">
        <h3 className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} />
          デッキデータをインポート
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
          以下の形式のJSONを貼り付けてください:
        </p>
        <pre className="format-hint">{`[{
  "id": "deck_001",
  "name": "デッキ名",
  "characters": ["1101", "1201", "1301"],
  "actions": ["211011", "211011", ...],
  "source": "大会名",
  "score": 90
}]`}</pre>
        <textarea
          className="json-textarea"
          placeholder="JSONを貼り付け..."
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          rows={8}
        />
        {error && <p className="import-error">{error}</p>}
        {success && <p className="import-success">{success}</p>}
        <button className="import-btn" onClick={handleImport} disabled={!jsonText.trim()}>
          <Upload size={15} />
          インポート
        </button>
      </div>
    </div>
  );
}
