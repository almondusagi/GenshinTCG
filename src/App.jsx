import React,{useState,useEffect,useMemo} from 'react';
import DeckBuilder from './components/DeckBuilder';
import Analytics from './components/Analytics';
import TournamentUploader from './components/TournamentUploader';
import CardReviewTable from './components/CardReviewTable';
import TagManager from './components/TagManager';
import dbData from './data/cards_db.json';
import {calcDeckScore,getMetaAnalytics} from './utils/tagScoring';
import {
  loadTags,loadTagCombos,loadCardTags,loadGroups,loadCalcAdjusters,
  loadMeta,saveMeta,clearMeta as clearMetaStorage,initDefaults
} from './utils/storage';
import {Swords,BarChart3,Database,Star,Tag} from 'lucide-react';

const NAV=[
  {id:'build',  label:'構築',      Icon:Swords},
  {id:'review', label:'カード評価', Icon:Star},
  {id:'tags',   label:'タグ管理',   Icon:Tag},
  {id:'analytics',label:'メタ分析', Icon:BarChart3},
  {id:'data',   label:'データ管理', Icon:Database},
];

export default function App(){
  const [activeTab,setTab]=useState('build');
  const [cards,setCards]=useState({});
  const [metaDecks,setMeta]=useState([]); // ← デフォルトは空
  const [tags,setTags]=useState([]);
  const [groups,setGroups]=useState([]);
  const [tagCombos,setCombos]=useState([]);
  const [calcAdjusters,setCalcAdjusters]=useState([]);
  const [cardTags,setCardTags]=useState({});
  const [selectedChars,setChars]=useState([]);
  const [selectedActions,setActions]=useState([]);

  useEffect(()=>{
    const c=dbData.cards;
    setCards(c);
    initDefaults(c);
    setGroups(loadGroups());
    setTags(loadTags());
    setCombos(loadTagCombos());
    setCalcAdjusters(loadCalcAdjusters());
    setCardTags(loadCardTags());
    const saved=loadMeta();
    // デフォルトのメタデッキは空（savedがあればそれを使用）
    setMeta(saved||[]);
  },[]);

  const score=useMemo(()=>
    calcDeckScore(selectedChars,selectedActions,cardTags,tags,tagCombos,calcAdjusters),
    [selectedChars,selectedActions,cardTags,tags,tagCombos,calcAdjusters]);

  const handleUpdateMeta=d=>{const c=[...metaDecks,...d];setMeta(c);saveMeta(c);};
  const handleClearMeta=()=>{setMeta([]);clearMetaStorage();};

  return(
    <div className="app-container">
      <nav className="glass-panel navbar desktop-nav">
        <div className="brand"><Swords size={24}/> GI-TCG Analyzer</div>
        <div className="nav-tabs">
          {NAV.map(({id,label,Icon})=>(
            <button key={id} className={`tab-btn ${activeTab===id?'active':''}`} onClick={()=>setTab(id)}>
              <Icon size={14} style={{marginRight:5,verticalAlign:'text-bottom'}}/>{label}
            </button>
          ))}
        </div>
      </nav>
      <div className="mobile-topbar">
        <span className="brand"><Swords size={18}/> GI-TCG</span>
      </div>
      <main className="main-content">
        {activeTab==='build'&&(
          <DeckBuilder cards={cards}
            selectedChars={selectedChars} setSelectedChars={setChars}
            selectedActions={selectedActions} setSelectedActions={setActions}
            score={score} cardTags={cardTags} tags={tags} tagCombos={tagCombos}
            calcAdjusters={calcAdjusters}/>
        )}
        {activeTab==='review'&&(
          <CardReviewTable cards={cards} tags={tags} groups={groups}
            cardTags={cardTags} setCardTags={setCardTags}
            tagCombos={tagCombos} calcAdjusters={calcAdjusters}/>
        )}
        {activeTab==='tags'&&(
          <TagManager tags={tags} setTags={setTags} groups={groups} setGroups={setGroups}
            tagCombos={tagCombos} setTagCombos={setCombos}
            calcAdjusters={calcAdjusters} setCalcAdjusters={setCalcAdjusters}/>
        )}
        {activeTab==='analytics'&&(
          <Analytics metaDecks={metaDecks} cards={cards} analyticsData={getMetaAnalytics(metaDecks)}/>
        )}
        {activeTab==='data'&&(
          <TournamentUploader metaDecks={metaDecks} onUpdateMeta={handleUpdateMeta} onClearMeta={handleClearMeta}/>
        )}
      </main>
      <nav className="mobile-bottom-nav">
        {NAV.map(({id,label,Icon})=>(
          <button key={id} className={`mobile-nav-item ${activeTab===id?'active':''}`} onClick={()=>setTab(id)}>
            <Icon size={18}/><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
