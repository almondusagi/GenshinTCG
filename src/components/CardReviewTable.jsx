import React,{useState,useMemo,useCallback,useEffect,useRef} from 'react';
import {ChevronLeft,ChevronRight,X,ChevronDown,ChevronRight as CR,Eye} from 'lucide-react';
import {saveCardTags} from '../utils/storage';
import {calcCardScore,adjTagKey,isAdjTag,adjIdFromTag} from '../utils/tagScoring';
import FilterSortBar,{applyFilterSort} from './FilterSortBar';

const TL={character:'キャラ',weapon:'武器',artifact:'聖遺物',talent:'天賦',support:'サポート',event:'イベント'};
const TC={character:'#f87171',weapon:'#60a5fa',artifact:'#c084fc',talent:'#fbbf24',support:'#34d399',event:'#94a3b8'};
const EC={氷:'#93c5fd',水:'#60a5fa',炎:'#f87171',雷:'#c084fc',風:'#34d399',岩:'#fbbf24',草:'#4ade80',無色:'#94a3b8'};
const TF=['all','character','weapon','artifact','talent','support','event'];
const PAGE_SIZE=40;

// ── Long press hook (same as DeckBuilder) ─────────────────────────────────────
function useLongPress(onLong,onShort,delay=150){
  const timer=useRef(null);
  const fired=useRef(false);
  const start=useCallback((e)=>{
    fired.current=false;
    const ev=e.touches?.[0]??e;
    timer.current=setTimeout(()=>{fired.current=true;onLong(ev);},delay);
  },[onLong,delay]);
  const end=useCallback((e)=>{
    clearTimeout(timer.current);
    if(!fired.current) onShort(e);
    fired.current=false;
  },[onShort]);
  const cancel=useCallback(()=>{clearTimeout(timer.current);fired.current=false;},[]);
  return{
    onMouseDown:start,onMouseUp:end,onMouseLeave:cancel,
    onTouchStart:(e)=>{e.preventDefault();start(e);},
    onTouchEnd:(e)=>{e.preventDefault();end(e);},
    onTouchMove:cancel,
  };
}

// ── Desktop fixed overlay picker ──────────────────────────────────────────────
function DesktopPicker({cardId,cardTagArr,tags,groups,calcAdjusters,position,onClose,onToggle}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!ref.current) return;
    const el=ref.current;
    const rect=el.getBoundingClientRect();
    let{left,top}=position;
    if(left+rect.width>window.innerWidth-8) left=window.innerWidth-rect.width-8;
    if(top+rect.height>window.innerHeight-8) top=window.innerHeight-rect.height-8;
    if(left<8) left=8;if(top<8) top=8;
    el.style.left=left+'px';el.style.top=top+'px';
  },[position]);

  const [collapsed,setCollapsed]=useState({});
  const toggle=gid=>setCollapsed(p=>({...p,[gid]:!p[gid]}));

  const countMap=useMemo(()=>{const m={};for(const t of cardTagArr) m[t]=(m[t]||0)+1;return m;},[cardTagArr]);
  const groupLock=useMemo(()=>{
    const m={};
    for(const tag of tags){
      if(!tag.groupId) continue;
      if((countMap[tag.name]||0)>0) m[tag.groupId]=tag.name;
    }
    return m;
  },[tags,countMap]);

  const renderBtn=(tag,key)=>{
    const cnt=countMap[key]||0;
    const isLocked=tag.groupId&&groupLock[tag.groupId]&&groupLock[tag.groupId]!==tag.name;
    const s=Number(tag.score)||0;
    return(
      <button key={key} className={`tag-toggle-btn ${cnt>0?'on':''} ${isLocked?'locked':''}`}
        disabled={isLocked}
        onClick={()=>onToggle(cardId,key,'add')}
        onContextMenu={e=>{e.preventDefault();onToggle(cardId,key,'remove');}}>
        {tag.name}
        {cnt>0&&<span className="tag-cnt-badge">×{cnt}</span>}
        {s!==0&&<span className="tag-score-hint" style={{color:s>0?'#34d399':'#f87171'}}>{s>0?`+${s}`:s}</span>}
      </button>
    );
  };

  const ungrouped=tags.filter(t=>!t.groupId);
  return(
    <>
      <div className="picker-backdrop" onClick={onClose} onTouchStart={e=>{e.preventDefault();onClose();}}/>
      <div ref={ref} className="tag-picker-fixed" style={{left:position.left,top:position.top}}>
        <div className="tag-picker-header">
          <span>タグ選択（右クリックで削除）</span>
          <button className="btn-icon" onClick={onClose}><X size={13}/></button>
        </div>
        {tags.length===0&&!calcAdjusters?.length&&<p className="empty-msg" style={{padding:'6px 0'}}>先に「タグ管理」でタグを作成</p>}
        {groups.map(g=>{
          const gTags=tags.filter(t=>t.groupId===g.id);
          if(!gTags.length) return null;
          const isOpen=!collapsed[g.id];
          return(
            <div key={g.id} className="picker-group">
              <button className="picker-group-hd" onClick={()=>toggle(g.id)}>
                {isOpen?<ChevronDown size={12}/>:<CR size={12}/>}{g.name}
                {groupLock[g.id]&&<span className="tag-pill" style={{marginLeft:4,fontSize:'.65rem'}}>{groupLock[g.id]}</span>}
              </button>
              {isOpen&&<div className="tag-picker-list">{gTags.map(t=>renderBtn(t,t.name))}</div>}
            </div>
          );
        })}
        {ungrouped.length>0&&(
          <div className="picker-group">
            <button className="picker-group-hd" onClick={()=>toggle('__ug')}>
              {!collapsed['__ug']?<ChevronDown size={12}/>:<CR size={12}/>}グループなし
            </button>
            {!collapsed['__ug']&&<div className="tag-picker-list">{ungrouped.map(t=>renderBtn(t,t.name))}</div>}
          </div>
        )}
        {calcAdjusters?.length>0&&(
          <div className="picker-group">
            <button className="picker-group-hd" onClick={()=>toggle('__adj')}>
              {!collapsed['__adj']?<ChevronDown size={12}/>:<CR size={12}/>}計算調整タグ
            </button>
            {!collapsed['__adj']&&(
              <div className="tag-picker-list">
                {calcAdjusters.map(a=>{
                  const key=adjTagKey(a.id);
                  const cnt=countMap[key]||0;
                  return(
                    <button key={a.id} className={`tag-toggle-btn ${cnt>0?'on':''}`}
                      onClick={()=>onToggle(cardId,key,'add')}
                      onContextMenu={e=>{e.preventDefault();onToggle(cardId,key,'remove');}}>
                      <span className="adj-op-badge" style={{fontSize:'.7rem',padding:'0 4px',color:a.opType==='×'?'#60a5fa':'#c084fc',borderColor:a.opType==='×'?'rgba(96,165,250,.4)':'rgba(192,132,252,.4)'}}>{a.opType}{a.value}</span>
                      <span style={{fontSize:'.7rem',color:'#64748b'}}>{a.scope==='deck'?'デッキ':'カード'}</span>
                      {cnt>0&&<span className="tag-cnt-badge">×{cnt}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Mobile bottom sheet picker ────────────────────────────────────────────────
function MobileBottomSheet({cardId,cardTagArr,tags,groups,calcAdjusters,onClose,onToggle}){
  const [collapsed,setCollapsed]=useState({});
  const toggle=gid=>setCollapsed(p=>({...p,[gid]:!p[gid]}));
  const countMap=useMemo(()=>{const m={};for(const t of cardTagArr) m[t]=(m[t]||0)+1;return m;},[cardTagArr]);
  const groupLock=useMemo(()=>{
    const m={};
    for(const tag of tags){
      if(!tag.groupId) continue;
      if((countMap[tag.name]||0)>0) m[tag.groupId]=tag.name;
    }
    return m;
  },[tags,countMap]);

  const renderTagRow=(tag,key)=>{
    const cnt=countMap[key]||0;
    const isLocked=tag.groupId&&groupLock[tag.groupId]&&groupLock[tag.groupId]!==tag.name;
    const s=Number(tag.score)||0;
    return(
      <div key={key} className={`bs-tag-row ${isLocked?'locked':''}`}>
        <span className="bs-tag-name">
          {tag.name}
          {s!==0&&<span className="tag-score-hint" style={{color:s>0?'#34d399':'#f87171',marginLeft:4}}>{s>0?`+${s}`:s}</span>}
        </span>
        <div className="bs-tag-controls">
          <button className="bs-pm-btn minus" disabled={cnt===0||isLocked}
            onTouchStart={e=>e.stopPropagation()}
            onTouchEnd={e=>{e.preventDefault();e.stopPropagation();if(!isLocked&&cnt>0)onToggle(cardId,key,'remove');}}>
            −
          </button>
          <span className="bs-tag-cnt">{cnt||0}</span>
          <button className="bs-pm-btn plus" disabled={isLocked}
            onTouchStart={e=>e.stopPropagation()}
            onTouchEnd={e=>{e.preventDefault();e.stopPropagation();if(!isLocked)onToggle(cardId,key,'add');}}>
            +
          </button>
        </div>
      </div>
    );
  };

  const ungrouped=tags.filter(t=>!t.groupId);
  return(
    <>
      <div className="picker-backdrop" onClick={onClose} onTouchStart={e=>{e.preventDefault();onClose();}}/>
      <div className="bs-sheet">
        <div className="bs-handle"/>
        <div className="bs-header">
          <span>タグを設定</span>
          <button className="btn-icon" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="bs-body">
          {groups.map(g=>{
            const gTags=tags.filter(t=>t.groupId===g.id);
            if(!gTags.length) return null;
            const isOpen=!collapsed[g.id];
            return(
              <div key={g.id} className="bs-group">
                <button className="bs-group-hd" onClick={()=>toggle(g.id)}>
                  {isOpen?<ChevronDown size={14}/>:<CR size={14}/>}
                  {g.name}
                  {groupLock[g.id]&&<span className="tag-pill" style={{marginLeft:6,fontSize:'.68rem'}}>{groupLock[g.id]}</span>}
                </button>
                {isOpen&&gTags.map(t=>renderTagRow(t,t.name))}
              </div>
            );
          })}
          {ungrouped.length>0&&(
            <div className="bs-group">
              <button className="bs-group-hd" onClick={()=>toggle('__ug')}>
                {!collapsed['__ug']?<ChevronDown size={14}/>:<CR size={14}/>}グループなし
              </button>
              {!collapsed['__ug']&&ungrouped.map(t=>renderTagRow(t,t.name))}
            </div>
          )}
          {calcAdjusters?.length>0&&(
            <div className="bs-group">
              <button className="bs-group-hd" onClick={()=>toggle('__adj')}>
                {!collapsed['__adj']?<ChevronDown size={14}/>:<CR size={14}/>}計算調整タグ
              </button>
              {!collapsed['__adj']&&calcAdjusters.map(a=>{
                const key=adjTagKey(a.id);
                const tag={name:`${a.opType}${a.value} (${a.scope==='deck'?'デッキ':'カード'})`,score:0,groupId:null};
                return renderTagRow(tag,key);
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Image preview overlay ─────────────────────────────────────────────────────
function ImgPreview({card,onClose}){
  if(!card) return null;
  const ec=EC[card.element]||'#94a3b8';
  return(
    <div className="img-preview-overlay" onClick={onClose}>
      <div className="img-preview-box" onClick={e=>e.stopPropagation()} style={{borderColor:ec}}>
        <img src={card.url} alt={card.name} onError={e=>e.target.style.display='none'}/>
        <div className="img-preview-info">
          <span style={{fontWeight:700}}>{card.name}</span>
          <span style={{color:TC[card.type],fontSize:'.8rem'}}>{TL[card.type]}</span>
          <span style={{color:ec,fontSize:'.8rem'}}>{card.element}</span>
        </div>
        <button className="btn-icon" style={{position:'absolute',top:6,right:6}} onClick={onClose}><X size={16}/></button>
      </div>
    </div>
  );
}

function useIsMobile(){
  const [m,set]=useState(()=>window.innerWidth<=768);
  useEffect(()=>{const h=()=>set(window.innerWidth<=768);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  return m;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CardReviewTable({cards,tags,groups,cardTags,setCardTags,tagCombos,calcAdjusters=[]}){
  const [typeFilter,setTF]=useState('all');
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const [picker,setPicker]=useState(null);
  const [preview,setPreview]=useState(null);
  const [filterTags,setFilterTags]=useState([]);
  const [sortKeys,setSortKeys]=useState([]);
  const [sortDir,setSortDir]=useState('desc');
  const isMobile=useIsMobile();

  const base=useMemo(()=>{
    let l=Object.values(cards);
    if(typeFilter!=='all') l=l.filter(c=>c.type===typeFilter);
    if(search) l=l.filter(c=>c.name.includes(search));
    return l;
  },[cards,typeFilter,search]);

  const filtered=useMemo(()=>applyFilterSort(base,cardTags,filterTags,sortKeys,sortDir),
    [base,cardTags,filterTags,sortKeys,sortDir]);

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const pageCards=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const openPicker=useCallback((cardId,e)=>{
    if(picker?.cardId===cardId){setPicker(null);return;}
    if(isMobile){
      setPicker({cardId,mobile:true});
    } else {
      const rect=e.currentTarget.getBoundingClientRect();
      setPicker({cardId,left:rect.left,top:rect.bottom+6});
    }
  },[picker,isMobile]);

  const closePicker=useCallback(()=>setPicker(null),[]);

  const handleToggle=useCallback((cardId,tagKey,action)=>{
    setCardTags(prev=>{
      const cur=[...(prev[cardId]||[])];
      if(action==='add'){
        // Group constraint (only for non-adj regular tags)
        if(!isAdjTag(tagKey)){
          const tag=tags.find(t=>t.name===tagKey);
          if(tag?.groupId){
            const hasDiff=cur.filter(n=>!isAdjTag(n)).some(n=>{
              const t2=tags.find(t=>t.name===n);
              return t2?.groupId===tag.groupId&&n!==tagKey;
            });
            if(hasDiff) return prev;
          }
        }
        cur.push(tagKey);
      } else {
        const idx=[...cur].reverse().findIndex(n=>n===tagKey);
        if(idx>=0) cur.splice(cur.length-1-idx,1);
      }
      const updated={...prev,[cardId]:cur};
      saveCardTags(updated);
      return updated;
    });
  },[tags]);

  const score=id=>calcCardScore(id,cardTags,tags,tagCombos,calcAdjusters);

  return(
    <div className="review-layout">
      <div className="glass-panel review-filter-bar">
        <input className="search-input" placeholder="カード名で検索..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        <div className="filters">
          {TF.map(t=>(
            <button key={t} className={`filter-btn ${typeFilter===t?'active':''}`}
              onClick={()=>{setTF(t);setPage(0);}}>
              {t==='all'?'全て':TL[t]}
            </button>
          ))}
        </div>
        <FilterSortBar tags={tags} filterTags={filterTags} onFilterChange={v=>{setFilterTags(v);setPage(0);}}
          sortKeys={sortKeys} onSortChange={setSortKeys} sortDir={sortDir} onSortDirChange={setSortDir}/>
        <div className="review-stats-row">
          <span className="pool-count">{filtered.length}枚</span>
          <span className="pool-count">タグ付き:{Object.values(cardTags).filter(t=>t?.length>0).length}枚</span>
        </div>
      </div>

      <div className="glass-panel review-grid-wrap">
        {isMobile?(
          /* Mobile: name-based list with long press preview */
          <div className="mob-review-list">
            {pageCards.map(card=>{
              const myTags=(cardTags[card.id]||[]).filter(t=>!isAdjTag(t));
              const s=score(card.id);
              const isOpen=picker?.cardId===card.id;
              const ec=EC[card.element]||'#94a3b8';
              const handlers=useLongPress(
                ()=>setPreview(card),
                (e)=>openPicker(card.id,e),
              );
              return(
                <div key={card.id} className={`mob-review-item ${myTags.length>0?'tagged':''} ${isOpen?'editing':''}`}
                  {...handlers}>
                  <div className="mob-review-elem" style={{background:ec}}/>
                  <div className="mob-review-main">
                    <span className="mob-review-name">{card.name}</span>
                    <div className="mob-review-meta">
                      <span className="rc-type" style={{color:TC[card.type]}}>{TL[card.type]}</span>
                      {myTags.length>0&&(
                        <div className="rc-tags" style={{display:'inline-flex'}}>
                          {[...new Set(myTags)].slice(0,3).map(t=>{
                            const c=myTags.filter(x=>x===t).length;
                            return <span key={t} className="rc-tag-chip">{t}{c>1&&`×${c}`}</span>;
                          })}
                          {[...new Set(myTags)].length>3&&<span className="rc-tag-chip">+{[...new Set(myTags)].length-3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  {s!==0&&<span className="rc-score-badge" style={{background:s>0?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)',color:s>0?'#34d399':'#f87171',alignSelf:'center'}}>{s>0?`+${s}`:s}</span>}
                </div>
              );
            })}
          </div>
        ):(
          /* Desktop: image grid */
          <div className="review-card-grid">
            {pageCards.map(card=>{
              const myTags=(cardTags[card.id]||[]).filter(t=>!isAdjTag(t));
              const adjTags=(cardTags[card.id]||[]).filter(isAdjTag);
              const s=score(card.id);
              const isOpen=picker?.cardId===card.id;
              const ec=EC[card.element]||'#94a3b8';
              return(
                <div key={card.id}
                  className={`review-card-cell ${myTags.length>0||adjTags.length>0?'tagged':''} ${isOpen?'editing':''}`}
                  onClick={e=>openPicker(card.id,e)}>
                  <div className="rc-elem-strip" style={{background:ec}}/>
                  <img src={card.url} alt={card.name} className="rc-img"
                    onError={e=>e.target.style.display='none'} loading="lazy"/>
                  <div className="rc-info">
                    <span className="rc-name">{card.name}</span>
                    <span className="rc-type" style={{color:TC[card.type]}}>{TL[card.type]}</span>
                  </div>
                  {myTags.length>0&&(
                    <div className="rc-tags">
                      {[...new Set(myTags)].map(t=>{
                        const c=myTags.filter(x=>x===t).length;
                        return <span key={t} className="rc-tag-chip">{t}{c>1&&<span style={{fontSize:'.6rem'}}>×{c}</span>}</span>;
                      })}
                      {adjTags.length>0&&<span className="rc-tag-chip" style={{color:'#60a5fa',borderColor:'rgba(96,165,250,.4)'}}>計算×{adjTags.length}</span>}
                    </div>
                  )}
                  {s!==0&&<div className="rc-score-badge" style={{background:s>0?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)',color:s>0?'#34d399':'#f87171'}}>{s>0?`+${s}`:s}</div>}
                </div>
              );
            })}
          </div>
        )}
        <div className="pagination">
          <button className="page-btn" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button>
          <span className="page-info">{page+1} / {Math.max(1,totalPages)}</span>
          <button className="page-btn" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button>
        </div>
      </div>

      {/* Pickers */}
      {picker&&!picker.mobile&&(
        <DesktopPicker cardId={picker.cardId}
          cardTagArr={cardTags[picker.cardId]||[]}
          tags={tags} groups={groups} calcAdjusters={calcAdjusters}
          position={{left:picker.left,top:picker.top}}
          onClose={closePicker} onToggle={handleToggle}/>
      )}
      {picker?.mobile&&(
        <MobileBottomSheet cardId={picker.cardId}
          cardTagArr={cardTags[picker.cardId]||[]}
          tags={tags} groups={groups} calcAdjusters={calcAdjusters}
          onClose={closePicker} onToggle={handleToggle}/>
      )}
      <ImgPreview card={preview} onClose={()=>setPreview(null)}/>
    </div>
  );
}
