/**
 * 七聖召喚 スキルテキスト取得スクリプト
 * ==========================================
 * @genshin-db/tcg を使って全カードのスキルテキストを取得し、
 * cards_db.json の各カードに skills フィールドとして追記します。
 *
 * 使い方:
 *   node fetch_skills.js              # 通常実行（更新を保存）
 *   node fetch_skills.js --dry-run    # プレビューのみ（保存しない）
 *   node fetch_skills.js --lang JP    # 言語指定（デフォルト: JP = 日本語）
 *   node fetch_skills.js --verbose    # 詳細ログ
 */

const gdb = require('@genshin-db/tcg');
const fs = require('fs');
const path = require('path');

// ── 設定 ─────────────────────────────────────────────────────────────────────
const DB_PATHS = [
  path.join(__dirname, 'cards_db.json'),
  path.join(__dirname, 'src', 'data', 'cards_db.json'),
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const LANG_ARG = args.find(a => a.startsWith('--lang='))?.split('=')[1] 
              || (args.indexOf('--lang') >= 0 ? args[args.indexOf('--lang') + 1] : null);
const LANG = LANG_ARG || 'Japanese';

// ── 初期化 ────────────────────────────────────────────────────────────────────
gdb.setOptions({
  resultLanguage: LANG,
  queryLanguages: [LANG, 'Japanese', 'English'],
});

console.log('=' .repeat(55));
console.log('  七聖召喚 スキルテキスト取得ツール (genshin-db)');
console.log('=' .repeat(55));
console.log(`  言語: ${LANG}  |  Dry-run: ${DRY_RUN}`);
console.log('');

// ── ヘルパー: スキルコストをDB形式に変換 ─────────────────────────────────────
function convertCost(playcost) {
  if (!playcost) return [];
  return playcost
    .filter(c => c.costtype !== 'GCG_COST_ENERGY') // エナジーは除外（HPで管理）
    .map(c => ({
      cost_type: c.costtype,
      count: c.count,
    }));
}

// ── スキルタイプのマッピング ──────────────────────────────────────────────────
const SKILL_TYPE_MAP = {
  'GCG_SKILL_TAG_A':       'normal',
  'GCG_SKILL_TAG_E':       'skill',
  'GCG_SKILL_TAG_Q':       'burst',
  'GCG_SKILL_TAG_PASSIVE': 'passive',
};

function mapSkillType(typetag) {
  return SKILL_TYPE_MAP[typetag] || 'special';
}

// ── キャラクターカードのスキル取得 ────────────────────────────────────────────
function getCharacterSkills(dbCard) {
  // DB上の名前でnanoka側のIDを使ってgdb検索
  let gdbCard = null;
  
  // まず日本語名で検索
  try {
    gdbCard = gdb.tcgcharactercard(dbCard.name);
  } catch (e) { /* 名前が異なる場合 */ }
  
  if (!gdbCard) return null;

  const skills = (gdbCard.skills || []).map(sk => ({
    id:          String(sk.id),
    name:        sk.name || '',
    description: sk.description || '',
    cost:        convertCost(sk.playcost),
    type:        mapSkillType(sk.typetag),
    typeName:    sk.type || '',
    baseDamage:  sk.basedamage,
    baseElement: sk.baseelement,
  }));

  return skills;
}

// ── アクションカードの効果テキスト取得 ───────────────────────────────────────
function getActionCardDescription(dbCard) {
  let gdbCard = null;
  
  try {
    gdbCard = gdb.tcgactioncard(dbCard.name);
  } catch (e) { /* 名前が異なる場合 */ }
  
  if (!gdbCard) return null;

  const desc = gdbCard.description || gdbCard.descriptionraw || '';
  if (!desc) return null;

  return [{
    id:          'effect',
    name:        '効果',
    description: desc,
    cost:        [],
    type:        'special',
    typeName:    'アクション',
  }];
}

// ── メイン処理 ────────────────────────────────────────────────────────────────
function main() {
  // DBファイル読み込み
  const dbPath = DB_PATHS.find(p => fs.existsSync(p));
  if (!dbPath) {
    console.error('❌ cards_db.json が見つかりません');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const cards = db.cards;
  const total = Object.keys(cards).length;
  console.log(`📊 現在のDB: ${total}枚\n`);

  let updated = 0, failed = 0, noData = 0, unchanged = 0;
  const failedCards = [];

  // 全カードを処理
  for (const [cardId, card] of Object.entries(cards)) {
    let newSkills = null;

    if (card.type === 'character') {
      newSkills = getCharacterSkills(card);
    } else {
      newSkills = getActionCardDescription(card);
    }

    if (!newSkills || newSkills.length === 0) {
      noData++;
      failedCards.push({ id: cardId, name: card.name, type: card.type });
      continue;
    }

    // 既存のskillsと比較（変更がなければスキップ）
    const existing = JSON.stringify(card.skills || []);
    const newStr   = JSON.stringify(newSkills);
    
    if (existing === newStr) {
      unchanged++;
    } else {
      card.skills = newSkills;
      updated++;

      if (VERBOSE) {
        console.log(`  ✅ [${cardId}] ${card.name}`);
        for (const sk of newSkills) {
          console.log(`      [${sk.typeName}] ${sk.name}: ${sk.description.substring(0, 60)}...`);
        }
      }
    }
  }

  // 結果表示
  console.log('📊 結果:');
  console.log(`   ✅ 更新:    ${updated}枚`);
  console.log(`   ⏭️  変更なし: ${unchanged}枚`);
  console.log(`   ❓ 取得失敗: ${noData}枚`);

  if (failedCards.length > 0 && VERBOSE) {
    console.log('\n  取得できなかったカード:');
    for (const c of failedCards.slice(0, 20)) {
      console.log(`    [${c.type}] ${c.name} (${c.id})`);
    }
    if (failedCards.length > 20) {
      console.log(`    ...他${failedCards.length - 20}枚`);
    }
  }

  // サンプル表示
  console.log('\n🔍 スキルデータ サンプル（キャラ）:');
  let shown = 0;
  for (const [cardId, card] of Object.entries(cards)) {
    if (card.type === 'character' && card.skills?.length > 0 && shown < 2) {
      console.log(`  [${card.name}]`);
      for (const sk of card.skills) {
        console.log(`    [${sk.typeName}] ${sk.name}: ${sk.description.substring(0, 60)}`);
      }
      shown++;
    }
  }

  console.log('\n🔍 スキルデータ サンプル（アクション）:');
  shown = 0;
  for (const [cardId, card] of Object.entries(cards)) {
    if (card.type !== 'character' && card.skills?.length > 0 && shown < 2) {
      console.log(`  [${card.name}] ${card.skills[0]?.description?.substring(0, 80)}`);
      shown++;
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 Dry run - 変更は保存されません');
    return;
  }

  if (updated === 0) {
    console.log('\n✅ 全カードが最新です。保存をスキップします');
    return;
  }

  // 保存
  db.meta.last_updated = new Date().toISOString().split('T')[0];
  db.meta.skills_fetched_at = new Date().toISOString();

  const saveTargets = DB_PATHS.filter(p => {
    const dir = path.dirname(p);
    return fs.existsSync(dir);
  });

  console.log('\n💾 保存中...');
  for (const savePath of saveTargets) {
    fs.writeFileSync(savePath, JSON.stringify(db, null, 2), 'utf-8');
    const sizekb = Math.round(fs.statSync(savePath).size / 1024);
    console.log(`  → ${savePath}  (${sizekb}KB)`);
  }

  console.log(`\n✅ 完了! ${updated}枚のカードにスキルデータを追加しました`);
}

main();
