"""
七聖召喚カードデータベースビルダー
神ゲー攻略からカード情報を収集し、JSON DBを構築する
アップデート時は差分のみ更新する仕組み付き
"""

import json
import hashlib
from datetime import datetime

# ==================== キャラカード ====================
CHARACTER_CARDS = [
    # 氷元素
    {"id": "char_ganyu",       "name": "甘雨",               "type": "character", "element": "氷", "weapon": "弓",      "faction": "璃月",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841148586759.html"},
    {"id": "char_diona",       "name": "ディオナ",           "type": "character", "element": "氷", "weapon": "弓",      "faction": "モンド",             "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840544625683.html"},
    {"id": "char_kaeya",       "name": "ガイア",             "type": "character", "element": "氷", "weapon": "片手剣",  "faction": "モンド",             "rating": "A",  "obtain": ["世界任務"],     "url": "https://kamigame.jp/genshin/page/240508840410407955.html"},
    {"id": "char_chongyun",    "name": "重雲",               "type": "character", "element": "氷", "weapon": "両手剣",  "faction": "璃月",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841484151539.html"},
    {"id": "char_ayaka",       "name": "神里綾華",           "type": "character", "element": "氷", "weapon": "片手剣",  "faction": "稲妻",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841584814835.html"},
    {"id": "char_eula",        "name": "エウルア",           "type": "character", "element": "氷", "weapon": "両手剣",  "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/251949352229049264.html"},
    {"id": "char_shenhe",      "name": "申鶴",               "type": "character", "element": "氷", "weapon": "長柄武器","faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677794101560.html"},
    {"id": "char_qiqi",        "name": "七七",               "type": "character", "element": "氷", "weapon": "片手剣",  "faction": "璃月",               "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/278779412722278360.html"},
    {"id": "char_layla",       "name": "レイラ",             "type": "character", "element": "氷", "weapon": "片手剣",  "faction": "スメール",           "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339761256182.html"},
    {"id": "char_mirrormaiden","name": "ファデュイ・ミラーメイデン", "type": "character", "element": "氷", "weapon": "その他", "faction": "ファデュイ",  "rating": "A",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/240508840863374087.html"},
    {"id": "char_cryo_hypo",   "name": "ファデュイ・氷蛍術師","type": "character", "element": "氷", "weapon": "その他", "faction": "ファデュイ",          "rating": "S",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/264139677693438264.html"},
    {"id": "char_lady",        "name": "淑女",               "type": "character", "element": "氷", "weapon": "その他",  "faction": "ファデュイ",          "rating": "A",  "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/296481339912251126.html"},

    # 水元素
    {"id": "char_barbara",     "name": "バーバラ",           "type": "character", "element": "水", "weapon": "法器",    "faction": "モンド",             "rating": "C",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840645288979.html"},
    {"id": "char_xingqiu",     "name": "行秋",               "type": "character", "element": "水", "weapon": "片手剣",  "faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841282804487.html"},
    {"id": "char_mona",        "name": "モナ",               "type": "character", "element": "水", "weapon": "法器",    "faction": "モンド",             "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841031146247.html"},
    {"id": "char_kokomi",      "name": "珊瑚宮心海",         "type": "character", "element": "水", "weapon": "法器",    "faction": "稲妻",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/251982088838850141.html"},
    {"id": "char_ayato",       "name": "神里綾人",           "type": "character", "element": "水", "weapon": "片手剣",  "faction": "稲妻",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/258065664579765239.html"},
    {"id": "char_tartaglia",   "name": "タルタリヤ",         "type": "character", "element": "水", "weapon": "弓",      "faction": "璃月",               "rating": "SS", "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677575997752.html"},
    {"id": "char_candace",     "name": "キャンディス",       "type": "character", "element": "水", "weapon": "長柄武器","faction": "スメール",           "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/270220713414138767.html"},
    {"id": "char_yaoyao",      "name": "ヨォーヨ",           "type": "character", "element": "水", "weapon": "長柄武器","faction": "璃月",               "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/282995700210394805.html"},
    {"id": "char_nilou",       "name": "ニィロウ",           "type": "character", "element": "水", "weapon": "片手剣",  "faction": "スメール",           "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/290196763543919095.html"},
    {"id": "char_yelan",       "name": "イェラン",           "type": "character", "element": "水", "weapon": "弓",      "faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339224385270.html"},
    {"id": "char_rhodeia",     "name": "純水精霊・ローデシア","type": "character", "element": "水", "weapon": "その他",  "faction": "魔物",               "rating": "A",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/240508841517705971.html"},

    # 炎元素
    {"id": "char_diluc",       "name": "ディルック",         "type": "character", "element": "炎", "weapon": "両手剣",  "faction": "モンド",             "rating": "SS", "obtain": ["世界任務"],     "url": "https://kamigame.jp/genshin/page/240508840578180115.html"},
    {"id": "char_xiangling",   "name": "香菱",               "type": "character", "element": "炎", "weapon": "長柄武器","faction": "璃月",               "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841333136135.html"},
    {"id": "char_bennett",     "name": "ベネット",           "type": "character", "element": "炎", "weapon": "片手剣",  "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840964037383.html"},
    {"id": "char_yoimiya",     "name": "宵宮",               "type": "character", "element": "炎", "weapon": "弓",      "faction": "稲妻",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841551260403.html"},
    {"id": "char_klee",        "name": "クレー",             "type": "character", "element": "炎", "weapon": "法器",    "faction": "モンド",             "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/245856982945259823.html"},
    {"id": "char_hutao",       "name": "胡桃",               "type": "character", "element": "炎", "weapon": "長柄武器","faction": "璃月",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677827655992.html"},
    {"id": "char_amber",       "name": "アンバー",           "type": "character", "element": "炎", "weapon": "弓",      "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677508888888.html"},
    {"id": "char_yanfei",      "name": "煙緋",               "type": "character", "element": "炎", "weapon": "法器",    "faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/270220713481247631.html"},
    {"id": "char_thoma",       "name": "トーマ",             "type": "character", "element": "炎", "weapon": "長柄武器","faction": "稲妻",               "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/304571540144424150.html"},
    {"id": "char_dehya",       "name": "ディシア",           "type": "character", "element": "炎", "weapon": "両手剣",  "faction": "スメール/エルマイト旅団","rating": "A","obtain": ["友好対戦"],    "url": "https://kamigame.jp/genshin/page/282994913711285941.html"},
    {"id": "char_lyney",       "name": "リネ",               "type": "character", "element": "炎", "weapon": "弓",      "faction": "フォンテーヌ",       "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339643815670.html"},
    {"id": "char_pyro_agent",  "name": "ファデュイ・デットエージェント・炎","type":"character","element":"炎","weapon":"その他","faction":"ファデュイ","rating":"S","obtain":["酒場挑戦"],"url":"https://kamigame.jp/genshin/page/240508840745952275.html"},
    {"id": "char_wooden_sword","name": "魔偶剣鬼",           "type": "character", "element": "炎", "weapon": "その他",  "faction": "魔物",               "rating": "S",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/240508841618369267.html"},
    {"id": "char_abyss_herald","name": "アビスの詠唱者・淵炎","type":"character","element":"炎","weapon":"その他","faction":"魔物","rating":"SS","obtain":["酒場挑戦"],"url":"https://kamigame.jp/genshin/page/264139677475334456.html"},
    {"id": "char_sandmaster",  "name": "エルマイト旅団・サンドロアマスター","type":"character","element":"炎","weapon":"その他","faction":"エルマイト旅団","rating":"B","obtain":["酒場挑戦目標"],"url":"https://kamigame.jp/genshin/page/296481339291494134.html"},

    # 雷元素
    {"id": "char_fischl",      "name": "フィッシュル",       "type": "character", "element": "雷", "weapon": "弓",      "faction": "モンド",             "rating": "A",  "obtain": ["世界任務"],     "url": "https://kamigame.jp/genshin/page/240508840896928519.html"},
    {"id": "char_razor",       "name": "レザー",             "type": "character", "element": "雷", "weapon": "両手剣",  "faction": "モンド",             "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841064700679.html"},
    {"id": "char_keqing",      "name": "刻晴",               "type": "character", "element": "雷", "weapon": "片手剣",  "faction": "璃月",               "rating": "SS", "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841450597107.html"},
    {"id": "char_cyno",        "name": "セノ",               "type": "character", "element": "雷", "weapon": "長柄武器","faction": "スメール",           "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240241570148823675.html"},
    {"id": "char_beidou",      "name": "北斗",               "type": "character", "element": "雷", "weapon": "両手剣",  "faction": "璃月",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/245856982995591471.html"},
    {"id": "char_sara",        "name": "九条裟羅",           "type": "character", "element": "雷", "weapon": "弓",      "faction": "稲妻",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/251978243333186032.html"},
    {"id": "char_raiden",      "name": "雷電将軍",           "type": "character", "element": "雷", "weapon": "長柄武器","faction": "稲妻",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677945081552.html"},
    {"id": "char_yae",         "name": "八重神子",           "type": "character", "element": "雷", "weapon": "法器",    "faction": "稲妻",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677726992696.html"},
    {"id": "char_lisa",        "name": "リサ",               "type": "character", "element": "雷", "weapon": "法器",    "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/278779198024212190.html"},
    {"id": "char_dori",        "name": "ドリー",             "type": "character", "element": "雷", "weapon": "両手剣",  "faction": "スメール",           "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/290196915696470810.html"},
    {"id": "char_electro_hypo","name": "無相の雷",           "type": "character", "element": "雷", "weapon": "その他",  "faction": "魔物",               "rating": "S",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/264139677760547128.html"},
    {"id": "char_raijin",      "name": "雷音権現",           "type": "character", "element": "雷", "weapon": "その他",  "faction": "魔物",               "rating": "S",  "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/296481340063255847.html"},

    # 風元素
    {"id": "char_sucrose",     "name": "スクロース",         "type": "character", "element": "風", "weapon": "法器",    "faction": "モンド",             "rating": "B",  "obtain": ["世界任務"],     "url": "https://kamigame.jp/genshin/page/240508840511071251.html"},
    {"id": "char_jean",        "name": "ジン",               "type": "character", "element": "風", "weapon": "片手剣",  "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840477516819.html"},
    {"id": "char_venti",       "name": "ウェンティ",         "type": "character", "element": "風", "weapon": "弓",      "faction": "モンド",             "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677542443320.html"},
    {"id": "char_xiao",        "name": "魈",                 "type": "character", "element": "風", "weapon": "長柄武器","faction": "璃月",               "rating": "SS", "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677978635984.html"},
    {"id": "char_kazuha",      "name": "楓原万葉",           "type": "character", "element": "風", "weapon": "片手剣",  "faction": "璃月",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/270220713447693199.html"},
    {"id": "char_gorou",       "name": "ゴロー",             "type": "character", "element": "風", "weapon": "弓",      "faction": "稲妻",               "rating": "C",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339408934646.html"},
    {"id": "char_lynette",     "name": "リネット",           "type": "character", "element": "風", "weapon": "片手剣",  "faction": "フォンテーヌ",       "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339677370102.html"},
    {"id": "char_wanderer",    "name": "放浪者",             "type": "character", "element": "風", "weapon": "法器",    "faction": "無し",               "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/282995336027352635.html"},
    {"id": "char_dvalin",      "name": "トワリン",           "type": "character", "element": "風", "weapon": "その他",  "faction": "魔物",               "rating": "SS", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/296481339593484022.html"},

    # 岩元素
    {"id": "char_ningguang",   "name": "凝光",               "type": "character", "element": "岩", "weapon": "法器",    "faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508841182141191.html"},
    {"id": "char_noelle",      "name": "ノエル",             "type": "character", "element": "岩", "weapon": "両手剣",  "faction": "モンド",             "rating": "SS", "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840611734547.html"},
    {"id": "char_itto",        "name": "荒瀧一斗",           "type": "character", "element": "岩", "weapon": "両手剣",  "faction": "稲妻",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/258065664613319671.html"},
    {"id": "char_zhongli",     "name": "鍾離",               "type": "character", "element": "岩", "weapon": "長柄武器","faction": "璃月",               "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677911527120.html"},
    {"id": "char_albedo",      "name": "アルベド",           "type": "character", "element": "岩", "weapon": "片手剣",  "faction": "モンド",             "rating": "B",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/278779302881816541.html"},
    {"id": "char_hilichurl_king","name": "ヒルチャール・岩兜の王","type":"character","element":"岩","weapon":"その他","faction":"魔物","rating":"A","obtain":["酒場挑戦"],"url":"https://kamigame.jp/genshin/page/240508840712397843.html"},
    {"id": "char_primo_geovish","name": "若陀龍王",           "type": "character", "element": "岩", "weapon": "その他",  "faction": "魔物",               "rating": "A",  "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/296481339811587830.html"},

    # 草元素
    {"id": "char_collei",      "name": "コレイ",             "type": "character", "element": "草", "weapon": "弓",      "faction": "スメール",           "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/240508840443962387.html"},
    {"id": "char_tighnari",    "name": "ティナリ",           "type": "character", "element": "草", "weapon": "弓",      "faction": "スメール",           "rating": "S",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/258065664546210807.html"},
    {"id": "char_nahida",      "name": "ナヒーダ",           "type": "character", "element": "草", "weapon": "法器",    "faction": "スメール",           "rating": "A",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/264139677609552184.html"},
    {"id": "char_alhaitham",   "name": "アルハイゼン",       "type": "character", "element": "草", "weapon": "片手剣",  "faction": "スメール",           "rating": "SS", "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/296481339174053622.html"},
    {"id": "char_baizhu",      "name": "白朮",               "type": "character", "element": "草", "weapon": "法器",    "faction": "璃月",               "rating": "C",  "obtain": ["友好対戦"],     "url": "https://kamigame.jp/genshin/page/290197024194732350.html"},
    {"id": "char_mushroom_raptor","name": "マッシュラプトル", "type": "character", "element": "草", "weapon": "その他",  "faction": "魔物",               "rating": "S",  "obtain": ["酒場挑戦"],     "url": "https://kamigame.jp/genshin/page/240508840997591815.html"},
]

# ==================== 装備カード（武器） ====================
WEAPON_CARDS = [
    # 法器
    {"id": "equip_magic_guide",     "name": "魔導緒論",       "type": "equipment", "subtype": "weapon", "weapon_type": "法器",    "cost": 3, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508549560578367.html"},
    {"id": "equip_sacrificial_frags","name": "祭礼の断片",    "type": "equipment", "subtype": "weapon", "weapon_type": "法器",    "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508553436134296.html"},
    {"id": "equip_skyward_atlas",    "name": "天空の巻",       "type": "equipment", "subtype": "weapon", "weapon_type": "法器",    "cost": 3, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508550332330303.html"},
    # 弓
    {"id": "equip_raven_bow",        "name": "鴉羽の弓",       "type": "equipment", "subtype": "weapon", "weapon_type": "弓",      "cost": 3, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508551708062015.html"},
    {"id": "equip_sacrificial_bow",  "name": "祭礼の弓",       "type": "equipment", "subtype": "weapon", "weapon_type": "弓",      "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508550080672063.html"},
    {"id": "equip_skyward_harp",     "name": "天空の翼",       "type": "equipment", "subtype": "weapon", "weapon_type": "弓",      "cost": 3, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508553620683672.html"},
    # 両手剣
    {"id": "equip_white_iron",       "name": "白鉄の大剣",     "type": "equipment", "subtype": "weapon", "weapon_type": "両手剣",  "cost": 3, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508552261729176.html"},
    {"id": "equip_sacrificial_gs",   "name": "祭礼の大剣",     "type": "equipment", "subtype": "weapon", "weapon_type": "両手剣",  "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508549661241663.html"},
    {"id": "equip_wolves_gravestone", "name": "狼の末路",       "type": "equipment", "subtype": "weapon", "weapon_type": "両手剣",  "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508551322187664.html"},
    # 長柄武器
    {"id": "equip_white_tassel",     "name": "白纓槍",         "type": "equipment", "subtype": "weapon", "weapon_type": "長柄武器","cost": 3, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508552328838040.html"},
    {"id": "equip_lithic_spear",     "name": "千岩長槍",       "type": "equipment", "subtype": "weapon", "weapon_type": "長柄武器","cost": 3, "cost_type": "同一元素", "rating": "C",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508549728350527.html"},
    {"id": "equip_skyward_spine",    "name": "天空の脊",       "type": "equipment", "subtype": "weapon", "weapon_type": "長柄武器","cost": 3, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508553167671299.html"},
    # 片手剣
    {"id": "equip_travelers_sword",  "name": "旅道の剣",       "type": "equipment", "subtype": "weapon", "weapon_type": "片手剣",  "cost": 3, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508552479832984.html"},
    {"id": "equip_sacrificial_sword","name": "祭礼の剣",       "type": "equipment", "subtype": "weapon", "weapon_type": "片手剣",  "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508554174307079.html"},
    {"id": "equip_favonius_sword",   "name": "西風剣",         "type": "equipment", "subtype": "weapon", "weapon_type": "片手剣",  "cost": 3, "cost_type": "同一元素", "rating": "S",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/258065739741693007.html"},
    {"id": "equip_aquila_favonia",   "name": "風鷹剣",         "type": "equipment", "subtype": "weapon", "weapon_type": "片手剣",  "cost": 3, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508552513387416.html"},
]

# ==================== 装備カード（聖遺物） ====================
ARTIFACT_CARDS = [
    {"id": "equip_bandana",      "name": "冒険者のバンダナ",     "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508551389296528.html"},
    {"id": "equip_lucky_crown",  "name": "幸運の冠",             "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508551959720255.html"},
    {"id": "equip_doctors",      "name": "医者の方巾",           "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "C",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508554140752647.html"},
    {"id": "equip_gamblers_earring","name": "博徒のピアス",      "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "SS", "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508547681520584.html"},
    {"id": "equip_instructors",  "name": "教官の帽子",           "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "SS", "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508550231667007.html"},
    {"id": "equip_exiles",       "name": "亡命者の冠",           "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508554006534919.html"},
    {"id": "equip_blizzard_flower","name": "氷雪を踏む音",       "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508550818887159.html"},
    {"id": "equip_blizzard_strayer","name": "氷風を彷徨う勇士",  "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508548386175153.html"},
    {"id": "equip_winesop_hat",  "name": "酒に漬けた帽子",       "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508549124372657.html"},
    {"id": "equip_heart_of_depth","name": "沈淪の心",            "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508553201225731.html"},
    {"id": "equip_witch_hat",    "name": "焦げた魔女の帽子",     "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508551741616447.html"},
    {"id": "equip_crimson_witch","name": "燃え盛る炎の魔女",     "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508552295283608.html"},
    {"id": "equip_thunder_crown","name": "雷を呼ぶ冠",           "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508549694796095.html"},
    {"id": "equip_thunder_furor","name": "雷のような怒り",       "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508554258193159.html"},
    {"id": "equip_viridescent_hunt","name": "緑の狩人の冠",      "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "B",  "obtain": ["世界任務", "カードショップ"], "url": "https://kamigame.jp/genshin/page/240508553972980487.html"},
    {"id": "equip_viridescent_venerer","name": "翠緑の影",       "type": "equipment", "subtype": "artifact", "cost": 2, "cost_type": "同一元素", "rating": "A",  "obtain": ["カードショップ"],             "url": "https://kamigame.jp/genshin/page/240508551859056959.html"},
]

# ==================== 天賦カード（キャラ固有） ====================
TALENT_CARDS = [
    {"id": "talent_ganyu",        "name": "冷血の剣",         "type": "equipment", "subtype": "talent", "for_character": "甘雨",       "cost": 3, "cost_type": "氷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508550885996023.html"},
    {"id": "talent_chongyun",     "name": "唯一の心",         "type": "equipment", "subtype": "talent", "for_character": "重雲",       "cost": 3, "cost_type": "氷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508551204747152.html"},
    {"id": "talent_diona",        "name": "クールキャッツクロー", "type": "equipment", "subtype": "talent", "for_character": "ディオナ",  "cost": 3, "cost_type": "氷元素", "rating": "B", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508553134116867.html"},
    {"id": "talent_ayaka",        "name": "寒空の宣命祝詞",   "type": "equipment", "subtype": "talent", "for_character": "神里綾華",   "cost": 3, "cost_type": "氷元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508550651114999.html"},
    {"id": "talent_barbara",      "name": "輝く季節",         "type": "equipment", "subtype": "talent", "for_character": "バーバラ",   "cost": 3, "cost_type": "水元素", "rating": "C", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508548990154929.html"},
    {"id": "talent_xingqiu",      "name": "すだれの残香",     "type": "equipment", "subtype": "talent", "for_character": "行秋",       "cost": 3, "cost_type": "水元素", "rating": "B", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508548537170097.html"},
    {"id": "talent_mona",         "name": "沈没の預言",       "type": "equipment", "subtype": "talent", "for_character": "モナ",       "cost": 3, "cost_type": "水元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549057263793.html"},
    {"id": "talent_diluc",        "name": "流火焼灼",         "type": "equipment", "subtype": "talent", "for_character": "ディルック", "cost": 3, "cost_type": "炎元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549778682175.html"},
    {"id": "talent_bennett",      "name": "交差する炎",       "type": "equipment", "subtype": "talent", "for_character": "ベネット",   "cost": 3, "cost_type": "炎元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508548704942257.html"},
    {"id": "talent_yoimiya",      "name": "長野原龍勢流星群", "type": "equipment", "subtype": "talent", "for_character": "宵宮",       "cost": 3, "cost_type": "炎元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508548419729585.html"},
    {"id": "talent_fischl",       "name": "覚醒",             "type": "equipment", "subtype": "talent", "for_character": "フィッシュル","cost": 3, "cost_type": "雷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508550114226495.html"},
    {"id": "talent_razor",        "name": "冒険の憧れ",       "type": "equipment", "subtype": "talent", "for_character": "レザー",     "cost": 3, "cost_type": "雷元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549241813169.html"},
    {"id": "talent_keqing",       "name": "抵天の雷罰",       "type": "equipment", "subtype": "talent", "for_character": "刻晴",       "cost": 3, "cost_type": "雷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508551355742096.html"},
    {"id": "talent_jean",         "name": "落羽の裁決",       "type": "equipment", "subtype": "talent", "for_character": "ジン",       "cost": 3, "cost_type": "風元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549594132799.html"},
    {"id": "talent_sucrose",      "name": "混元熵增論",       "type": "equipment", "subtype": "talent", "for_character": "スクロース", "cost": 3, "cost_type": "風元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508553469688728.html"},
    {"id": "talent_venti",        "name": "フライリーフワインダー","type": "equipment", "subtype": "talent", "for_character": "ウェンティ", "cost": 3, "cost_type": "風元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508551875834175.html"},
    {"id": "talent_ningguang",    "name": "備えあれば憂いなし","type": "equipment", "subtype": "talent", "for_character": "凝光",       "cost": 3, "cost_type": "岩元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508552228174744.html"},
    {"id": "talent_noelle",       "name": "蒲公英の国土",     "type": "equipment", "subtype": "talent", "for_character": "ノエル",     "cost": 3, "cost_type": "岩元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508552999899139.html"},
    {"id": "talent_collei",       "name": "支援はお任せください","type": "equipment", "subtype": "talent", "for_character": "コレイ",    "cost": 3, "cost_type": "草元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549627687231.html"},
    {"id": "talent_cyno",         "name": "星喰いの鴉",       "type": "equipment", "subtype": "talent", "for_character": "セノ",       "cost": 3, "cost_type": "雷元素", "rating": "S", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508550684669431.html"},
    {"id": "talent_fischl_2",     "name": "吐納真定",         "type": "equipment", "subtype": "talent", "for_character": "凝光",       "cost": 3, "cost_type": "岩元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508554073643783.html"},
    {"id": "talent_klee",         "name": "こんこんプレゼント","type": "equipment", "subtype": "talent", "for_character": "クレー",     "cost": 3, "cost_type": "炎元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/245851494144859414.html"},
    {"id": "talent_beidou",       "name": "満天の霹靂",       "type": "equipment", "subtype": "talent", "for_character": "北斗",       "cost": 3, "cost_type": "雷元素", "rating": "B", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/245851726911925384.html"},
    {"id": "talent_kokomi",       "name": "戦意の現れ",       "type": "equipment", "subtype": "talent", "for_character": "珊瑚宮心海", "cost": 3, "cost_type": "水元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/251982396784662839.html"},
    {"id": "talent_sara",         "name": "葛籠の中の玉櫛",   "type": "equipment", "subtype": "talent", "for_character": "九条裟羅",   "cost": 3, "cost_type": "雷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/251982568298175116.html"},
    {"id": "talent_raiden",       "name": "我界",             "type": "equipment", "subtype": "talent", "for_character": "雷電将軍",   "cost": 3, "cost_type": "雷元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/251978940476854450.html"},
    {"id": "talent_itto",         "name": "荒瀧第一",         "type": "equipment", "subtype": "talent", "for_character": "荒瀧一斗",   "cost": 3, "cost_type": "岩元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/258065739691361359.html"},
    {"id": "talent_ayato",        "name": "鏡華風姿",         "type": "equipment", "subtype": "talent", "for_character": "神里綾人",   "cost": 3, "cost_type": "水元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/258065739808801871.html"},
    {"id": "talent_tighnari",     "name": "深き眼識",         "type": "equipment", "subtype": "talent", "for_character": "ティナリ",   "cost": 3, "cost_type": "草元素", "rating": "A", "obtain": ["友好対戦挑戦目標"], "url": "https://kamigame.jp/genshin/page/258065739674584143.html"},
    # 酒場挑戦天賦
    {"id": "talent_rhodeia",      "name": "百川奔流",         "type": "equipment", "subtype": "talent", "for_character": "純水精霊・ローデシア", "cost": 3, "cost_type": "水元素", "rating": "B", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508549795459391.html"},
    {"id": "talent_mirrormaiden", "name": "鏡の檻",           "type": "equipment", "subtype": "talent", "for_character": "ファデュイ・ミラーメイデン", "cost": 3, "cost_type": "氷元素", "rating": "A", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508547782183880.html"},
    {"id": "talent_deadagent",    "name": "目には目を",       "type": "equipment", "subtype": "talent", "for_character": "ファデュイ・デットエージェント・炎", "cost": 3, "cost_type": "炎元素", "rating": "A", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508548570724529.html"},
    {"id": "talent_wooden_sword2","name": "からくり神通",     "type": "equipment", "subtype": "talent", "for_character": "魔偶剣鬼",   "cost": 3, "cost_type": "炎元素", "rating": "S", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508551271856016.html"},
    {"id": "talent_hilichurl",    "name": "鋳直し：岩兜",     "type": "equipment", "subtype": "talent", "for_character": "ヒルチャール・岩兜の王", "cost": 3, "cost_type": "岩元素", "rating": "B", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508552815349763.html"},
    {"id": "talent_mushroom",     "name": "胞子増殖",         "type": "equipment", "subtype": "talent", "for_character": "マッシュラプトル", "cost": 3, "cost_type": "草元素", "rating": "A", "obtain": ["酒場挑戦目標"], "url": "https://kamigame.jp/genshin/page/240508550131003711.html"},
]

# ==================== 支援カード ====================
SUPPORT_CARDS = [
    # 場所カード
    {"id": "support_paimon",      "name": "パイモン",             "type": "support", "subtype": "companion", "cost": 3, "cost_type": "無色元素", "effect_summary": "毎ラウンド開始時、万能元素サイコロ2個を生成（各ラウンド1回）。使用可能回数：無限", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_katheryne",   "name": "キャサリン",           "type": "support", "subtype": "companion", "cost": 0, "cost_type": "無色元素", "effect_summary": "即時効果：このカードのコストを1消費し、任意の支援カードを1枚捨てる", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_timaeus",     "name": "ティマイウス",         "type": "support", "subtype": "companion", "cost": 2, "cost_type": "無色元素", "effect_summary": "自分のターン開始時、このカードに錬成ポイントを1蓄積。錬成ポイントが2になると、消費して万能元素サイコロ1個を生成", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_wagner",      "name": "ワーグナー",           "type": "support", "subtype": "companion", "cost": 3, "cost_type": "無色元素", "effect_summary": "即時：デッキから武器カードを1枚引く。自分の武器カード使用時コスト-1（各ラウンドで1回）", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_liben",       "name": "リー・ベン",           "type": "support", "subtype": "companion", "cost": 0, "cost_type": "無色元素", "effect_summary": "各ラウンドで、自分が万能元素以外の元素サイコロ3つを消費した後、このカードに1ポイントを蓄積。3ポイントになると消費して万能元素サイコロ2個と手札1枚を獲得", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_xudong",      "name": "シュウドン",           "type": "support", "subtype": "companion", "cost": 2, "cost_type": "無色元素", "effect_summary": "コスト3以上の食べ物カードのコスト-2（各ラウンドで1回）", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_ella_musk",   "name": "エラ・ムスク",         "type": "support", "subtype": "companion", "cost": 1, "cost_type": "無色元素", "effect_summary": "自分のラウンド終了時、ランダムで基本元素1個を生成（使用回数3）", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_iron_tongue", "name": "ティエ・イートン",     "type": "support", "subtype": "companion", "cost": 2, "cost_type": "無色元素", "effect_summary": "キャラカードのスキル発動時、このカードを1消費。消費された場合手札1枚引く（使用回数3）", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_liu_su",      "name": "リウ・スー",           "type": "support", "subtype": "companion", "cost": 1, "cost_type": "無色元素", "effect_summary": "ラウンド終了時に元素チャージが満タンでないキャラの元素チャージを1増加（使用回数2）", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    # 場所
    {"id": "support_fortune_drift","name": "千盞茶",              "type": "support", "subtype": "location",  "cost": 2, "cost_type": "無色元素", "effect_summary": "自分のラウンド終了時、コストが最も高い手札1枚を捨て、手札2枚引く（使用回数2）", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_favonius_church","name": "モンドのファヴォニウス大聖堂", "type": "support", "subtype": "location", "cost": 2, "cost_type": "無色元素", "effect_summary": "自分のラウンド終了時、出撃キャラのHPを2回復（使用回数2）", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_bubu_pharmacy","name": "ブブ薬局",            "type": "support", "subtype": "location",  "cost": 1, "cost_type": "無色元素", "effect_summary": "自分のターン開始時、コスト0の食べ物カードを1枚手札に追加（使用回数3）", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_liyue_harbor", "name": "璃月港の波止場",      "type": "support", "subtype": "location",  "cost": 2, "cost_type": "無色元素", "effect_summary": "自分のラウンド終了時、手札が4枚以下なら手札2枚引く（使用回数2）", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_wangshu_inn", "name": "望舒客桟",             "type": "support", "subtype": "location",  "cost": 2, "cost_type": "無色元素", "effect_summary": "自分のラウンド終了時、控えキャラのHPを2回復（使用回数2）", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_xudong_2",    "name": "古華花館",             "type": "support", "subtype": "location",  "cost": 2, "cost_type": "無色元素", "effect_summary": "自分の食べ物カードを使用する時、コスト-1（各ラウンドで1回）。使用可能回数：3", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_stormterror", "name": "風龍廃墟",             "type": "support", "subtype": "location",  "cost": 2, "cost_type": "同一元素", "effect_summary": "登場時、デッキからランダムに天賦カードを1枚引く。天賦カード使用時やコスト4以上のスキル発動時コスト-1（使用可能回数：3）", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "support_sumeru_city", "name": "スメールシティ",       "type": "support", "subtype": "location",  "cost": 2, "cost_type": "同一元素", "effect_summary": "自分が草元素反応を起こすたびに、このカードに1ポイント蓄積。2ポイントになると消費して万能元素サイコロ1個を生成（使用回数3）", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
]

# ==================== イベントカード ====================
EVENT_CARDS = [
    # 食べ物
    {"id": "event_mondstadt_hash_brown","name": "モンドのハッシュブラウン", "type": "event", "subtype": "food", "cost": 1, "cost_type": "無色元素", "effect_summary": "本ラウンドで出撃キャラがダメージを受けると、HP1を回復（各ラウンドで1回）", "rating": "C",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_jueyun_guoba",  "name": "北国バンク",             "type": "event", "subtype": "food", "cost": 2, "cost_type": "無色元素", "effect_summary": "出撃キャラのHPを2回復", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_teyvat_fried_egg","name": "テイバトの目玉焼き",  "type": "event", "subtype": "food", "cost": 2, "cost_type": "無色元素", "effect_summary": "倒されたキャラを復活させ、HP1を回復", "rating": "S",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_sweet_madame",  "name": "スイートマダム",         "type": "event", "subtype": "food", "cost": 1, "cost_type": "無色元素", "effect_summary": "出撃キャラのHPを1回復", "rating": "C",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_mushroom_pizza","name": "マッシュルームピザ",     "type": "event", "subtype": "food", "cost": 1, "cost_type": "無色元素", "effect_summary": "出撃キャラのHPを1回復し、ダメージを1増加（本ラウンド）", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_mora_meat",     "name": "モラ肉",                 "type": "event", "subtype": "food", "cost": 3, "cost_type": "無色元素", "effect_summary": "出撃キャラのHPを3回復", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    # 元素共鳴
    {"id": "event_ice_resonance", "name": "元素共鳴：交わりを解く氷", "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "氷元素", "effect_summary": "味方に氷元素が2体以上の時使用可。万能元素サイコロ1個を生成し、相手の出撃キャラに凍結を付与", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_water_resonance","name": "元素共鳴：流れる水",    "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "水元素", "effect_summary": "味方に水元素が2体以上の時使用可。出撃キャラのHPを2回復", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_fire_resonance", "name": "元素共鳴：燃え盛る炎",  "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "炎元素", "effect_summary": "味方に炎元素が2体以上の時使用可。万能元素サイコロ2個を生成", "rating": "S",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_thunder_resonance","name": "元素共鳴：高圧電流",  "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "雷元素", "effect_summary": "味方に雷元素が2体以上の時使用可。味方に超激化付与（ダメージ+3）", "rating": "S",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_wind_resonance", "name": "元素共鳴：響く風",      "type": "event", "subtype": "resonance", "cost": 0, "cost_type": "風元素", "effect_summary": "味方に風元素が2体以上の時使用可。元素チャージを1つ増加", "rating": "S",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_rock_resonance", "name": "元素共鳴：固める岩",    "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "岩元素", "effect_summary": "味方に岩元素が2体以上の時使用可。味方出撃キャラに岩鎧(シールド2)付与", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_grass_resonance","name": "元素共鳴：繁茂する草",  "type": "event", "subtype": "resonance", "cost": 1, "cost_type": "草元素", "effect_summary": "味方に草元素が2体以上の時使用可。草元素サイコロを1個生成し、種を1個生成", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    # 汎用イベント
    {"id": "event_strategize",    "name": "最高の仲間！",           "type": "event", "subtype": "general",   "cost": 0, "cost_type": "無色元素", "effect_summary": "万能元素サイコロ以外のサイコロ2個を万能元素サイコロ2個に変換", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_i_got_your_back","name": "いつも一緒！",          "type": "event", "subtype": "general",   "cost": 2, "cost_type": "同一元素", "effect_summary": "全ての味方キャラのHPを1回復し、各キャラの元素チャージを1増加", "rating": "A",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_leave_it_to_me","name": "私に任せて！",           "type": "event", "subtype": "general",   "cost": 0, "cost_type": "無色元素", "effect_summary": "次のラウンドの先行権を得る（次のラウンド、先にアクション可能）", "rating": "S",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_wind_harmony",  "name": "調和",                   "type": "event", "subtype": "general",   "cost": 0, "cost_type": "無色元素", "effect_summary": "手札1枚を捨て、元素サイコロ1個を補充", "rating": "B",  "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_quick_knit",    "name": "センス一閃",             "type": "event", "subtype": "general",   "cost": 0, "cost_type": "無色元素", "effect_summary": "手札を2枚引く", "rating": "SS", "obtain": ["カードショップ"],             "url": ""},
    {"id": "event_elemental_resonance_woven_weeds","name": "元素共鳴：先陣の草","type":"event","subtype":"resonance","cost":0,"cost_type":"草元素","effect_summary":"草元素が2体以上の時。草元素サイコロ1個を生成","rating":"A","obtain":["カードショップ"],"url":""},
]

def compute_hash(card: dict) -> str:
    """カードデータのハッシュ値を計算（更新検知用）"""
    card_str = json.dumps({k: v for k, v in card.items() if k != "hash"}, sort_keys=True, ensure_ascii=False)
    return hashlib.md5(card_str.encode()).hexdigest()[:8]

def build_database():
    all_cards = CHARACTER_CARDS + WEAPON_CARDS + ARTIFACT_CARDS + TALENT_CARDS + SUPPORT_CARDS + EVENT_CARDS

    # IDの重複チェック
    ids = [c["id"] for c in all_cards]
    duplicates = [id for id in ids if ids.count(id) > 1]
    if duplicates:
        print(f"[WARNING] 重複ID: {set(duplicates)}")

    # ハッシュ付与
    for card in all_cards:
        card["hash"] = compute_hash(card)

    db = {
        "meta": {
            "version": "5.6",
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
            "source": "https://kamigame.jp/genshin/page/239657091990613487.html",
            "total_cards": len(all_cards),
            "breakdown": {
                "character": len(CHARACTER_CARDS),
                "weapon": len(WEAPON_CARDS),
                "artifact": len(ARTIFACT_CARDS),
                "talent": len(TALENT_CARDS),
                "support": len(SUPPORT_CARDS),
                "event": len(EVENT_CARDS),
            }
        },
        "cards": {card["id"]: card for card in all_cards}
    }
    return db

if __name__ == "__main__":
    db = build_database()
    with open("/home/claude/cards_db.json", "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print(f"✅ DB構築完了: {db['meta']['total_cards']}枚")
    for k, v in db['meta']['breakdown'].items():
        print(f"  {k}: {v}枚")
