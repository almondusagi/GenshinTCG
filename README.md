# 七聖召喚カードデータベース

神ゲー攻略（kamigame.jp）から収集した七聖召喚のカードデータベースです。

## ファイル構成

```
cards_db.json       - メインDBファイル（全カード情報）
changelog.json      - 更新履歴
build_db.py         - 初期DB構築スクリプト
update_db.py        - アップデート管理ツール
```

## カード数（Ver.5.6 時点）

| カテゴリ        | 枚数 |
|---------------|------|
| キャラカード    | 72枚 |
| 武器カード      | 16枚 |
| 聖遺物カード    | 16枚 |
| 天賦カード      | 35枚 |
| 支援カード      | 17枚 |
| イベントカード  | 19枚 |
| **合計**       | **175枚** |

## DB構造

### cards_db.json
```json
{
  "meta": {
    "version": "5.6",
    "last_updated": "2026-04-16",
    "source": "https://kamigame.jp/...",
    "total_cards": 175,
    "breakdown": { ... }
  },
  "cards": {
    "char_diluc": {
      "id": "char_diluc",
      "name": "ディルック",
      "type": "character",
      "element": "炎",
      "weapon": "両手剣",
      "faction": "モンド",
      "rating": "SS",
      "obtain": ["世界任務"],
      "url": "https://kamigame.jp/...",
      "hash": "abc12345"
    },
    ...
  }
}
```

### キャラカードのフィールド
| フィールド  | 説明                      |
|-----------|--------------------------|
| id        | 一意のID（英数字+アンダースコア）|
| name      | カード名（日本語）           |
| type      | "character"              |
| element   | 氷/水/炎/雷/風/岩/草         |
| weapon    | 片手剣/両手剣/法器/弓/長柄武器/その他 |
| faction   | 所属（モンド/璃月/稲妻/スメール等） |
| rating    | SS/S/A/B/C               |
| obtain    | 入手方法リスト              |
| url       | 神ゲー攻略のURL             |
| hash      | 変更検知用ハッシュ           |

### アクションカード（装備/支援/イベント）のフィールド
| フィールド       | 説明                      |
|----------------|--------------------------|
| id             | 一意のID                  |
| name           | カード名                  |
| type           | equipment/support/event  |
| subtype        | weapon/artifact/talent/companion/location/food/resonance/general |
| cost           | コスト数値                |
| cost_type      | 同一元素/無色元素/氷元素等  |
| effect_summary | 効果テキスト               |
| rating         | 評価                      |
| obtain         | 入手方法リスト              |
| hash           | 変更検知用ハッシュ           |

## アップデート手順

### アプデ時のカード追加・変更

1. **新カードデータを準備** (`new_cards.json`)

```json
{
  "char_new_char": {
    "id": "char_new_char",
    "name": "新キャラ名",
    "type": "character",
    "element": "炎",
    "weapon": "片手剣",
    "faction": "ナタ",
    "rating": "S",
    "obtain": ["友好対戦"]
  }
}
```

2. **差分プレビュー（dry-run）**

```bash
python update_db.py update --new new_cards.json --dry-run
```

3. **実際に更新**

```bash
python update_db.py update --new new_cards.json --version 5.7 --notes "マーヴィカ・シトラリ追加"
```

4. **変更履歴を確認**

```bash
python update_db.py changelog
```

5. **整合性チェック**

```bash
python update_db.py validate
```

### 元素調整（既存カードの評価変更など）

```json
// patch.json - 変更するカードのみ記述
{
  "char_diluc": {
    "id": "char_diluc",
    "name": "ディルック",
    "type": "character",
    "element": "炎",
    "weapon": "両手剣",
    "faction": "モンド",
    "rating": "S",   // SS → S に変更
    "obtain": ["世界任務"]
  }
}
```

```bash
python update_db.py update --new patch.json --version 5.6.1 --notes "ディルック評価下方修正"
```

## 評価基準
- **SS**: 環境最強。必須級
- **S**: 非常に強力。多くのデッキで採用
- **A**: 強力。特定デッキで活躍
- **B**: 普通。デッキによっては採用
- **C**: やや弱め。特殊戦略向け
