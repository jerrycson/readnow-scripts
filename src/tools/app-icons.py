# 리드나우 휴대폰 앱 — 화면별 설치 파일(manifest)·아이콘 만들기 (웹앱 1.44.0)
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
BASE = '/readnow-scripts/app/'
PAGES = [  # key, 이름, 짧은 이름, 아이콘 글자, 색
  ('home', '리드나우', '리드나우', '홈', '#2F5D50'),
  ('confirm', '주문확인요청 (리드나우)', '주문확인', '주문', '#B0322A'),
  ('deliv', '오늘 출고 (리드나우)', '오늘 출고', '출고', '#A8661B'),
  ('reg', '상품 등록 (리드나우)', '상품 등록', '등록', '#1F5FAF'),
  ('ppt', '사진 가격 (리드나우)', '사진 가격', '사진', '#6B3FA0'),
  ('batch', '수동 일괄 처리 (리드나우)', '일괄 처리', '일괄', '#1F7A6E'),
  ('products', '상품 (리드나우)', '상품', '상품', '#3B6E2F'),
  ('orders', '주문·매출 (리드나우)', '주문·매출', '매출', '#8A4B00'),
  ('search', '고객 (리드나우)', '고객', '고객', '#4A4F8A'),
  ('mgr', '관리도구 (리드나우)', '관리도구', '관리', '#333B39'),
]
def icon(sz, txt, col, mask=False):
  im = Image.new('RGBA', (sz, sz), col); d = ImageDraw.Draw(im)
  pad = int(sz * 0.12) if mask else 0  # 마스커블은 가운데 80% 안에
  f1 = ImageFont.truetype(FONT, int(sz * (0.30 if mask else 0.36)), index=1); f2 = ImageFont.truetype(FONT, int(sz * (0.11 if mask else 0.13)), index=1)
  w = d.textlength(txt, font=f1); d.text(((sz - w) / 2, sz * 0.40 - f1.size * 0.62), txt, font=f1, fill='white')
  w2 = d.textlength('리드나우', font=f2); d.text(((sz - w2) / 2, sz * (0.72 if mask else 0.74) - f2.size * 0.6), '리드나우', font=f2, fill=(255, 255, 255, 215))
  return im
for key, name, short, txt, col in PAGES:
  for z in (192, 512, 180): icon(z, txt, col).save(os.path.join(OUT, f'{key}-{z}.png'))
  icon(512, txt, col, True).save(os.path.join(OUT, f'{key}-512m.png'))
  start = BASE if key == 'home' else BASE + '?go=' + key
  man = { 'id': start, 'name': name, 'short_name': short, 'start_url': start, 'scope': BASE, 'display': 'standalone', 'display_override': ['standalone'], 'orientation': 'any',
    'background_color': '#ffffff', 'theme_color': col, 'lang': 'ko', 'dir': 'ltr', 'description': f'리드나우 — {short} 화면으로 바로 열림',
    'icons': [{ 'src': f'{key}-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any' }, { 'src': f'{key}-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any' }, { 'src': f'{key}-512m.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable' }],
    # 아이콘을 길게 누르면 나오는 바로 가기(안드로이드)
    'shortcuts': [{ 'name': n2, 'short_name': s2, 'url': (BASE if k2 == 'home' else BASE + '?go=' + k2), 'icons': [{ 'src': f'{k2}-192.png', 'sizes': '192x192', 'type': 'image/png' }] } for k2, n2, s2, _, _ in PAGES if k2 in ('confirm', 'deliv', 'reg', 'ppt') and k2 != key][:4] }
  with open(os.path.join(OUT, f'{key}.webmanifest'), 'w', encoding='utf-8') as fp: json.dump(man, fp, ensure_ascii=False, indent=1)
print('ok', len(PAGES))
