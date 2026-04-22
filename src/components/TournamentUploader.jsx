import React,{useState} from 'react';
import {Upload,Trash2,Database,Download} from 'lucide-react';
import {exportBackup,importBackup} from '../utils/storage';

function presetsToMetaDecks(presets){
  return presets.map(p=>({
    id:p.id, name:p.name,
    characters:p.characters||p.chars||[],
    actions:p.actions||[],
    source:'プリセットから', score:p.score,
  }));
}

export default function TournamentUploader({metaDecks,onUpdateMeta,onClearMeta,onRestore}){
  const [txt,setT]=useState('');
  const [err,setE]=useState('');
  const [ok,setOk]=useState('');
  const [backupTxt,setBT]=useState('');
  const [backupMsg,setBMsg]=useState('');

  const imp=()=>{
    setE('');setOk('');
    try{
      const parsed=JSON.parse(txt);
      if(parsed.version&&parsed.presets){
        const decks=presetsToMetaDecks(parsed.presets);
        onUpdateMeta(decks);
        setOk(`バックアップからプリセット ${decks.length} 件をインポートしました`);
        setT('');return;
      }
      const decks=Array.isArray(parsed)?parsed:[parsed];
      onUpdateMeta(decks);
      setOk(`${decks.length}件追加`);
      setT('');
    }catch(e){setE('JSONエラー: '+e.message);}
  };

  const handleExport=()=>{
    exportBackup();
    setBMsg('✓ JSONファイルをダウンロードしました');
    setTimeout(()=>setBMsg(''),3000);
  };

  const handleRestore=()=>{
    setBMsg('');
    try{
      const d=importBackup(backupTxt);
      onRestore(d);
      setBT('');
      setBMsg('✓ 全データを復元しました');
      setTimeout(()=>setBMsg(''),3000);
    }catch(e){setBMsg('❌ '+e.message);}
  };

  return(
    <div className="data-view-4col">
      {/* ── Meta decks current data ────────────── */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Database size={15} style={{display:'inline',marginRight:6}}/>メタデッキ</h3>
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

      {/* ── Meta decks import ──────────────────── */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Upload size={15} style={{display:'inline',marginRight:6}}/>メタデッキ インポート</h3>
        <p className="combo-hint" style={{marginBottom:8}}>
          大会データJSON、またはバックアップJSONのどちらでも対応します。
        </p>
        <pre className="format-hint">{`[{"id":"d1","name":"デッキ名","characters":["1101"],"actions":["211011",...]}]`}</pre>
        <textarea className="json-textarea" rows={5} placeholder="JSONを貼り付け..." value={txt} onChange={e=>setT(e.target.value)}/>
        {err&&<p className="import-error">{err}</p>}
        {ok&&<p className="import-success">{ok}</p>}
        <button className="import-btn" onClick={imp} disabled={!txt.trim()}><Upload size={13}/> インポート</button>
      </div>

      {/* ── Backup export ──────────────────────── */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Download size={15} style={{display:'inline',marginRight:6}}/>バックアップ出力</h3>
        <p className="combo-hint" style={{marginBottom:14}}>
          デッキプリセット・カード評価・タグ管理の<strong>全データ</strong>をJSONファイルとしてダウンロードします。
        </p>
        <button className="deck-btn auto-btn" style={{alignSelf:'flex-start'}} onClick={handleExport}>
          <Download size={13}/> JSONでエクスポート
        </button>
        {backupMsg&&backupMsg.startsWith('✓')&&<p className="import-success">{backupMsg}</p>}
      </div>

      {/* ── Backup restore ─────────────────────── */}
      <div className="glass-panel stat-card">
        <h3 className="stat-title"><Upload size={15} style={{display:'inline',marginRight:6}}/>バックアップ復元</h3>
        <p className="combo-hint" style={{marginBottom:8}}>
          エクスポートしたJSONを貼り付けて全データを復元します。<br/>
          <strong style={{color:'#f87171'}}>現在のデータは上書きされます。</strong>
        </p>
        <textarea className="json-textarea" rows={5}
          placeholder="バックアップJSONを貼り付け..."
          value={backupTxt} onChange={e=>setBT(e.target.value)}/>
        {backupMsg&&<p className={backupMsg.startsWith('✓')?'import-success':'import-error'}>{backupMsg}</p>}
        <button className="import-btn" onClick={handleRestore} disabled={!backupTxt.trim()}>
          <Upload size={13}/> 復元する
        </button>
      </div>
    </div>
  );
}
