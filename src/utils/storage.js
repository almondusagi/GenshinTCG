const KEYS = {
  TAGS:'gcg_tags', GROUPS:'gcg_groups', TAG_COMBOS:'gcg_tag_combos',
  CALC_ADJUSTERS:'gcg_calc_adjusters',
  CARD_TAGS:'gcg_card_tags', PRESETS:'gcg_presets',
  META:'genshin_tcg_meta', INITIALIZED:'gcg_initialized',
};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

export const loadGroups=()=>load(KEYS.GROUPS,[]);
export const saveGroups=v=>save(KEYS.GROUPS,v);
export const loadTags=()=>load(KEYS.TAGS,[]);
export const saveTags=v=>save(KEYS.TAGS,v);
export const loadTagCombos=()=>load(KEYS.TAG_COMBOS,[]);
export const saveTagCombos=v=>save(KEYS.TAG_COMBOS,v);
// calcAdjusters: [{ id, opType:'×'|'÷', value:number, scope:'deck'|'card' }]
export const loadCalcAdjusters=()=>load(KEYS.CALC_ADJUSTERS,[]);
export const saveCalcAdjusters=v=>save(KEYS.CALC_ADJUSTERS,v);
export const loadCardTags=()=>load(KEYS.CARD_TAGS,{});
export const saveCardTags=v=>save(KEYS.CARD_TAGS,v);
export const loadPresets=()=>load(KEYS.PRESETS,[]);
export const savePresets=v=>save(KEYS.PRESETS,v);
export const loadMeta=()=>load(KEYS.META,null);
export const saveMeta=v=>save(KEYS.META,v);
export const clearMeta=()=>localStorage.removeItem(KEYS.META);

// ── Default data ──────────────────────────────────────────────────────────────
export const DEFAULT_GROUPS=[
  {id:'g_cost',name:'コスト'},{id:'g_hp',name:'HP'},{id:'g_shield',name:'シールド'},
];
export const DEFAULT_TAGS=[
  {id:'t_cost0',name:'コスト０',score:0,groupId:'g_cost'},
  {id:'t_cost1',name:'コスト１',score:0,groupId:'g_cost'},
  {id:'t_costm1',name:'コスト-１',score:0,groupId:'g_cost'},
  {id:'t_same',name:'同一',score:0,groupId:'g_cost'},
  {id:'t_hp1',name:'HP１',score:0,groupId:'g_hp'},
  {id:'t_hpm1',name:'HP-１',score:0,groupId:'g_hp'},
  {id:'t_sh1',name:'シールド１',score:0,groupId:'g_shield'},
  {id:'t_shm1',name:'シールド-１',score:0,groupId:'g_shield'},
  {id:'t_dice1',name:'サイコロ１',score:0,groupId:null},
  {id:'t_dicem1',name:'サイコロ-１',score:0,groupId:null},
  {id:'t_univ_add',name:'万能（指定）増加',score:0,groupId:null},
  {id:'t_univ_conv',name:'万能（指定）変換',score:0,groupId:null},
  {id:'t_select',name:'選択',score:0,groupId:null},
  {id:'t_besel',name:'被選択',score:0,groupId:null},
  {id:'t_discard',name:'破棄',score:0,groupId:null},
  {id:'t_bediscard',name:'被破棄',score:0,groupId:null},
  {id:'t_harmony',name:'調和',score:0,groupId:null},
  {id:'t_nullify',name:'無効化（相手）',score:0,groupId:null},
  {id:'t_dmg1',name:'与ダメージ１',score:0,groupId:null},
  {id:'t_dmgm1',name:'与ダメージ-１',score:0,groupId:null},
];

// ── Cost tag auto-computation ─────────────────────────────────────────────────
export function computeCostTags(card){
  if(card.type==='character') return [];
  const cost=card.cost;
  if(!cost||!Array.isArray(cost)) return [];
  const valid=cost.filter(c=>c.cost_type!=='GCG_COST_INVALID'&&c.cost_type!=='GCG_COST_LEGEND');
  if(valid.length===0) return ['コスト０'];
  const result=[];
  let total=0,hasNonVoid=false;
  for(const e of valid){
    const n=e.count||0;
    const isVoid=e.cost_type==='GCG_COST_DICE_VOID';
    if(!isVoid) hasNonVoid=true;
    total+=n;
    for(let i=0;i<n;i++) result.push('コスト１');
  }
  if(result.length===0) return ['コスト０'];
  // ── 同一タグはコスト１の個数と同じ数だけ付与 ──
  // 例: 同一2コスト → コスト１×2 + 同一×2
  // 無色コストは hasNonVoid=false なので同一タグは付与しない
  if(total>=2&&hasNonVoid){
    for(let i=0;i<total;i++) result.push('同一');
  }
  return result;
}

// ── First-run init ────────────────────────────────────────────────────────────
export function initDefaults(cards){
  if(localStorage.getItem(KEYS.INITIALIZED)) return false;
  saveGroups(DEFAULT_GROUPS);
  saveTags(DEFAULT_TAGS);
  saveTagCombos([]);
  saveCalcAdjusters([]);
  const ct={};
  for(const [id,card] of Object.entries(cards)){
    const tags=computeCostTags(card);
    if(tags.length) ct[id]=tags;
  }
  saveCardTags(ct);
  localStorage.setItem(KEYS.INITIALIZED,'1');
  return true;
}

// ── Backup / Restore ──────────────────────────────────────────────────────────
export function exportBackup(){
  const data={version:2,exportedAt:new Date().toISOString(),
    groups:loadGroups(),tags:loadTags(),tagCombos:loadTagCombos(),
    calcAdjusters:loadCalcAdjusters(),
    cardTags:loadCardTags(),presets:loadPresets()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`gcg_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
}
export function importBackup(text){
  const d=JSON.parse(text);
  if(!d.version) throw new Error('不正なファイルです');
  if(d.groups)         saveGroups(d.groups);
  if(d.tags)           saveTags(d.tags);
  if(d.tagCombos)      saveTagCombos(d.tagCombos);
  if(d.calcAdjusters)  saveCalcAdjusters(d.calcAdjusters);
  if(d.cardTags)       saveCardTags(d.cardTags);
  if(d.presets)        savePresets(d.presets);
  return d;
}
