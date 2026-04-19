import React,{useState,useEffect} from 'react';
import {Plus,Trash2,Zap,Save,ArrowUp,ArrowDown,Download,Upload,Tag,Layers} from 'lucide-react';
import {saveTags,saveTagCombos,saveGroups,exportBackup,importBackup,
  loadTags,loadTagCombos,loadGroups,loadCardTags,loadPresets} from '../utils/storage';

const genId=()=>Math.random().toString(36).slice(2,9);
const SCOPES=[{v:'deck',l:'デッキ全体'},{v:'card',l:'カード単体'}];

// ── Score display helpers ──────────────────────────────────────────────────────
// Stored score is always a number. Display uses '' for 0 (cleaner UI).
// Number('') === 0, so empty input === score 0 in all calculations.
const toDisplay = v => (v === 0 || v === null || v === undefined) ? '' : String(v);
const fromInput  = s => s === '' ? 0 : Number(s);

export default function TagManager({tags,setTags,groups,setGroups,tagCombos,setTagCombos}){
  const [newTagName,setNTN]=useState('');
  // New tag score: '' = 0
  const [newTagScore,setNTS]=useState('');
  const [newTagGroup,setNTG]=useState('');
  const [newGroupName,setNGN]=useState('');
  // Combo override score: '' = 0
  const [combo,setCombo]=useState({triggerTag:'',conditionTag:'',targetTag:'',overrideScore:'',scope:'deck'});
  const [saved,setSaved]=useState(false);
  const [backupText,setBackupText]=useState('');
  const [backupMsg,setBackupMsg]=useState('');

  // ── Local string state for score inputs per tag id ────────────────────────────
  // Key: tag.id  Value: string ('' means 0, '5' means 5, '-3' means -3)
  // This prevents re-render loops on mobile when parent setTags triggers re-render.
  const [scoreInputs,setScoreInputs]=useState(()=>{
    const m={};
    for(const t of tags) m[t.id]=toDisplay(t.score);
    return m;
  });

  // Sync new tags added from outside (e.g., after backup import) without overwriting current input
  useEffect(()=>{
    setScoreInputs(prev=>{
      const m={};
      for(const t of tags){
        // Keep existing display value if user has already typed something;
        // otherwise initialise from stored score ('' for 0, digits for non-zero)
        m[t.id]=(t.id in prev) ? prev[t.id] : toDisplay(t.score);
      }
      return m;
    });
  },[tags]);

  const getScoreDisplay = id => scoreInputs[id] ?? '';
  const handleScoreInput = (id, raw) => {
    // Update display string immediately (no re-render lag on mobile)
    setScoreInputs(p=>({...p,[id]:raw}));
    // Sync numeric value to tag store ('' → 0, '5' → 5, etc.)
    updateTagScore(id, fromInput(raw));
  };

  const tagNames=tags.map(t=>t.name);

  // ── Group actions ────────────────────────────────────────────────────────────
  const addGroup=()=>{
    const n=newGroupName.trim(); if(!n||groups.some(g=>g.name===n)) return;
    const updated=[...groups,{id:genId(),name:n}];
    setGroups(updated); saveGroups(updated); setNGN('');
  };
  const delGroup=id=>{
    // Ungroup tags belonging to this group
    const updatedTags=tags.map(t=>t.groupId===id?{...t,groupId:null}:t);
    setTags(updatedTags); saveTags(updatedTags);
    const updatedG=groups.filter(g=>g.id!==id);
    setGroups(updatedG); saveGroups(updatedG);
  };
  const moveGroup=(idx,dir)=>{
    const a=[...groups],ni=idx+dir;
    if(ni<0||ni>=a.length) return;
    [a[idx],a[ni]]=[a[ni],a[idx]];
    setGroups(a); saveGroups(a);
  };

  // ── Tag actions ──────────────────────────────────────────────────────────────
  const addTag=()=>{
    const n=newTagName.trim(); if(!n||tags.some(t=>t.name===n)) return;
    const newId=genId();
    const newScore=fromInput(newTagScore);
    const updated=[...tags,{id:newId,name:n,score:newScore,groupId:newTagGroup||null}];
    setTags(updated); saveTags(updated);
    // New tag display: '' (score 0) or actual value
    setScoreInputs(p=>({...p,[newId]:toDisplay(newScore)}));
    setNTN(''); setNTS(''); setNGN('');
  };
  const updateTagScore=(id,v)=>{
    setTags(tags.map(t=>t.id===id?{...t,score:Number(v)}:t));
  };
  const updateTagGroup=(id,gid)=>{
    const updated=tags.map(t=>t.id===id?{...t,groupId:gid||null}:t);
    setTags(updated); saveTags(updated);
  };
  const delTag=id=>{
    const updated=tags.filter(t=>t.id!==id);
    setTags(updated); saveTags(updated);
  };
  const moveTag=(idx,dir)=>{
    const a=[...tags],ni=idx+dir;
    if(ni<0||ni>=a.length) return;
    [a[idx],a[ni]]=[a[ni],a[idx]];
    setTags(a); saveTags(a);
  };
  const saveScores=()=>{
    saveTags(tags); setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  // ── Combo actions ────────────────────────────────────────────────────────────
  const addCombo=()=>{
    const{triggerTag,conditionTag,targetTag,overrideScore,scope}=combo;
    if(!triggerTag||!conditionTag||!targetTag) return;
    const updated=[...tagCombos,{id:genId(),triggerTag,conditionTag,targetTag,
      overrideScore:fromInput(overrideScore),scope}];
    setTagCombos(updated); saveTagCombos(updated);
    setCombo({triggerTag:'',conditionTag:'',targetTag:'',overrideScore:'',scope:'deck'});
  };
  const delCombo=id=>{
    const updated=tagCombos.filter(c=>c.id!==id);
    setTagCombos(updated); saveTagCombos(updated);
  };

  // ── Backup ───────────────────────────────────────────────────────────────────
  const handleExport=()=>{ exportBackup(); setBackupMsg('✓ ダウンロードしました'); setTimeout(()=>setBackupMsg(''),3000); };
  const handleImport=()=>{
    try{
      const d=importBackup(backupText);
      if(d.groups)    setGroups(d.groups);
      if(d.tags){
        setTags(d.tags);
        // Reset score display after restore so new values show correctly
        const m={};
        for(const t of d.tags) m[t.id]=toDisplay(t.score);
        setScoreInputs(m);
      }
      if(d.tagCombos) setTagCombos(d.tagCombos);
      setBackupText(''); setBackupMsg('✓ 復元しました'); setTimeout(()=>setBackupMsg(''),3000);
    }catch(e){ setBackupMsg('❌ '+e.message); }
  };

  // Render tag rows grouped
  const ungrouped=tags.filter(t=>!t.groupId);
  const getGroupTags=gid=>tags.filter(t=>t.groupId===gid);

  const TagRow=({tag,idx})=>(
    <div className="tag-row">
      <div className="tag-row-left">
        <span className="tag-pill">{tag.name}</span>
        <select className="combo-select" style={{fontSize:'.72rem',padding:'3px 6px',maxWidth:90}}
          value={tag.groupId||''}
          onChange={e=>updateTagGroup(tag.id,e.target.value)}>
          <option value="">グループなし</option>
          {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="tag-score-area">
        <input
          type="number"
          className="score-input"
          placeholder="0"
          value={getScoreDisplay(tag.id)}
          onChange={e=>handleScoreInput(tag.id,e.target.value)}
        />
        {/* Show preview only when there's an actual non-zero value */}
        {(Number(getScoreDisplay(tag.id))||0)!==0&&(
          <span className="score-preview"
            style={{color:(Number(getScoreDisplay(tag.id))||0)>0?'#34d399':'#f87171'}}>
            {(Number(getScoreDisplay(tag.id))||0)>0?`+${Number(getScoreDisplay(tag.id))||0}`:Number(getScoreDisplay(tag.id))||0}
          </span>
        )}
      </div>
      <div style={{display:'flex',gap:2}}>
        <button className="btn-icon" onClick={()=>moveTag(idx,-1)} title="上へ"><ArrowUp size={12}/></button>
        <button className="btn-icon" onClick={()=>moveTag(idx,1)}  title="下へ"><ArrowDown size={12}/></button>
        <button className="btn-icon danger" onClick={()=>delTag(tag.id)}><Trash2 size={13}/></button>
      </div>
    </div>
  );

  return(
    <div className="tagmgr-layout">
      {/* ── Tags & Groups ─────────────────────────────── */}
      <section className="glass-panel tagmgr-section">
        <div className="section-head">
          <h2 className="stat-title"><Tag size={15} style={{display:'inline',marginRight:6}}/>タグ一覧</h2>
          <button className={`deck-btn save-confirm-btn ${saved?'saved':''}`} onClick={saveScores}>
            <Save size={13}/> {saved?'✓ 保存済み':'スコア保存'}
          </button>
        </div>

        {/* Add tag */}
        <div className="tag-add-row">
          <input className="search-input" placeholder="タグ名" value={newTagName}
            onChange={e=>setNTN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()}/>
          <input type="number" className="score-input" placeholder="0" value={newTagScore}
            onChange={e=>setNTS(e.target.value)}/>
          <select className="combo-select" value={newTagGroup} onChange={e=>setNTG(e.target.value)}>
            <option value="">グループなし</option>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button className="deck-btn auto-btn" onClick={addTag}><Plus size={13}/> 追加</button>
        </div>

        {tags.length===0&&<p className="empty-msg">タグがありません</p>}

        {/* Grouped tags */}
        {groups.map((g,gi)=>{
          const gTags=getGroupTags(g.id);
          if(!gTags.length) return null;
          return(
            <div key={g.id} className="tag-group-block">
              <div className="tag-group-header">
                <span className="tag-group-name"><Layers size={12}/> {g.name}</span>
                <div style={{display:'flex',gap:2}}>
                  <button className="btn-icon" onClick={()=>moveGroup(gi,-1)}><ArrowUp size={12}/></button>
                  <button className="btn-icon" onClick={()=>moveGroup(gi,1)}><ArrowDown size={12}/></button>
                  <button className="btn-icon danger" onClick={()=>delGroup(g.id)}><Trash2 size={12}/></button>
                </div>
              </div>
              {gTags.map(tag=><TagRow key={tag.id} tag={tag} idx={tags.indexOf(tag)}/>)}
            </div>
          );
        })}

        {/* Ungrouped */}
        {ungrouped.length>0&&(
          <div className="tag-group-block">
            <div className="tag-group-header">
              <span className="tag-group-name" style={{color:'#64748b'}}>グループなし</span>
            </div>
            {ungrouped.map(tag=><TagRow key={tag.id} tag={tag} idx={tags.indexOf(tag)}/>)}
          </div>
        )}

        {/* Add group */}
        <div className="tag-add-row" style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--panel-border)'}}>
          <input className="search-input" placeholder="グループ名" value={newGroupName}
            onChange={e=>setNGN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addGroup()}/>
          <button className="deck-btn" onClick={addGroup}><Plus size={13}/> グループ追加</button>
        </div>
      </section>

      {/* ── Combos ───────────────────────────────────── */}
      <section className="glass-panel tagmgr-section">
        <div className="section-head">
          <h2 className="stat-title"><Zap size={15} style={{display:'inline',marginRight:6,color:'#fbbf24'}}/>タグコンボ</h2>
        </div>
        <p className="combo-hint">
          トリガータグ × 条件タグ → 対象タグのスコアを上書き。<br/>
          <strong>デッキ全体</strong>: デッキ内全カードのタグで判定。<strong>カード単体</strong>: そのカード内のタグのみで判定。
        </p>

        <div className="combo-form glass-panel" style={{background:'rgba(0,0,0,.2)',gap:8}}>
          <div className="combo-form-grid">
            <label className="combo-label">トリガー</label>
            <select className="combo-select" value={combo.triggerTag}
              onChange={e=>setCombo(p=>({...p,triggerTag:e.target.value}))}>
              <option value="">-- 選択 --</option>
              {tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">× 条件</label>
            <select className="combo-select" value={combo.conditionTag}
              onChange={e=>setCombo(p=>({...p,conditionTag:e.target.value}))}>
              <option value="">-- 選択 --</option>
              {tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">= 対象</label>
            <select className="combo-select" value={combo.targetTag}
              onChange={e=>setCombo(p=>({...p,targetTag:e.target.value}))}>
              <option value="">-- 選択 --</option>
              {tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">スコア</label>
            <input type="number" className="score-input combo-score" placeholder="0"
              value={combo.overrideScore}
              onChange={e=>setCombo(p=>({...p,overrideScore:e.target.value}))}/>
            <label className="combo-label">適用範囲</label>
            <select className="combo-select" value={combo.scope}
              onChange={e=>setCombo(p=>({...p,scope:e.target.value}))}>
              {SCOPES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <button className="deck-btn auto-btn" style={{marginTop:6}} onClick={addCombo}
            disabled={!combo.triggerTag||!combo.conditionTag||!combo.targetTag}>
            <Plus size={13}/> コンボ追加
          </button>
        </div>

        {tagCombos.length===0&&<p className="empty-msg">コンボなし</p>}
        <div className="combo-list">
          {tagCombos.map(c=>(
            <div key={c.id} className="combo-item">
              <div className="combo-tags">
                <span className="tag-pill trigger">{c.triggerTag}</span>
                <span className="combo-x">×</span>
                <span className="tag-pill condition">{c.conditionTag}</span>
                <span className="combo-x">=</span>
                <span className="tag-pill target">{c.targetTag}</span>
                <span className="combo-x">→</span>
                <span className="combo-score-badge"
                  style={{color:c.overrideScore>0?'#34d399':'#f87171'}}>
                  {c.overrideScore>0?`+${c.overrideScore}`:c.overrideScore}
                </span>
                <span className="combo-scope-badge">
                  {c.scope==='card'?'カード':'デッキ'}
                </span>
              </div>
              <button className="btn-icon danger" onClick={()=>delCombo(c.id)}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Backup / Restore ─────────────────────────── */}
      <section className="glass-panel tagmgr-section" style={{gridColumn:'1/-1'}}>
        <h2 className="stat-title"><Download size={15} style={{display:'inline',marginRight:6}}/>バックアップ / 復元</h2>
        <p className="combo-hint">デッキプリセット・カード評価・タグ管理のデータをまとめてエクスポート/インポートできます。</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-start'}}>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button className="deck-btn auto-btn" onClick={handleExport}><Download size={13}/> JSONでエクスポート</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,minWidth:240}}>
            <textarea className="json-textarea" rows={4} placeholder="バックアップJSONを貼り付けて復元..."
              value={backupText} onChange={e=>setBackupText(e.target.value)}/>
            <button className="import-btn" onClick={handleImport} disabled={!backupText.trim()}>
              <Upload size={13}/> 復元する
            </button>
          </div>
        </div>
        {backupMsg&&<p className={backupMsg.startsWith('✓')?'import-success':'import-error'}>{backupMsg}</p>}
      </section>
    </div>
  );
}
