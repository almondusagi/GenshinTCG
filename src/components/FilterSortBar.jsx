import React,{useState} from 'react';
import {Filter,ArrowUpDown,ArrowUp,ArrowDown,X} from 'lucide-react';

// filterTags: string[]  – cards must have ALL of these (AND logic)
// sortKeys:   [{name, dir:'asc'|'desc'}]  – in priority order, same dir for all
// onFilter / onSort callbacks

export default function FilterSortBar({tags,filterTags,onFilterChange,sortKeys,onSortChange,sortDir,onSortDirChange}){
  const [filterOpen,setFO]=useState(false);
  const [sortOpen,setSO]=useState(false);

  // Only regular (non-adj) tags for filter/sort
  const regularTags=tags.filter(t=>t.name&&!t.name.startsWith('adj:'));

  const toggleFilter=name=>{
    if(filterTags.includes(name)) onFilterChange(filterTags.filter(t=>t!==name));
    else onFilterChange([...filterTags,name]);
  };
  const toggleSort=name=>{
    if(sortKeys.find(k=>k.name===name)) onSortChange(sortKeys.filter(k=>k.name!==name));
    else onSortChange([...sortKeys,{name}]);
  };
  const clearFilter=()=>onFilterChange([]);
  const clearSort=()=>onSortChange([]);

  const hasFilt=filterTags.length>0;
  const hasSort=sortKeys.length>0;

  return(
    <div className="fsbar">
      {/* Filter toggle */}
      <div className="fsbar-row">
        <button className={`fsbar-btn ${hasFilt?'active':''} ${filterOpen?'open':''}`}
          onClick={()=>{ setFO(o=>!o); setSO(false); }}>
          <Filter size={13}/> フィルター {hasFilt&&`(${filterTags.length})`}
        </button>
        <button className={`fsbar-btn ${hasSort?'active':''} ${sortOpen?'open':''}`}
          onClick={()=>{ setSO(o=>!o); setFO(false); }}>
          <ArrowUpDown size={13}/> ソート {hasSort&&`(${sortKeys.length})`}
        </button>
        {hasSort&&(
          <button className="fsbar-dir-btn" onClick={()=>onSortDirChange(sortDir==='desc'?'asc':'desc')}>
            {sortDir==='desc'?<ArrowDown size={14}/>:<ArrowUp size={14}/>}
          </button>
        )}
        {(hasFilt||hasSort)&&(
          <button className="fsbar-clear" onClick={()=>{ clearFilter(); clearSort(); }}>
            <X size={13}/> 全クリア
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilt&&(
        <div className="fsbar-chips">
          {filterTags.map(name=>(
            <span key={name} className="fschip active" onClick={()=>toggleFilter(name)}>
              {name} <X size={10}/>
            </span>
          ))}
        </div>
      )}

      {/* Active sort keys with priority numbers */}
      {hasSort&&(
        <div className="fsbar-chips">
          {sortKeys.map((k,i)=>(
            <span key={k.name} className="fschip sort" onClick={()=>toggleSort(k.name)}>
              <span className="fs-priority">{i+1}</span>{k.name} <X size={10}/>
            </span>
          ))}
        </div>
      )}

      {/* Filter tag picker dropdown */}
      {filterOpen&&(
        <div className="fsbar-panel">
          <div className="fsbar-panel-title">絞り込むタグを選択（AND条件）</div>
          <div className="fsbar-tag-list">
            {regularTags.map(t=>(
              <button key={t.id}
                className={`filter-btn ${filterTags.includes(t.name)?'active':''}`}
                onClick={()=>toggleFilter(t.name)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort tag picker dropdown */}
      {sortOpen&&(
        <div className="fsbar-panel">
          <div className="fsbar-panel-title">ソートキーを選択順に追加</div>
          <div className="fsbar-tag-list">
            {regularTags.map(t=>{
              const idx=sortKeys.findIndex(k=>k.name===t.name);
              return(
                <button key={t.id}
                  className={`filter-btn ${idx>=0?'active':''}`}
                  onClick={()=>toggleSort(t.name)}>
                  {idx>=0&&<span className="fs-priority">{idx+1}</span>}
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Utility functions (used in DeckBuilder and CardReviewTable) ───────────────
export function applyFilterSort(cardList,cardTags,filterTags,sortKeys,sortDir){
  let list=[...cardList];

  // Filter: keep only cards that have at least one instance of ALL filter tags
  if(filterTags.length>0){
    list=list.filter(card=>{
      const myTags=cardTags[card.id]||[];
      return filterTags.every(ft=>myTags.includes(ft));
    });
  }

  // Sort: multi-key by tag count in selection order
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
