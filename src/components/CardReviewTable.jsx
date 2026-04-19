import React,{useState,useMemo,useCallback,useEffect,useRef} from 'react';
import {ChevronLeft,ChevronRight,X,ChevronDown,ChevronRight as CR} from 'lucide-react';
import {saveCardTags} from '../utils/storage';
import {calcCardScore} from '../utils/tagScoring';

const TYPE_LABELS={character:'キャラ',weapon:'武器',artifact:'聖遺物',talent:'天賦',support:'サポート',event:'イベント'};
const TYPE_COLORS={character:'#f87171',weapon:'#60a5fa',artifact:'#c084fc',talent:'#fbbf24',support:'#34d399',event:'#94a3b8'};
const ELEM_COLORS={氷:'#93c5fd',水:'#60a5fa',炎:'#f87171',雷:'#c084fc',風:'#34d399',岩:'#fbbf24',草:'#4ade80',無色:'#94a3b8'};
const TYPE_FILTERS=['all','character','weapon','artifact','talent','support','event'];
const PAGE_SIZE=40;

// ── Fixed tag picker overlay ──────────────────────────────────────────────────
function TagPickerOverlay({cardId,cardTagArr,tags,groups,position,onClose,onToggle}){
  const ref=useRef(null);

  // Clamp to viewport after render
  useEffect(()=>{
    if(!ref.current) return;
    const el=ref.current;
    const rect=el.getBoundingClientRect();
    let{left,top}=position;
    if(left+rect.width>window.innerWidth-8) left=window.innerWidth-rect.width-8;
    if(top+rect.height>window.innerHeight-8) top=window.innerHeight-rect.height-8;
    if(left<8) left=8; if(top<8) top=8;
    el.style.left=left+'px'; el.style.top=top+'px';
  },[position]);

  // ── NO document event listener ──
  // Closing is handled by the backdrop div rendered below.
  // This fixes the mobile issue where mousedown fired during keyboard open/close
  // and closed the picker unexpectedly.

  const [collapsed,setCollapsed]=useState({});
  const toggleCollapse=gid=>setCollapsed(p=>({...p,[gid]:!p[gid]}));

  // Count of each tag on this card
  const countMap=useMemo(()=>{
    const m={};
    for(const t of cardTagArr) m[t]=(m[t]||0)+1;
    return m;
  },[cardTagArr]);

  // Group constraint: which tag name is already "locked in" for each group?
  const groupLock=useMemo(()=>{
    const m={};
    for(const tag of tags){
      if(!tag.groupId) continue;
      if((countMap[tag.name]||0)>0) m[tag.groupId]=tag.name;
    }
    return m;
  },[tags,countMap]);

  const renderTagBtn=(tag)=>{
    const cnt=countMap[tag.name]||0;
    const isLocked=tag.groupId&&groupLock[tag.groupId]&&groupLock[tag.groupId]!==tag.name;
    // Show score only when non-zero (handles null/0/empty all as "no display")
    const scoreNum=Number(tag.score)||0;
    return(
      <button key={tag.id}
        className={`tag-toggle-btn ${cnt>0?'on':''} ${isLocked?'locked':''}`}
        disabled={isLocked}
        onClick={()=>onToggle(cardId,tag.name,'add')}
        onContextMenu={e=>{e.preventDefault();onToggle(cardId,tag.name,'remove');}}>
        {tag.name}
        {cnt>0&&<span className="tag-cnt-badge">×{cnt}</span>}
        {scoreNum!==0&&(
          <span className="tag-score-hint" style={{color:scoreNum>0?'#34d399':'#f87171'}}>
            {scoreNum>0?`+${scoreNum}`:scoreNum}
          </span>
        )}
      </button>
    );
  };

  const ungrouped=tags.filter(t=>!t.groupId);

  // Backdrop + picker rendered together.
  // The backdrop (z-index 9999) covers the whole screen and calls onClose on any tap/click.
  // The picker (z-index 10000) is above the backdrop, so interactions inside DON'T reach the backdrop.
  // This is reliable on both desktop and mobile — no mousedown/touchstart event timing issues.
  return(
    <>
      {/* Transparent backdrop — tapping anywhere outside picker closes it */}
      <div
        className="picker-backdrop"
        onClick={onClose}
        onTouchStart={e=>{ e.preventDefault(); onClose(); }}
      />
      <div ref={ref} className="tag-picker-fixed" style={{left:position.left,top:position.top}}>
        <div className="tag-picker-header">
          <span>タグを選択（長押し/右クリックで削除）</span>
          <button className="btn-icon" onClick={onClose}><X size={13}/></button>
        </div>
        {tags.length===0&&<p className="empty-msg" style={{padding:'6px 0'}}>先に「タグ管理」でタグを作成</p>}

        {groups.map(g=>{
          const gTags=tags.filter(t=>t.groupId===g.id);
          if(!gTags.length) return null;
          const isOpen=!collapsed[g.id];
          return(
            <div key={g.id} className="picker-group">
              <button className="picker-group-hd" onClick={()=>toggleCollapse(g.id)}>
                {isOpen?<ChevronDown size={12}/>:<CR size={12}/>}
                {g.name}
                {groupLock[g.id]&&<span className="tag-pill" style={{marginLeft:4,fontSize:'.65rem'}}>{groupLock[g.id]}</span>}
              </button>
              {isOpen&&<div className="tag-picker-list">{gTags.map(renderTagBtn)}</div>}
            </div>
          );
        })}

        {ungrouped.length>0&&(
          <div className="picker-group">
            <button className="picker-group-hd" onClick={()=>toggleCollapse('__ug')}>
              {!collapsed['__ug']?<ChevronDown size={12}/>:<CR size={12}/>}
              グループなし
            </button>
            {!collapsed['__ug']&&<div className="tag-picker-list">{ungrouped.map(renderTagBtn)}</div>}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CardReviewTable({cards,tags,groups,cardTags,setCardTags,tagCombos}){
  const [typeFilter,setTF]=useState('all');
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const [picker,setPicker]=useState(null); // {cardId, left, top}

  const filtered=useMemo(()=>{
    let l=Object.values(cards);
    if(typeFilter!=='all') l=l.filter(c=>c.type===typeFilter);
    if(search) l=l.filter(c=>c.name.includes(search));
    return l;
  },[cards,typeFilter,search]);

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const pageCards=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const openPicker=useCallback((cardId,e)=>{
    e.stopPropagation();
    if(picker?.cardId===cardId){ setPicker(null); return; }
    const rect=e.currentTarget.getBoundingClientRect();
    setPicker({cardId,left:rect.left,top:rect.bottom+6});
  },[picker]);

  const closePicker=useCallback(()=>setPicker(null),[]);

  const handleToggle=useCallback((cardId,tagName,action)=>{
    setCardTags(prev=>{
      const cur=[...(prev[cardId]||[])];
      if(action==='add'){
        // Group constraint check
        const tag=tags.find(t=>t.name===tagName);
        if(tag?.groupId){
          const hasDiff=cur.some(n=>{
            const t2=tags.find(t=>t.name===n);
            return t2?.groupId===tag.groupId&&n!==tagName;
          });
          if(hasDiff) return prev; // blocked
        }
        cur.push(tagName);
      } else {
        // Remove last occurrence
        const idx=[...cur].reverse().findIndex(n=>n===tagName);
        if(idx>=0) cur.splice(cur.length-1-idx,1);
      }
      const updated={...prev,[cardId]:cur};
      saveCardTags(updated);
      return updated;
    });
  },[tags]);

  const score=id=>calcCardScore(id,cardTags,tags,tagCombos);

  return(
    <div className="review-layout">
      <div className="glass-panel review-filter-bar">
        <input className="search-input" placeholder="カード名で検索..."
          value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        <div className="filters">
          {TYPE_FILTERS.map(t=>(
            <button key={t} className={`filter-btn ${typeFilter===t?'active':''}`}
              onClick={()=>{setTF(t);setPage(0);}}>
              {t==='all'?'全て':TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="review-stats-row">
          <span className="pool-count">{filtered.length}枚</span>
          <span className="pool-count">タグ付き:{Object.values(cardTags).filter(t=>t?.length>0).length}枚</span>
        </div>
      </div>

      <div className="glass-panel review-grid-wrap">
        <div className="review-card-grid">
          {pageCards.map(card=>{
            const myTags=cardTags[card.id]||[];
            const s=score(card.id);
            const isOpen=picker?.cardId===card.id;
            const ec=ELEM_COLORS[card.element]||'#94a3b8';

            return(
              <div key={card.id}
                className={`review-card-cell ${myTags.length>0?'tagged':''} ${isOpen?'editing':''}`}
                onClick={e=>openPicker(card.id,e)}>
                <div className="rc-elem-strip" style={{background:ec}}/>
                <img src={card.url} alt={card.name} className="rc-img"
                  onError={e=>{e.target.style.display='none';}} loading="lazy"/>
                <div className="rc-info">
                  <span className="rc-name">{card.name}</span>
                  <span className="rc-type" style={{color:TYPE_COLORS[card.type]}}>{TYPE_LABELS[card.type]}</span>
                </div>
                {myTags.length>0&&(
                  <div className="rc-tags">
                    {/* Show unique tag names with count */}
                    {[...new Set(myTags)].map(t=>{
                      const cnt=myTags.filter(x=>x===t).length;
                      return(
                        <span key={t} className="rc-tag-chip">
                          {t}{cnt>1&&<span style={{fontSize:'.6rem',opacity:.8}}>×{cnt}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
                {s!==0&&(
                  <div className="rc-score-badge" style={{
                    background:s>0?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)',
                    color:s>0?'#34d399':'#f87171'}}>
                    {s>0?`+${s}`:s}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <button className="page-btn" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button>
          <span className="page-info">{page+1} / {Math.max(1,totalPages)}</span>
          <button className="page-btn" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button>
        </div>
      </div>

      {/* Fixed overlay picker rendered at body level via portal-like approach */}
      {picker&&(
        <TagPickerOverlay
          cardId={picker.cardId}
          cardTagArr={cardTags[picker.cardId]||[]}
          tags={tags}
          groups={groups}
          position={{left:picker.left,top:picker.top}}
          onClose={closePicker}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
