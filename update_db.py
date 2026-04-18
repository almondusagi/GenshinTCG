"""
七聖召喚カードDB アップデート管理スクリプト
- 既存DBと新DBを比較し、差分（追加・変更）のみを適用する
- 変更履歴（changelog）を自動記録する

使い方:
  python update_db.py --new new_cards.json          # 差分を計算して適用
  python update_db.py --patch patch.json            # パッチファイルを直接適用
  python update_db.py --show-changelog              # 変更履歴を表示
  python update_db.py --dry-run --new new_cards.json  # 変更内容をプレビュー
"""

import json
import argparse
import hashlib
from datetime import datetime
from pathlib import Path
from copy import deepcopy

DB_PATH = Path("cards_db.json")
CHANGELOG_PATH = Path("changelog.json")


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def compute_hash(card: dict) -> str:
    card_str = json.dumps({k: v for k, v in card.items() if k != "hash"}, sort_keys=True, ensure_ascii=False)
    return hashlib.md5(card_str.encode()).hexdigest()[:8]


def diff_databases(old_db: dict, new_cards: dict) -> dict:
    """
    旧DBと新カードデータを比較し、差分を返す
    Returns: {
        "added": [...],      # 新規追加カード
        "modified": [...],   # 変更のあったカード（before/after付き）
        "removed": [...],    # 削除されたカード
        "unchanged": int     # 変更なしのカード数
    }
    """
    old_cards = old_db.get("cards", {})
    diff = {"added": [], "modified": [], "removed": [], "unchanged": 0}

    # 追加・変更チェック
    for card_id, new_card in new_cards.items():
        new_hash = compute_hash(new_card)
        new_card_with_hash = {**new_card, "hash": new_hash}

        if card_id not in old_cards:
            diff["added"].append(new_card_with_hash)
        elif old_cards[card_id].get("hash") != new_hash:
            diff["modified"].append({
                "id": card_id,
                "before": old_cards[card_id],
                "after": new_card_with_hash,
                "changed_fields": [
                    k for k in new_card
                    if k != "hash" and new_card.get(k) != old_cards[card_id].get(k)
                ]
            })
        else:
            diff["unchanged"] += 1

    # 削除チェック
    for card_id in old_cards:
        if card_id not in new_cards:
            diff["removed"].append(old_cards[card_id])

    return diff


def apply_diff(old_db: dict, diff: dict, version: str, notes: str = "") -> dict:
    """差分を適用して新しいDBを返す"""
    new_db = deepcopy(old_db)
    cards = new_db.setdefault("cards", {})

    for card in diff["added"]:
        cards[card["id"]] = card

    for change in diff["modified"]:
        cards[change["id"]] = change["after"]

    for card in diff["removed"]:
        # 削除はソフトデリート（is_removedフラグ）
        if card["id"] in cards:
            cards[card["id"]]["is_removed"] = True
            cards[card["id"]]["removed_in"] = version

    # メタ情報更新
    active_cards = {k: v for k, v in cards.items() if not v.get("is_removed")}
    new_db["meta"]["version"] = version
    new_db["meta"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")
    new_db["meta"]["total_cards"] = len(active_cards)

    # 内訳更新
    breakdown = {}
    for card in active_cards.values():
        subtype = card.get("subtype") or card.get("type", "unknown")
        breakdown[subtype] = breakdown.get(subtype, 0) + 1
    new_db["meta"]["breakdown"] = breakdown

    return new_db


def record_changelog(diff: dict, version: str, notes: str = ""):
    """変更履歴を記録する"""
    changelog = load_json(CHANGELOG_PATH)
    if "entries" not in changelog:
        changelog["entries"] = []

    entry = {
        "version": version,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "notes": notes,
        "summary": {
            "added": len(diff["added"]),
            "modified": len(diff["modified"]),
            "removed": len(diff["removed"]),
            "unchanged": diff["unchanged"],
        },
        "details": {
            "added": [{"id": c["id"], "name": c["name"]} for c in diff["added"]],
            "modified": [
                {
                    "id": c["id"],
                    "name": c["after"]["name"],
                    "changed_fields": c["changed_fields"]
                }
                for c in diff["modified"]
            ],
            "removed": [{"id": c["id"], "name": c["name"]} for c in diff["removed"]],
        }
    }

    changelog["entries"].insert(0, entry)  # 最新が先頭
    save_json(CHANGELOG_PATH, changelog)
    return entry


def print_diff_summary(diff: dict):
    print(f"\n{'='*50}")
    print(f"📊 差分サマリー")
    print(f"{'='*50}")
    print(f"  ✨ 新規追加: {len(diff['added'])}枚")
    for c in diff["added"]:
        print(f"     + {c['name']} ({c.get('element', '')} {c.get('type', '')})")
    print(f"  ✏️  変更あり: {len(diff['modified'])}枚")
    for c in diff["modified"]:
        print(f"     ~ {c['after']['name']} [{', '.join(c['changed_fields'])}]")
    print(f"  🗑️  削除(無効化): {len(diff['removed'])}枚")
    for c in diff["removed"]:
        print(f"     - {c['name']}")
    print(f"  ✅ 変更なし: {diff['unchanged']}枚")
    print(f"{'='*50}\n")


def cmd_update(args):
    old_db = load_json(DB_PATH)
    new_data = load_json(Path(args.new))

    # 新データがcardsキーを持つ場合とリスト形式の両対応
    if "cards" in new_data:
        new_cards = new_data["cards"]
    elif isinstance(new_data, list):
        new_cards = {c["id"]: c for c in new_data}
    else:
        new_cards = new_data

    diff = diff_databases(old_db, new_cards)
    print_diff_summary(diff)

    if args.dry_run:
        print("🔍 Dry run - 変更は保存されません")
        return

    if len(diff["added"]) + len(diff["modified"]) + len(diff["removed"]) == 0:
        print("変更なし - DBは最新です")
        return

    version = args.version or input("バージョンを入力 (例: 5.7): ").strip()
    notes = args.notes or ""

    new_db = apply_diff(old_db, diff, version, notes)
    save_json(DB_PATH, new_db)

    entry = record_changelog(diff, version, notes)
    print(f"✅ DBを更新しました (Ver.{version})")
    print(f"   追加: {entry['summary']['added']}, 変更: {entry['summary']['modified']}, 削除: {entry['summary']['removed']}")


def cmd_show_changelog(args):
    changelog = load_json(CHANGELOG_PATH)
    entries = changelog.get("entries", [])
    if not entries:
        print("変更履歴なし")
        return
    limit = args.limit if hasattr(args, "limit") else 10
    for entry in entries[:limit]:
        print(f"\n[Ver.{entry['version']}] {entry['date']}")
        if entry.get("notes"):
            print(f"  メモ: {entry['notes']}")
        s = entry["summary"]
        print(f"  追加:{s['added']} 変更:{s['modified']} 削除:{s['removed']} 変更なし:{s['unchanged']}")
        if entry["details"]["added"]:
            print(f"  追加: {[c['name'] for c in entry['details']['added']]}")
        if entry["details"]["modified"]:
            print(f"  変更: {[c['name'] for c in entry['details']['modified']]}")


def cmd_validate(args):
    """DBの整合性チェック"""
    db = load_json(DB_PATH)
    cards = db.get("cards", {})
    errors = []

    required_fields = {"id", "name", "type"}
    for card_id, card in cards.items():
        if card.get("is_removed"):
            continue
        missing = required_fields - set(card.keys())
        if missing:
            errors.append(f"  {card_id}: 必須フィールド不足 {missing}")
        if card_id != card.get("id"):
            errors.append(f"  {card_id}: IDキーとcard.idが不一致")

    if errors:
        print(f"❌ バリデーションエラー ({len(errors)}件):")
        for e in errors:
            print(e)
    else:
        print(f"✅ バリデーション通過 ({len(cards)}枚)")


def main():
    parser = argparse.ArgumentParser(description="七聖召喚カードDB アップデートツール")
    sub = parser.add_subparsers(dest="cmd")

    # update
    p_update = sub.add_parser("update", help="新データで差分更新")
    p_update.add_argument("--new", required=True, help="新カードJSONファイル")
    p_update.add_argument("--version", help="バージョン番号")
    p_update.add_argument("--notes", default="", help="変更メモ")
    p_update.add_argument("--dry-run", action="store_true", help="変更をプレビューのみ")

    # changelog
    p_log = sub.add_parser("changelog", help="変更履歴表示")
    p_log.add_argument("--limit", type=int, default=10, help="表示件数")

    # validate
    sub.add_parser("validate", help="DBの整合性チェック")

    args = parser.parse_args()
    if args.cmd == "update":
        cmd_update(args)
    elif args.cmd == "changelog":
        cmd_show_changelog(args)
    elif args.cmd == "validate":
        cmd_validate(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
