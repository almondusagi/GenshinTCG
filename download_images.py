import json
import os
import time
import requests
from bs4 import BeautifulSoup

# 設定
DB_PATH = "cards_db.json"
SAVE_DIR = "deck-builder/public/images/cards"

# フォルダ作成
os.makedirs(SAVE_DIR, exist_ok=True)

# データベース読み込み
with open(DB_PATH, "r", encoding="utf-8") as f:
    db = json.load(f)

cards = db.get("cards", {})

print(f"全 {len(cards)} 枚のカード画像をチェックします...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

downloaded = 0
failed = 0

for card_id, card_info in cards.items():
    page_url = card_info.get("url")
    save_path = os.path.join(SAVE_DIR, f"{card_id}.png")
    
    # 既にダウンロード済み、またはURLがない場合はスキップ
    if not page_url:
        continue
    if os.path.exists(save_path):
        print(f"Skipped {card_id} (Already exists)")
        continue
        
    try:
        # ページにアクセス
        response = requests.get(page_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # ページのOGP画像（SNS共有用などの代表画像）をカード画像として拾う
        og_image = soup.find('meta', property='og:image')
        img_url = None
        
        if og_image and og_image.get('content'):
            img_url = og_image['content']
            
        if not img_url:
            print(f"Failed to find image for {card_id}")
            failed += 1
            continue
            
        # 画像をダウンロード
        img_response = requests.get(img_url, headers=headers, timeout=10)
        img_response.raise_for_status()
        
        with open(save_path, "wb") as f:
            f.write(img_response.content)
            
        print(f"Success: {card_id}")
        downloaded += 1
        
    except Exception as e:
        print(f"Error on {card_id} : {e}")
        failed += 1
        
    # サイトへの負荷を下げるために1件ごとに1秒待機（必須）
    time.sleep(1)

print("\n--- ダウンロード完了 ---")
print(f"新しく取得完了: {downloaded} 件")
print(f"取得失敗: {failed} 件")
print(f"保存先: {SAVE_DIR}")
