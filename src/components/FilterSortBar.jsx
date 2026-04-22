import React,{useState} from 'react';
import {Filter,ArrowUpDown,ArrowUp,ArrowDown,X,Tag,Layers} from 'lucide-react';

// ── Type filter items ─────────────────────────────────────────────────────────
// These filter by card properties (element / legend flag), not by cardTags.
const ELEMENTS = ['氷','水','炎','雷','風','岩','草'];
const ELEM_COLORS = {
  氷:'#93c5fd',水:'#60a5fa',炎:'#f87171',雷:'#c084fc',
  風:'#34d399',岩:'#fbbf24',草:'#4ade80',
};
const TYPE_ITEMS = [
  ...ELEMENTS.map(e=>({ key:e, label:e, color:ELEM_COLORS[e] })),
  { key:'秘伝', label:'秘伝', color:'#c084fc' },
];

// Does a card match a single type-filter key?
function cardMatchesTypeKey(card, key){
  if(key==='秘伝'){
    return Array.isArray(card.cost)&&card.cost.some(c=>c.cost_type==='GCG_COST_LEGEND');
  }
  return card.element===key;
}

// ── Main component ────────────────────────────────────────────────────────────
// typeFilters : string[]  – OR logic among elements; 秘伝 is AND-ed separately
// filterTags  : string[]  – AND logic (card must have ALL selected tags)
// sortKeys    : [{name}]  – priority-ordered tag sort keys
export default function FilterSortBar({
  tags,
  typeFilters, onTypeFilterChange,
  filterTags,  onFilterChange,
  sortKeys,    onSortChange,
  sortDir,     onSortDirChange,
}){
  const [filterOpen,setFO]=useState(false);
  const [sortOpen,  setSO]=useState(false);

  const regularTags=tags.filter(t=>t.name&&!t.name.startsWith('adj:'));

  const toggleType=key=>{
    if(typeFilters.includes(key)) onTypeFilterChange(typeFilters.filter(k=>k!==key));
    else onTypeFilterChange([...typeFilters,key]);
  };
  const toggleTag=name=>{
    if(filterTags.includes(name)) onFilterChange(filterTags.filter(t=>t!==name));
    else onFilterChange([...filterTags,name]);
  };
  const toggleSort=name=>{
    if(sortKeys.find(k=>k.name===name)) onSortChange(sortKeys.filter(k=>k.name!==name));
    else onSortChange([...sortKeys,{name}]);
  };
  const clearAll=()=>{ onTypeFilterChange([]); onFilterChange([]); onSortChange([]); };

  const hasType = typeFilters.length>0;
  const hasTags = filterTags.length>0;
  const hasSort = sortKeys.length>0;
  const hasAny  = hasType||hasTags||hasSort;

  // Combined active chip count for the button label
  const filtCount = typeFilters.length + filterTags.length;

  return(
    <div className="fsbar">
      {/* ── Toggle buttons row ────────────────────── */}
      <div className="fsbar-row">
        <button
          className={`fsbar-btn ${filtCount>0?'active':''} ${filterOpen?'open':''}`}
          onClick={()=>{ setFO(o=>!o); setSO(false); }}>
          <Filter size={13}/> フィルター {filtCount>0&&`(${filtCount})`}
        </button>
        <button
          className={`fsbar-btn ${hasSort?'active':''} ${sortOpen?'open':''}`}
          onClick={()=>{ setSO(o=>!o); setFO(false); }}>
          <ArrowUpDown size={13}/> ソート {hasSort&&`(${sortKeys.length})`}
        </button>
        {hasSort&&(
          <button className="fsbar-dir-btn"
            onClick={()=>onSortDirChange(sortDir==='desc'?'asc':'desc')}>
            {sortDir==='desc'?<ArrowDown size={14}/>:<ArrowUp size={14}/>}
          </button>
        )}
        {hasAny&&(
          <button className="fsbar-clear" onClick={clearAll}>
            <X size={13}/> 全クリア
          </button>
        )}
      </div>

      {/* ── Active chips ──────────────────────────── */}
      {(hasType||hasTags)&&(
        <div className="fsbar-chips">
          {typeFilters.map(k=>{
            const item=TYPE_ITEMS.find(i=>i.key===k);
            return(
              <span key={k} className="fschip type-chip"
                style={{color:item?.color||'#94a3b8',borderColor:(item?.color||'#94a3b8')+'55',
                  background:(item?.color||'#94a3b8')+'18'}}
                onClick={()=>toggleType(k)}>
                {k} <X size={10}/>
              </span>
            );
          })}
          {filterTags.map(name=>(
            <span key={name} className="fschip active" onClick={()=>toggleTag(name)}>
              {name} <X size={10}/>
            </span>
          ))}
        </div>
      )}
      {hasSort&&(
        <div className="fsbar-chips">
          {sortKeys.map((k,i)=>(
            <span key={k.name} className="fschip sort" onClick={()=>toggleSort(k.name)}>
              <span className="fs-priority">{i+1}</span>{k.name} <X size={10}/>
            </span>
          ))}
        </div>
      )}

      {/* ── Filter panel ──────────────────────────── */}
      {filterOpen&&(
        <div className="fsbar-panel">
          {/* タイプ section */}
          <div className="fsbar-section-head">
            <Layers size={12}/> タイプ
            <span className="fsbar-section-hint">（元素・秘伝。OR条件）</span>
          </div>
          <div className="fsbar-tag-list">
            {TYPE_ITEMS.map(item=>(
              <button key={item.key}
                className={`filter-btn ${typeFilters.includes(item.key)?'active':''}`}
                style={typeFilters.includes(item.key)?{}:
                  {color:item.color,borderColor:item.color+'44',background:item.color+'11'}}
                onClick={()=>toggleType(item.key)}>
                {item.label}
              </button>
            ))}
          </div>

          {/* タグ section */}
          <div className="fsbar-section-head" style={{marginTop:10}}>
            <Tag size={12}/> タグ
            <span className="fsbar-section-hint">（AND条件）</span>
          </div>
          <div className="fsbar-tag-list">
            {regularTags.length===0
              ? <span className="fsbar-empty">タグがありません</span>
              : regularTags.map(t=>(
                  <button key={t.id}
                    className={`filter-btn ${filterTags.includes(t.name)?'active':''}`}
                    onClick={()=>toggleTag(t.name)}>
                    {t.name}
                  </button>
                ))
            }
          </div>
        </div>
      )}

      {/* ── Sort panel ────────────────────────────── */}
      {sortOpen&&(
        <div className="fsbar-panel">
          <div className="fsbar-section-head">
            <Tag size={12}/> タグを選択順に追加
          </div>
          <div className="fsbar-tag-list">
            {regularTags.length===0
              ? <span className="fsbar-empty">タグがありません</span>
              : regularTags.map(t=>{
                  const idx=sortKeys.findIndex(k=>k.name===t.name);
                  return(
                    <button key={t.id}
                      className={`filter-btn ${idx>=0?'active':''}`}
                      onClick={()=>toggleSort(t.name)}>
                      {idx>=0&&<span className="fs-priority">{idx+1}</span>}
                      {t.name}
                    </button>
                  );
                })
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Utility: apply both type-filters and tag-filters + sort ──────────────────
export function applyFilterSort(cardList, cardTags, typeFilters, filterTags, sortKeys, sortDir){
  let list=[...cardList];

  // Type filter: OR among selected type keys (element or 秘伝)
  if(typeFilters.length>0){
    list=list.filter(card=>typeFilters.some(k=>cardMatchesTypeKey(card,k)));
  }

  // Tag filter: AND — card must have every selected tag at least once
  if(filterTags.length>0){
    list=list.filter(card=>{
      const myTags=cardTags[card.id]||[];
      return filterTags.every(ft=>myTags.includes(ft));
    });
  }

  // Multi-key sort by tag count, priority = selection order
  if(sortKeys.length>0){
    list.sort((a,b)=>{
      for(const {name} of sortKeys){
        const aT=cardTags[a.id]||[];
        const bT=cardTags[b.id]||[];
        const ac=aT.filter(t=>t===name).length;
        const bc=bT.filter(t=>t===name).length;
        if(ac!==bc) return sortDir==='desc'?bc-ac:ac-bc;
      }
      return 0;
    });
  }

  return list;
}