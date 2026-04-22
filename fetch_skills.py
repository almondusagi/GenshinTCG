"""
七聖召喚 スキルテキスト取得スクリプト
======================================
nanoka.cc の GCG JSONデータからスキル効果テキストを取得し、
cards_db.json の各カードに skills フィールドとして追記します。

使い方:
  python fetch_skills.py                    # 最新バージョンを自動検出・更新
  python fetch_skills.py --version 6.5      # バージョンを指定
  python fetch_skills.py --dry-run          # 変更を保存せずプレビュー
  python fetch_skills.py --out custom.json  # 出力先を変更

スキルデータの構造（cards_db.json への追加フィールド）:
  skills: [
    {
      "id":    "normal_attack",   # スキルID
      "name":  "通常攻撃",         # スキル名
      "desc":  "2ダメージを与える", # 効果テキスト
      "cost":  [...],              # コスト情報
      "type":  "normal"|"skill"|"burst"|"passive"|"special"
    },
    ...
  ]
"""

import json
import requests
import argparse
from pathlib import Path
from datetime import datetime

# ── 設定 ──────────────────────────────────────────────────────────────────────
DB_PATH  = Path("cards_db.json")
SRC_DB   = Path("src/data/cards_db.json")  # React側も同期更新する
BASE_URL = "https://static.nanoka.cc/gi/{version}/gcg.json"
LATEST_VERSIONS = ["6.5.51", "6.5.50", "6.5", "6.4.51", "6.4", "6.3"]

SKILL_TYPE_MAP = {
    "Normal":    "normal",
    "Skill":     "skill",
    "Burst":     "burst",
    "Passive":   "passive",
    "Special":   "special",
}

# コストタイプ翻訳
COST_TYPE_JP = {
    "GCG_COST_DICE_CRYO":    "氷",
    "GCG_COST_DICE_HYDRO":   "水",
    "GCG_COST_DICE_PYRO":    "炎",
    "GCG_COST_DICE_ELECTRO": "雷",
    "GCG_COST_DICE_ANEMO":   "風",
    "GCG_COST_DICE_GEO":     "岩",
    "GCG_COST_DICE_DENDRO":  "草",
    "GCG_COST_DICE_SAME":    "同一",
    "GCG_COST_DICE_VOID":    "無色",
    "GCG_COST_LEGEND":       "秘伝",
}


def fetch_raw(version: str) -> dict | None:
    """nanoka.cc から指定バージョンのGCGデータを取得"""
    url = BASE_URL.format(version=version)
    try:
        resp = requests.get(url, timeout=15,
                            headers={"User-Agent": "GenshinTCG-DB-Builder/1.0"})
        resp.raise_for_status()
        print(f"  ✅ 取得成功: {url}  ({len(resp.content)//1024}KB)")
        return resp.json()
    except requests.HTTPError as e:
        print(f"  ❌ HTTP {e.response.status_code}: {url}")
        return None
    except Exception as e:
        print(f"  ❌ エラー: {e}")
        return None


def auto_fetch(specified_version: str | None) -> tuple[dict | None, str]:
    """バージョンを自動試行して取得"""
    candidates = ([specified_version] if specified_version else []) + LATEST_VERSIONS
    for ver in candidates:
        print(f"→ バージョン {ver} を試みます...")
        data = fetch_raw(ver)
        if data is not None:
            return data, ver
    return None, ""


def extract_skills(raw_card: dict) -> list[dict]:
    """
    nanoka.cc のrawデータから skills フィールドを抽出する。
    rawデータのキー名は実際のAPIに合わせて調整済み。
    """
    skills = []

    # --- キャラクターカードのスキル ---
    for skill_raw in raw_card.get("skills", []):
        skill_id   = skill_raw.get("id", "")
        skill_name = skill_raw.get("ja", skill_raw.get("en", skill_id))
        skill_desc = skill_raw.get("desc", skill_raw.get("effect", ""))
        skill_type = SKILL_TYPE_MAP.get(skill_raw.get("type", ""), "special")
        cost_raw   = skill_raw.get("cost", [])

        skills.append({
            "id":   skill_id,
            "name": skill_name,
            "desc": _clean_desc(skill_desc),
            "cost": _parse_cost(cost_raw),
            "type": skill_type,
        })

    # --- アクションカード（descをそのままスキルとして扱う）---
    if not skills:
        effect = raw_card.get("effect", raw_card.get("effectText", ""))
        if effect:
            skills.append({
                "id":   "effect",
                "name": "効果",
                "desc": _clean_desc(effect),
                "cost": [],
                "type": "special",
            })

    return skills


def _clean_desc(text: str) -> str:
    """効果テキストのクリーンアップ"""
    if not text:
        return ""
    # テンプレート変数を除去
    text = text.replace("\\n", "\n").replace("\\\\n", "\n")
    return text.strip()


def _parse_cost(cost_raw) -> list[dict]:
    """コストデータを標準形式に変換"""
    if not cost_raw:
        return []
    if isinstance(cost_raw, int):
        return [{"cost_type": "GCG_COST_DICE_VOID", "count": cost_raw}]
    if isinstance(cost_raw, list):
        result = []
        for c in cost_raw:
            if isinstance(c, dict):
                result.append({
                    "cost_type": c.get("costType", c.get("cost_type", "GCG_COST_DICE_VOID")),
                    "count":     c.get("count", 1),
                })
        return result
    return []


def merge_skills(db_cards: dict, raw_data: dict) -> tuple[dict, int, int]:
    """
    rawデータのスキル情報を既存DBカードにマージする。
    Returns: (更新後カード辞書, 更新件数, 変更なし件数)
    """
    updated = 0
    unchanged = 0

    for card_id, raw_card in raw_data.items():
        if card_id not in db_cards:
            continue  # DBにないカードはスキップ（unknown/enemy-only等）

        db_card = db_cards[card_id]
        new_skills = extract_skills(raw_card)

        # effectフィールドがあれば優先してdescに追加
        effect = raw_card.get("effect", raw_card.get("effectText", ""))
        if effect and not new_skills:
            new_skills = [{"id": "effect", "name": "効果",
                           "desc": _clean_desc(effect), "cost": [], "type": "special"}]

        # 既存のskillsと比較
        existing = db_card.get("skills", [])
        if existing == new_skills:
            unchanged += 1
        else:
            db_card["skills"] = new_skills
            updated += 1

    return db_cards, updated, unchanged


def save_db(cards: dict, meta: dict, path: Path, version: str):
    meta["last_updated"] = datetime.now().strftime("%Y-%m-%d")
    meta["skills_version"] = version
    db = {"meta": meta, "cards": cards}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print(f"  💾 保存完了: {path}  ({path.stat().st_size // 1024}KB)")


def print_sample(db_cards: dict, n: int = 3):
    """スキル取得サンプルを表示"""
    shown = 0
    for card_id, card in db_cards.items():
        if card.get("skills") and shown < n:
            print(f"\n  📄 [{card_id}] {card['name']}")
            for sk in card["skills"]:
                print(f"      [{sk['type']}] {sk['name']}")
                if sk.get("desc"):
                    # 最大2行まで表示
                    lines = sk["desc"].splitlines()[:2]
                    for line in lines:
                        print(f"            {line[:70]}")
            shown += 1


def main():
    parser = argparse.ArgumentParser(description="七聖召喚スキルテキスト取得")
    parser.add_argument("--version", help="バージョン指定 (例: 6.5.51)")
    parser.add_argument("--dry-run", action="store_true", help="変更を保存しない")
    parser.add_argument("--out", help="出力先JSONパス (デフォルト: cards_db.json)")
    args = parser.parse_args()

    out_path = Path(args.out) if args.out else DB_PATH

    print("=" * 55)
    print("  七聖召喚 スキルテキスト取得ツール")
    print("=" * 55)

    # DB読み込み
    if not DB_PATH.exists():
        print(f"❌ {DB_PATH} が見つかりません")
        return

    with open(DB_PATH, encoding="utf-8") as f:
        db = json.load(f)

    cards = db.get("cards", {})
    meta  = db.get("meta", {})
    print(f"📊 現在のDB: {len(cards)}枚")

    # nanoka.cc からデータ取得
    print("\n🌐 nanoka.cc からスキルデータを取得中...")
    raw_data, used_version = auto_fetch(args.version)

    if raw_data is None:
        print("❌ データ取得に失敗しました。ネットワーク接続を確認してください")
        return

    print(f"\n⚙️  スキルデータをDBにマージ中... (バージョン: {used_version})")
    updated_cards, n_updated, n_unchanged = merge_skills(cards, raw_data)

    print(f"\n📊 結果:")
    print(f"   スキルを更新: {n_updated}枚")
    print(f"   変更なし:     {n_unchanged}枚")

    # サンプル表示
    print("\n🔍 スキルデータ サンプル:")
    print_sample(updated_cards)

    if args.dry_run:
        print("\n🔍 Dry run - 変更は保存されません")
        return

    if n_updated == 0:
        print("\n✅ 全カードが最新です。保存をスキップします")
        return

    # 保存
    print(f"\n💾 保存中...")
    save_db(updated_cards, meta, out_path, used_version)
    # src/data 側も同期
    if SRC_DB.exists() or SRC_DB.parent.exists():
        save_db(updated_cards, meta, SRC_DB, used_version)

    print(f"\n✅ 完了! {n_updated}枚のカードにスキルデータを追加しました")


if __name__ == "__main__":
    main()
