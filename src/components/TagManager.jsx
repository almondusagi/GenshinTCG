import React,{useState,useEffect} from 'react';
import {Plus,Trash2,Zap,Save,ArrowUp,ArrowDown,Tag,Layers,Calculator,HelpCircle,X} from 'lucide-react';
import {saveTags,saveTagCombos,saveGroups,saveCalcAdjusters} from '../utils/storage';

const genId=()=>Math.random().toString(36).slice(2,9);
const SCOPES=[{v:'deck',l:'デッキ全体'},{v:'card',l:'カード単体'}];
const OPS=[{v:'×',l:'× 掛け算'},{v:'÷',l:'÷ 割り算'}];

const toDisplay=v=>(v===0||v===null||v===undefined)?'':String(v);
const fromInput=s=>s===''?0:Number(s);

// ── Help tooltip ──────────────────────────────────────────────────────────────
const COEFF_HELP={
  baseValue:{
    title:'基本価値',
    desc:'その効果が1回完全に発揮された場合の価値を点数化したもの。\n例: サイコロ1個 = 1点、HP回復1 = 0.8点、ダメージ+1 = 1点 等、\nチーム全体のリソース変換で考えます。',
  },
  triggerEase:{
    title:'発動容易度',
    desc:'効果が条件なく確実に発動する場合は 1.0。\n「通常攻撃を発動した時」のような条件付き = 0.4~0.8\n「相手がXした時」のような相手依存 = 0.1~0.5\n「ラウンド開始時」自動発動 = 1.0\n発動しにくいほど低くします。',
  },
  expectedCount:{
    title:'期待発動回数',
    desc:'想定ラウンド数内で、平均何回この効果が発動するか。\n無制限の永続効果（毎ラウンド） = 想定ラウンド数\n「使用回数：3」 = min(3, 想定ラウンド数)\n1回限り = 1\n「各ラウンド1回まで」で3ラウンド想定 = 1.5~2.5 等。',
  },
};

function CoeffHelp({type}){
  const [open,setOpen]=useState(false);
  const h=COEFF_HELP[type];
  if(!h) return null;
  return(
    <span className="coeff-help-wrap">
      <button className="coeff-help-btn" onClick={e=>{e.stopPropagation();setOpen(!open);}} title={h.title}>
        <HelpCircle size={13}/>
      </button>
      {open&&(
        <div className="coeff-help-popup">
          <div className="coeff-help-header">
            <strong>{h.title}</strong>
            <button className="btn-icon" onClick={()=>setOpen(false)}><X size={12}/></button>
          </div>
          <p>{h.desc}</p>
        </div>
      )}
    </span>
  );
}

// ── Coefficient mode or direct score ──────────────────────────────────────────
function calcTagScore(tag){
  if(tag.useCoefficients){
    const base=Number(tag.baseValue)||0;
    const easeRaw=Number(tag.triggerEase);
    const ease=isNaN(easeRaw)?1:easeRaw;
    const countRaw=Number(tag.expectedCount);
    const count=isNaN(countRaw)?1:countRaw;
    return Math.round(base*ease*count*100)/100;
  }
  return Number(tag.score)||0;
}

// ── TagRow (外部コンポーネント) ───────────────────────────────────────────────
// TagManager 内部に定義すると再レンダリングのたびに別コンポーネントとして
// 生成し直され、フォーカスが外れる原因になる。外部に切り出して解決。
function TagRow({tag,idx,groups,getSD,handleSI,updateTagGroup,updateTagField,moveTag,delTag}){
  const isCoeff=tag.useCoefficients;
  const computedScore=isCoeff?calcTagScore(tag):(Number(getSD(tag.id))||0);
  return(
    <div className="tag-row" style={{flexDirection:'column',gap:6}}>
      <div style={{display:'flex',alignItems:'center',gap:7,width:'100%'}}>
        <div className="tag-row-left">
          <span className="tag-pill">{tag.name}</span>
          <select className="combo-select" style={{fontSize:'.72rem',padding:'3px 6px',maxWidth:90}}
            value={tag.groupId||''} onChange={e=>updateTagGroup(tag.id,e.target.value)}>
            <option value="">グループなし</option>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="tag-score-area">
          {!isCoeff&&(
            <input
              type="text"
              inputMode="decimal"
              className="score-input"
              placeholder="0"
              value={getSD(tag.id)}
              onChange={e=>handleSI(tag.id,e.target.value)}
            />
          )}
          {computedScore!==0&&(
            <span className="score-preview" style={{color:computedScore>0?'#34d399':'#f87171'}}>
              {computedScore>0?`+${computedScore}`:computedScore}
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:2,alignItems:'center'}}>
          <button className={`btn-icon coeff-mode-btn ${isCoeff?'on':''}`}
            onClick={()=>updateTagField(tag.id,'useCoefficients',!isCoeff)}
            title={isCoeff?'直接入力モードに切替':'係数モードに切替'}>
            <Calculator size={12}/>
          </button>
          <button className="btn-icon" onClick={()=>moveTag(idx,-1)}><ArrowUp size={12}/></button>
          <button className="btn-icon" onClick={()=>moveTag(idx,1)}><ArrowDown size={12}/></button>
          <button className="btn-icon danger" onClick={()=>delTag(tag.id)}><Trash2 size={13}/></button>
        </div>
      </div>
      {isCoeff&&(
        <div className="coeff-panel">
          <div className="coeff-row">
            <label className="coeff-label">
              基本価値 <CoeffHelp type="baseValue"/>
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="score-input coeff-input"
              placeholder="0"
              value={toDisplay(tag.baseValue)}
              onChange={e=>updateTagField(tag.id,'baseValue',fromInput(e.target.value))}
            />
          </div>
          <span className="coeff-op">×</span>
          <div className="coeff-row">
            <label className="coeff-label">
              発動容易度 <CoeffHelp type="triggerEase"/>
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="score-input coeff-input"
              placeholder="1.0"
              value={toDisplay(tag.triggerEase)}
              onChange={e=>updateTagField(tag.id,'triggerEase',fromInput(e.target.value))}
            />
          </div>
          <span className="coeff-op">×</span>
          <div className="coeff-row">
            <label className="coeff-label">
              期待発動回数 <CoeffHelp type="expectedCount"/>
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="score-input coeff-input"
              placeholder="1"
              value={toDisplay(tag.expectedCount)}
              onChange={e=>updateTagField(tag.id,'expectedCount',fromInput(e.target.value))}
            />
          </div>
          <span className="coeff-eq">=</span>
          <span className="coeff-result" style={{color:computedScore>0?'#34d399':computedScore<0?'#f87171':'var(--muted)'}}>
            {computedScore>0?`+${computedScore}`:computedScore}
          </span>
        </div>
      )}
    </div>
  );
}

export default function TagManager({tags,setTags,groups,setGroups,tagCombos,setTagCombos,calcAdjusters,setCalcAdjusters}){
  const [newTagName,setNTN]=useState('');
  const [newTagScore,setNTS]=useState('');
  const [newTagGroup,setNTG]=useState('');
  const [newGroupName,setNGN]=useState('');
  const [combo,setCombo]=useState({triggerTag:'',conditionTag:'',targetTag:'',overrideScore:'',scope:'deck'});
  const [adj,setAdj]=useState({opType:'×',value:'',scope:'deck'});
  const [saved,setSaved]=useState(false);

  const [scoreInputs,setScoreInputs]=useState(()=>{const m={};for(const t of tags) m[t.id]=toDisplay(t.score);return m;});
  useEffect(()=>{
    setScoreInputs(prev=>{const m={};for(const t of tags) m[t.id]=(t.id in prev)?prev[t.id]:toDisplay(t.score);return m;});
  },[tags]);
  const getSD=id=>scoreInputs[id]??'';
  const handleSI=(id,raw)=>{ setScoreInputs(p=>({...p,[id]:raw})); updateTagScore(id,fromInput(raw)); };

  const tagNames=tags.map(t=>t.name);

  // Groups
  const addGroup=()=>{
    const n=newGroupName.trim();if(!n||groups.some(g=>g.name===n))return;
    const u=[...groups,{id:genId(),name:n}];setGroups(u);saveGroups(u);setNGN('');
  };
  const delGroup=id=>{
    const ut=tags.map(t=>t.groupId===id?{...t,groupId:null}:t);setTags(ut);saveTags(ut);
    const ug=groups.filter(g=>g.id!==id);setGroups(ug);saveGroups(ug);
  };
  const moveGroup=(idx,dir)=>{
    const a=[...groups],ni=idx+dir;if(ni<0||ni>=a.length)return;
    [a[idx],a[ni]]=[a[ni],a[idx]];setGroups(a);saveGroups(a);
  };

  // Tags
  const addTag=()=>{
    const n=newTagName.trim();if(!n||tags.some(t=>t.name===n))return;
    const nid=genId(),ns=fromInput(newTagScore);
    const u=[...tags,{id:nid,name:n,score:ns,groupId:newTagGroup||null,useCoefficients:false,baseValue:0,triggerEase:1,expectedCount:1}];
    setTags(u);saveTags(u);setScoreInputs(p=>({...p,[nid]:toDisplay(ns)}));
    setNTN('');setNTS('');setNTG('');
  };
  const updateTagScore=(id,v)=>setTags(tags.map(t=>t.id===id?{...t,score:Number(v)}:t));
  const updateTagGroup=(id,gid)=>{const u=tags.map(t=>t.id===id?{...t,groupId:gid||null}:t);setTags(u);saveTags(u);};
  const updateTagField=(id,field,val)=>{
    const u=tags.map(t=>{
      if(t.id!==id) return t;
      const updated={...t,[field]:val};
      // Auto-calculate score when coefficients change
      if(updated.useCoefficients && ['baseValue','triggerEase','expectedCount','useCoefficients'].includes(field)){
        updated.score=calcTagScore(updated);
      }
      return updated;
    });
    setTags(u);
    // Update score input display as well  
    const tag=u.find(t=>t.id===id);
    if(tag?.useCoefficients){
      setScoreInputs(p=>({...p,[id]:toDisplay(tag.score)}));
    }
  };
  const delTag=id=>{const u=tags.filter(t=>t.id!==id);setTags(u);saveTags(u);};
  const moveTag=(idx,dir)=>{
    const a=[...tags],ni=idx+dir;if(ni<0||ni>=a.length)return;
    [a[idx],a[ni]]=[a[ni],a[idx]];setTags(a);saveTags(a);
  };
  const saveScores=()=>{saveTags(tags);setSaved(true);setTimeout(()=>setSaved(false),2000);};

  // Combos
  const addCombo=()=>{
    const{triggerTag,conditionTag,targetTag,overrideScore,scope}=combo;
    if(!triggerTag||!conditionTag||!targetTag)return;
    const u=[...tagCombos,{id:genId(),triggerTag,conditionTag,targetTag,overrideScore:fromInput(overrideScore),scope}];
    setTagCombos(u);saveTagCombos(u);
    setCombo({triggerTag:'',conditionTag:'',targetTag:'',overrideScore:'',scope:'deck'});
  };
  const delCombo=id=>{const u=tagCombos.filter(c=>c.id!==id);setTagCombos(u);saveTagCombos(u);};

  // Calc adjusters
  const addAdj=()=>{
    const v=Number(adj.value);if(!adj.value||isNaN(v)||v===0)return;
    const u=[...(calcAdjusters||[]),{id:genId(),opType:adj.opType,value:v,scope:adj.scope}];
    setCalcAdjusters(u);saveCalcAdjusters(u);setAdj({opType:'×',value:'',scope:'deck'});
  };
  const delAdj=id=>{const u=(calcAdjusters||[]).filter(a=>a.id!==id);setCalcAdjusters(u);saveCalcAdjusters(u);};
  const moveAdj=(idx,dir)=>{
    const a=[...(calcAdjusters||[])],ni=idx+dir;if(ni<0||ni>=a.length)return;
    [a[idx],a[ni]]=[a[ni],a[idx]];setCalcAdjusters(a);saveCalcAdjusters(a);
  };

  const ungrouped=tags.filter(t=>!t.groupId);
  const getGroupTags=gid=>tags.filter(t=>t.groupId===gid);

  return(
    <div className="tagmgr-layout">
      {/* Tags */}
      <section className="glass-panel tagmgr-section">
        <div className="section-head">
          <h2 className="stat-title"><Tag size={15} style={{display:'inline',marginRight:6}}/>タグ一覧</h2>
          <button className={`deck-btn save-confirm-btn ${saved?'saved':''}`} onClick={saveScores}>
            <Save size={13}/>{saved?'✓ 保存済み':'スコア保存'}
          </button>
        </div>
        <div className="coeff-legend">
          <span className="coeff-legend-item"><Calculator size={11}/> 係数モード</span>
          <span className="coeff-legend-desc">タグ横の <Calculator size={10}/> ボタンで「基本価値 × 発動容易度 × 期待発動回数」の係数入力に切り替え</span>
        </div>
        <div className="tag-add-row">
          <input className="search-input" placeholder="タグ名" value={newTagName}
            onChange={e=>setNTN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()}/>
          <input type="text" inputMode="decimal" className="score-input" placeholder="0" value={newTagScore} onChange={e=>setNTS(e.target.value)}/>
          <select className="combo-select" value={newTagGroup} onChange={e=>setNTG(e.target.value)}>
            <option value="">グループなし</option>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button className="deck-btn auto-btn" onClick={addTag}><Plus size={13}/> 追加</button>
        </div>
        {tags.length===0&&<p className="empty-msg">タグがありません</p>}
        {groups.map((g,gi)=>{
          const gt=getGroupTags(g.id);if(!gt.length)return null;
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
              {gt.map(tag=><TagRow key={tag.id} tag={tag} idx={tags.indexOf(tag)}
                groups={groups} getSD={getSD} handleSI={handleSI}
                updateTagGroup={updateTagGroup} updateTagField={updateTagField}
                moveTag={moveTag} delTag={delTag}/>)}
            </div>
          );
        })}
        {ungrouped.length>0&&(
          <div className="tag-group-block">
            <div className="tag-group-header">
              <span className="tag-group-name" style={{color:'#64748b'}}>グループなし</span>
            </div>
            {ungrouped.map(tag=><TagRow key={tag.id} tag={tag} idx={tags.indexOf(tag)}
              groups={groups} getSD={getSD} handleSI={handleSI}
              updateTagGroup={updateTagGroup} updateTagField={updateTagField}
              moveTag={moveTag} delTag={delTag}/>)}
          </div>
        )}
        <div className="tag-add-row" style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--panel-border)'}}>
          <input className="search-input" placeholder="グループ名" value={newGroupName}
            onChange={e=>setNGN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addGroup()}/>
          <button className="deck-btn" onClick={addGroup}><Plus size={13}/> グループ追加</button>
        </div>
      </section>

      {/* Combos */}
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
            <select className="combo-select" value={combo.triggerTag} onChange={e=>setCombo(p=>({...p,triggerTag:e.target.value}))}>
              <option value="">-- 選択 --</option>{tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">× 条件</label>
            <select className="combo-select" value={combo.conditionTag} onChange={e=>setCombo(p=>({...p,conditionTag:e.target.value}))}>
              <option value="">-- 選択 --</option>{tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">= 対象</label>
            <select className="combo-select" value={combo.targetTag} onChange={e=>setCombo(p=>({...p,targetTag:e.target.value}))}>
              <option value="">-- 選択 --</option>{tagNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <label className="combo-label">スコア</label>
            <input type="text" inputMode="decimal" className="score-input combo-score" placeholder="0" value={combo.overrideScore} onChange={e=>setCombo(p=>({...p,overrideScore:e.target.value}))}/>
            <label className="combo-label">適用範囲</label>
            <select className="combo-select" value={combo.scope} onChange={e=>setCombo(p=>({...p,scope:e.target.value}))}>
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
                <span className="combo-score-badge" style={{color:c.overrideScore>0?'#34d399':'#f87171'}}>{c.overrideScore>0?`+${c.overrideScore}`:c.overrideScore}</span>
                <span className="combo-scope-badge">{c.scope==='card'?'カード':'デッキ'}</span>
              </div>
              <button className="btn-icon danger" onClick={()=>delCombo(c.id)}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </section>

      {/* Calc Adjusters */}
      <section className="glass-panel tagmgr-section" style={{gridColumn:'1/-1'}}>
        <div className="section-head">
          <h2 className="stat-title"><Calculator size={15} style={{display:'inline',marginRight:6,color:'#60a5fa'}}/>計算調整タグ</h2>
        </div>
        <p className="combo-hint">
          ここで定義した調整タグは「カード評価」画面でカードに付与できます。<br/>
          付与することで、<strong>カード単体</strong>: そのカードのスコアに掛け算/割り算が適用されます。<br/>
          <strong>デッキ全体</strong>: そのタグを持つカードがデッキにある場合、デッキ総合点に適用されます（複数枚あれば複数回適用）。<br/>
          ここに定義するだけでは点数に影響しません。カードに付与して初めて効果を発揮します。
        </p>
        <div className="combo-form glass-panel" style={{background:'rgba(0,0,0,.2)',gap:8}}>
          <div className="adj-form-row">
            <select className="combo-select" value={adj.opType} onChange={e=>setAdj(p=>({...p,opType:e.target.value}))}>
              {OPS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <input type="text" inputMode="decimal" className="score-input" placeholder="数値" value={adj.value}
              onChange={e=>setAdj(p=>({...p,value:e.target.value}))} style={{width:80}}/>
            <select className="combo-select" value={adj.scope} onChange={e=>setAdj(p=>({...p,scope:e.target.value}))}>
              {SCOPES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <button className="deck-btn auto-btn" onClick={addAdj} disabled={!adj.value||Number(adj.value)===0}>
              <Plus size={13}/> 追加
            </button>
          </div>
        </div>
        {(!calcAdjusters||calcAdjusters.length===0)&&<p className="empty-msg">計算調整タグなし</p>}
        <div className="combo-list">
          {(calcAdjusters||[]).map((a,i)=>(
            <div key={a.id} className="combo-item">
              <div className="combo-tags">
                <span className="adj-op-badge" style={{color:a.opType==='×'?'#60a5fa':'#c084fc',borderColor:a.opType==='×'?'rgba(96,165,250,.4)':'rgba(192,132,252,.4)'}}>
                  {a.opType} {a.value}
                </span>
                <span className="combo-scope-badge">{a.scope==='card'?'カード':'デッキ'}</span>
              </div>
              <div style={{display:'flex',gap:2}}>
                <button className="btn-icon" onClick={()=>moveAdj(i,-1)}><ArrowUp size={12}/></button>
                <button className="btn-icon" onClick={()=>moveAdj(i,1)}><ArrowDown size={12}/></button>
                <button className="btn-icon danger" onClick={()=>delAdj(a.id)}><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
