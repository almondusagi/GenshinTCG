import React,{useMemo} from 'react';
import {BarChart3} from 'lucide-react';
const EC={氷:'#93c5fd',水:'#60a5fa',炎:'#f87171',雷:'#c084fc',風:'#34d399',岩:'#fbbf24',草:'#4ade80',無色:'#94a3b8'};
export default function Analytics({metaDecks,cards,analyticsData}){
  const{charCount={},actionCount={}}=analyticsData||{};
  const topChars=useMemo(()=>Object.entries(charCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,n])=>({id,n,card:cards[id]})),[charCount,cards]);
  const topActions=useMemo(()=>Object.entries(actionCount).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([id,n])=>({id,n,card:cards[id]})),[actionCount,cards]);
  const mc=topChars[0]?.n||1,ma=topActions[0]?.n||1;
  if(!metaDecks?.length) return(
    <div className="analytics-view">
      <div className="glass-panel" style={{gridColumn:'1/-1',textAlign:'center',padding:64}}>
        <BarChart3 size={48} style={{opacity:.3,margin:'0 auto 16px'}}/>
        <p style={{color:'var(--muted)'}}>データなし</p>
      </div>
    </div>
  );
  return(
    <div className="analytics-view">
      <div className="glass-panel stat-card" style={{gridColumn:'1/-1'}}>
        <h3 className="stat-title">メタ概要</h3>
        <div style={{display:'flex',gap:32,flexWrap:'wrap'}}>
          {[['登録デッキ数',metaDecks.length,'var(--gold)'],['使用キャラ',Object.keys(charCount).length,'#60a5fa'],['使用アクション',Object.keys(actionCount).length,'#34d399']].map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:'2rem',fontWeight:700,color:c}}>{v}</div><div style={{color:'var(--muted)',fontSize:'.9rem'}}>{l}</div></div>
          ))}
        </div>
      </div>
      <div className="glass-panel stat-card">
        <h3 className="stat-title">TOP キャラ</h3>
        <ul className="stat-list">
          {topChars.map(({id,n,card},i)=>(
            <li key={id} className="stat-item">
              <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                {card?.url&&<img src={card.url} alt="" style={{width:32,height:44,objectFit:'cover',borderRadius:4}} onError={e=>{e.target.style.display='none';}}/>}
                <div><div style={{fontWeight:600}}>{card?.name||id}</div><div style={{color:EC[card?.element]||'#94a3b8',fontSize:'.8rem'}}>{card?.element}</div></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,color:i===0?'var(--gold)':i===1?'silver':i===2?'#cd7f32':'var(--text)'}}>{n}デッキ</div>
                <div className="bar-container"><div className="bar-fill" style={{width:`${n/mc*100}%`,background:EC[card?.element]||'var(--primary)'}}/></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass-panel stat-card">
        <h3 className="stat-title">TOP アクション</h3>
        <ul className="stat-list">
          {topActions.map(({id,n,card},i)=>(
            <li key={id} className="stat-item">
              <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                {card?.url&&<img src={card.url} alt="" style={{width:28,height:38,objectFit:'cover',borderRadius:3}} onError={e=>{e.target.style.display='none';}}/>}
                <span style={{fontWeight:500}}>{card?.name||id}</span>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700}}>{n}デッキ</div>
                <div className="bar-container"><div className="bar-fill" style={{width:`${n/ma*100}%`}}/></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
