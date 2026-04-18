import React,{useState} from 'react';
import {Upload,Trash2,Database} from 'lucide-react';
export default function TournamentUploader({metaDecks,onUpdateMeta,onClearMeta}){
  const[txt,setT]=useState('');
  const[err,setE]=useState('');
  const[ok,setOk]=useState('');
  const imp=()=>{
    setE('');setOk('');
    try{
      const p=JSON.parse(txt);
      const d=Array.isArray(p)?p:[p];
      onUpdateMeta(d);setOk(`${d.length}件追加`);setT('');
    }catch(e){setE('JSONエラー:'+e.message);}
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
        <pre className="format-hint">{`[{"id":"d1","name":"デッキ名","characters":["1101","1201","1301"],"actions":["211011","211011",...]}]`}</pre>
        <textarea className="json-textarea" rows={6} placeholder="JSONを貼り付け..." value={txt} onChange={e=>setT(e.target.value)}/>
        {err&&<p className="import-error">{err}</p>}
        {ok&&<p className="import-success">{ok}</p>}
        <button className="import-btn" onClick={imp} disabled={!txt.trim()}><Upload size={13}/> インポート</button>
      </div>
    </div>
  );
}
