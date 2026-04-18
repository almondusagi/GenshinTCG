import json
import os

db_path = "cards_db.json"

with open(db_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for card_id, card_data in data["cards"].items():
    if "rating" in card_data:
        del card_data["rating"]

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("rating data successfully removed.")
