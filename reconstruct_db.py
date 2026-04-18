import json
import requests
import os
import datetime

# nanoka.cc のデータURL (6.5の最新版)
NANOKA_URL = "https://static.nanoka.cc/gi/6.5.51/gcg.json"
OUTPUT_DB = "deck-builder/src/data/cards_db.json"
# もしReact側に src/data フォルダがなければ作る必要があるが、すでに前のDBがある。
# 今回、Python実行場所が C:\Users\owner\Desktop\GenshinTCG であると仮定してパス指定。

# 翻訳辞書
TRANSLATIONS = {
    "Cryo": "氷",
    "Hydro": "水",
    "Pyro": "炎",
    "Electro": "雷",
    "Anemo": "風",
    "Geo": "岩",
    "Dendro": "草",
    "Sword": "片手剣",
    "Claymore": "両手剣",
    "Polearm": "長柄武器",
    "Bow": "弓",
    "Catalyst": "法器",
    "Other Weapons": "その他武器",
    "Mondstadt": "モンド",
    "Liyue": "璃月",
    "Inazuma": "稲妻",
    "Sumeru": "スメール",
    "Fontaine": "フォンテーヌ",
    "Natlan": "ナタ",
    "Snezhnaya": "スネージナヤ",
    "Fatui": "ファデュイ",
    "Monster": "魔物",
    "Hilichurl": "ヒルチャール",
    "The Eremites": "エルマイト旅団",
    "Consecrated Beast": "聖骸獣",
    "Cosmic Calamity": "星の天災", 
    "Nod-Krai": "ノドクライ",
    "Arkhe: Pneuma": "アルケー：プネウマ",
    "Arkhe: Ousia": "アルケー：ウーシア",
    "Talent": "天賦",
    "Combat Action": "戦闘行動",
    "Weapon": "武器",
    "Artifact": "聖遺物",
    "Event": "イベント",
    "Elemental Resonance": "元素共鳴",
    "Food": "料理",
    "Companion": "仲間",
    "Item": "アイテム",
    "Location": "拠点",
    "Arcane Legend": "秘伝",
}

def translate_tags(tag_list):
    return [TRANSLATIONS.get(tag, tag) for tag in tag_list]

def determine_type(card_info):
    if card_info.get("type") == "Character":
        return "character"
    
    tags = card_info.get("tag", [])
    if "Weapon" in tags:
        return "weapon"
    elif "Artifact" in tags:
        return "artifact"
    elif "Talent" in tags:
        return "talent"
    elif any(t in tags for t in ["Companion", "Location", "Item"]):
        return "support"
    else:
        return "event"

def determine_element(tags):
    elements = ["Cryo", "Hydro", "Pyro", "Electro", "Anemo", "Geo", "Dendro"]
    for e in elements:
        if e in tags:
            return TRANSLATIONS[e]
    return "無色"

def main():
    print(f"Fetching data from {NANOKA_URL}...")
    try:
        resp = requests.get(NANOKA_URL, timeout=10)
        resp.raise_for_status()
        raw_data = resp.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        # もしネットエラーなら、ここまでに保存されたcontentなどがあれば使うフォールバック
        return

    new_db = {
        "meta": {
            "version": "6.5",
            "last_updated": datetime.datetime.now().strftime("%Y-%m-%d"),
            "source": "https://gi.nanoka.cc/gcg/"
        },
        "cards": {}
    }

    print("Parsing and translating cards...")
    for card_id, card_data in raw_data.items():
        # 除外するカードがあればここで処理（例えば敵専用の特殊カードなど）
        # たくさんのデータがあるが、基本的に表示する。
        
        c_type = determine_type(card_data)
        tags = card_data.get("tag", [])
        trans_tags = translate_tags(tags)
        
        name = card_data.get("ja", card_data.get("en", f"Unknown_{card_id}"))
        # もし名前が #{REALNAME} などパースされてないものだったらスキップか置換
        if "#{REALNAME" in name:
            name = "放浪者" # Wanderer
        
        element = determine_element(tags)
        
        icon = card_data.get("icon", "")
        # 画像URL（WebP）
        img_url = f"https://static.nanoka.cc/assets/gi/{icon}.webp" if icon else ""

        new_card = {
            "id": card_id,
            "name": name,
            "type": c_type,
            "element": element,
            "tags": trans_tags,
            "hp": card_data.get("hp", 0),
            "cost": card_data.get("cost", 0), # Actionの場合dictだがとりあえず生データ
            "desc": card_data.get("desc", ""),
            "url": img_url,
            "icon_name": icon
        }
        
        new_db["cards"][card_id] = new_card

    new_db["meta"]["total_cards"] = len(new_db["cards"])
    
    # OUTPUT_DBまでのパスを確保
    os.makedirs(os.path.dirname(OUTPUT_DB), exist_ok=True)
    with open(OUTPUT_DB, "w", encoding="utf-8") as f:
        json.dump(new_db, f, ensure_ascii=False, indent=2)

    # 以前の cards_db.json も上書きしておく (ルートディレクトリにある場合)
    if os.path.exists("cards_db.json"):
        with open("cards_db.json", "w", encoding="utf-8") as f:
            json.dump(new_db, f, ensure_ascii=False, indent=2)

    print(f"Successfully rebuilt database with {len(new_db['cards'])} cards.")
    print(f"Saved to {OUTPUT_DB}")

if __name__ == "__main__":
    main()
