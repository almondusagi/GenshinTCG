import requests, json, sys
sys.stdout.reconfigure(encoding='utf-8')

r = requests.get('https://static.nanoka.cc/gi/6.5.51/gcg.json', timeout=15)
data = r.json()

# titleがどんな値か確認
print('=== title フィールド確認 ===')
for cid in ['1101', '211011', '322241', '330003']:
    if cid in data:
        c = data[cid]
        print(f"ID={cid} name={c.get('ja',c.get('en'))} title={c.get('title')} en={c.get('en','')[:100]}")

# nanoka の別エンドポイント試し
print()
print('=== nanoka 他の可能性あるエンドポイント ===')
endpoints = [
    'https://static.nanoka.cc/gi/6.5.51/gcg-skills.json',
    'https://static.nanoka.cc/gi/6.5/gcg-skills.json',
    'https://gi.nanoka.cc/api/gcg/cards',
    'https://gi.nanoka.cc/api/gcg',
]
for ep in endpoints:
    try:
        resp = requests.get(ep, timeout=5)
        print(f"  {ep}: {resp.status_code} {resp.headers.get('content-type','')}")
        if resp.status_code == 200:
            try:
                d = resp.json()
                print(f"    -> type={type(d).__name__} keys={list(d.keys())[:5] if isinstance(d,dict) else 'list'}")
            except:
                print(f"    -> not JSON ({len(resp.content)} bytes)")
    except Exception as e:
        print(f"  {ep}: ERROR {e}")

# 特定カードの詳細も確認
print()
print('=== アクションカード 詳細確認 ===')
# 非天賦カード探す
for cid, c in list(data.items())[:50]:
    if c.get('type') == 'Action' and 'Talent' not in c.get('tag',[]):
        print(f"ID={cid} tag={c.get('tag')} ja={c.get('ja','')[:50]}")
        print(f"  en={c.get('en','')[:200]}")
        print(f"  title keys: {list(c.get('title',{}).keys()) if isinstance(c.get('title'),dict) else c.get('title')}")
        break
