import React,{useState} from 'react';
import {Upload,Trash2,Database} from 'lucide-react';

// Converts backup format presets to meta deck format
function presetsToMetaDecks(presets){
  return presets.map(p=>({
    id:p.id,
    name:p.name,
    characters:p.characters||p.chars||[],
    actions:p.actions||[],
    source:'プリセットから',
    score:p.score,
  }));
}

export default function TournamentUploader({metaDecks,onUpdateMeta,onClearMeta}){
  const [txt,setT]=useState('');
  const [err,setE]=useState('');
  const [ok,setOk]=useState('');

  const imp=()=>{
    setE('');setOk('');
    try{
      const parsed=JSON.parse(txt);
      // Detect backup format (has 'version' key)
      if(parsed.version&&parsed.presets){
        const decks=presetsToMetaDecks(parsed.presets);
        onUpdateMeta(decks);
        setOk(`バックアップからプリセット ${decks.length} 件をインポートしました`);
        setT('');return;
      }
      // Standard tournament array format
      const decks=Array.isArray(parsed)?parsed:[parsed];
      onUpdateMeta(decks);
      setOk(`${decks.length}件追加`);
      setT('');
    }catch(e){setE('JSONエラー: '+e.message);}
  };

  return(
    <div className="data-view">
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Database size={15} style={{display:'inline',marginRight:6}}/>現在のデータ</h3>
        <p style={{color:'var(--muted)',marginBottom:12}}>登録済み: <strong style={{color:'var(--gold)'}}>{metaDecks.length}</strong> 件</p>
        <div className="meta-deck-list">
          {metaDecks.slice(0,10).map((d,i)=>(
            <div key={d.id||i} className="meta-deck-item">
              <span>{d.name||`デッキ${i+1}`}</span>
              <span style={{color:'var(--muted)',fontSize:'.8rem'}}>{d.source||''}</span>
            </div>
          ))}
          {metaDecks.length>10&&<p style={{color:'var(--muted)',fontSize:'.82rem',marginTop:8}}>他 {metaDecks.length-10} 件</p>}
        </div>
        <button className="deck-btn clear-btn" style={{marginTop:14}} onClick={onClearMeta}><Trash2 size={13}/> リセット</button>
      </div>
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Upload size={15} style={{display:'inline',marginRight:6}}/>インポート</h3>
        <p className="combo-hint" style={{marginBottom:8}}>
          通常の大会データJSON、またはタグ管理のバックアップJSONをそのまま貼り付けられます。<br/>
          バックアップの場合はプリセットデッキをメタデッキとして登録します。
        </p>
        <pre className="format-hint">{`// 通常形式\n[{"id":"d1","name":"デッキ名","characters":["1101","1201","1301"],"actions":["211011",...]}]\n// バックアップ形式も対応（version キーあり）`}</pre>
        <textarea className="json-textarea" rows={6} placeholder="JSONを貼り付け..." value={txt} onChange={e=>setT(e.target.value)}/>
        {err&&<p className="import-error">{err}</p>}
        {ok&&<p className="import-success">{ok}</p>}
        <button className="import-btn" onClick={imp} disabled={!txt.trim()}><Upload size={13}/> インポート</button>
      </div>
    </div>
  );
}
