import json
import os
import time
import requests

DB_PATH = "deck-builder/src/data/cards_db.json"
SAVE_DIR = "deck-builder/public/images/cards"

os.makedirs(SAVE_DIR, exist_ok=True)

with open(DB_PATH, "r", encoding="utf-8") as f:
    db = json.load(f)

cards = db.get("cards", {})

print(f"全 {len(cards)} 枚のカード画像のダウンロード(WebP)をチェックします...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

downloaded = 0
failed = 0

for card_id, card_info in cards.items():
    img_url = card_info.get("url")
    save_path = os.path.join(SAVE_DIR, f"{card_id}.webp")
    
    if not img_url:
        continue
    if os.path.exists(save_path):
        # すでにあるならスキップ
        continue
        
    try:
        response = requests.get(img_url, headers=headers, timeout=10)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            print(f"Success: {card_id} ({card_info.get('name')})")
            downloaded += 1
            # サーバー負荷低減のための待機
            time.sleep(0.5)
        else:
            print(f"Failed to download image for {card_id}: {response.status_code}")
            failed += 1
            
    except Exception as e:
        print(f"Error on {card_id} : {e}")
        failed += 1

print("\n--- 最新画像のダウンロード完了 ---")
print(f"新しく取得完了: {downloaded} 件")
print(f"取得失敗: {failed} 件")
print(f"保存先: {SAVE_DIR}")
