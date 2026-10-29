#!/usr/bin/env python3
"""책방 친구 연구 바이블 v2 → friend/research.html (+ obs/·web/ 기록 페이지) 생성.
사용: python3 friend/research/build.py   (readnow-scripts 저장소 어디서든)
원본 .md는 이 폴더(friend/research/)가 기준. readnow-chats/mascot/bible_v2 와 같은 내용을 복사해 둔다."""
import os, re, glob, html, datetime
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'research.html')
CSS = """
:root{--ink:#1f2a24;--bg:#faf8f3;--card:#fff;--line:#d9d4c7;--hd:#1f5a44;--acc:#b8562a;--mut:#6b6f66}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,'Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif}
header{background:var(--hd);color:#fff;padding:14px 18px}header h1{margin:0;font-size:19px}header p{margin:4px 0 0;font-size:13px;opacity:.9}
.wrap{display:grid;grid-template-columns:260px 1fr;gap:0;max-width:1400px;margin:0 auto}
nav{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:14px 10px;border-right:1px solid var(--line);background:#f3f0e8;font-size:13px}
nav a{display:block;color:var(--ink);text-decoration:none;padding:3px 6px;border-radius:6px}nav a:hover{background:#e6e1d4}nav .l2{padding-left:18px;color:var(--mut);font-size:12px}
main{padding:18px 28px 80px;min-width:0}
section.ch{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;margin:0 0 22px}
h1,h2,h3,h4{line-height:1.3}section.ch>h1{font-size:21px;margin:0 0 10px;color:var(--hd)}h2{font-size:17px;margin:22px 0 8px;border-left:4px solid var(--hd);padding-left:8px}h3{font-size:15px;margin:16px 0 6px;color:var(--acc)}
table{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0 12px;display:block;overflow:auto}th,td{border:1px solid var(--line);padding:5px 7px;vertical-align:top;text-align:left}th{background:#eef3ef}
code{background:#f0ede4;padding:0 4px;border-radius:4px;font-size:12.5px}pre{background:#f0ede4;padding:10px;border-radius:8px;overflow:auto;font-size:12.5px}
blockquote{border-left:3px solid var(--line);margin:8px 0;padding:2px 12px;color:var(--mut)}
.meta{font-size:12px;color:var(--mut)}.back{font-size:13px}
@media(max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}main{padding:12px 16px 60px}}
"""

def md2html(text):
    return markdown.markdown(text, extensions=['tables', 'fenced_code', 'toc'], output_format='html5')

def page(title, body_html, nav_html='', sub=''):
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y-%m-%d %H:%M')
    return f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>{CSS}</style></head><body>
<header><h1>{html.escape(title)}</h1><p>{html.escape(sub)} · 생성 {now} KST · 원본 friend/research/*.md (비공개 저장소 readnow-chats/mascot/bible_v2 와 동일)</p></header>
<div class="wrap"><nav>{nav_html}</nav><main>{body_html}</main></div></body></html>"""

def slug(s):
    return re.sub(r'[^0-9A-Za-z가-힣_-]+', '-', s).strip('-')

def build_index():
    files = sorted(glob.glob(os.path.join(HERE, '[0-9][0-9]_*.md')))
    nav, body = [], []
    for f in files:
        name = os.path.basename(f)[:-3]
        text = open(f, encoding='utf-8').read()
        m = re.match(r'#\s*(.+)', text)
        title = m.group(1).strip() if m else name
        sid = slug(name)
        nav.append(f'<a href="#{sid}">{html.escape(title[:48])}</a>')
        for h2 in re.findall(r'^##\s+(.+)$', text, re.M)[:14]:
            nav.append(f'<a class="l2" href="#{sid}-{slug(h2)}">{html.escape(h2[:40])}</a>')
        inner = md2html(text)
        # 장 안 h2 에 id 부여
        def rep(mm):
            return f'<h2 id="{sid}-{slug(html.unescape(re.sub("<[^>]+>", "", mm.group(1))))}">{mm.group(1)}</h2>'
        inner = re.sub(r'<h2[^>]*>(.*?)</h2>', rep, inner)
        inner = re.sub(r'<h1[^>]*>', '<h1>', inner, count=1)
        inner = inner.replace('href="obs/', 'href="research/obs/').replace('href="web/', 'href="research/web/').replace('href="../research_v1.html"', 'href="research_v1.html"')
        body.append(f'<section class="ch" id="{sid}">{inner}</section>')
    nav.append('<a href="research_v1.html">↩ v1 페이지(2026-10-28)</a>')
    return page('🎨 책방 친구 캐릭터·애니메이션 바이블 v2', '\n'.join(body), '\n'.join(nav),
                '정범님 지시(2026-10-29 17:35)로 다시 쓴 설계 기준 · 진행도 표 · 실행 묶음')

def build_records():
    for sub in ('obs', 'web'):
        d = os.path.join(HERE, sub)
        for f in sorted(glob.glob(os.path.join(d, '*.md'))):
            text = open(f, encoding='utf-8').read()
            m = re.match(r'#\s*(.+)', text)
            title = m.group(1).strip() if m else os.path.basename(f)
            nav = '<a class="back" href="../../research.html">← 바이블 v2</a>' + ''.join(
                f'<a href="#{slug(h)}">{html.escape(h[:40])}</a>' for h in re.findall(r'^##\s+(.+)$', text, re.M)[:30])
            inner = md2html(text)
            inner = re.sub(r'<h2[^>]*>(.*?)</h2>', lambda mm: f'<h2 id="{slug(html.unescape(re.sub("<[^>]+>", "", mm.group(1))))}">{mm.group(1)}</h2>', inner)
            out = f[:-3] + '.html'
            open(out, 'w', encoding='utf-8').write(page(title, f'<section class="ch">{inner}</section>', nav, '조사 기록(관찰·웹) · 바이블 v2의 근거'))

if __name__ == '__main__':
    open(OUT, 'w', encoding='utf-8').write(build_index())
    build_records()
    print('wrote', OUT, os.path.getsize(OUT))
