# PowerShell 7에서 실행. 공개 저장소에서는 같은 폴더의 HTML을 다시 생성한다.
# 별도 미리보기: ./build-preview.ps1 -OutputDirectory ./web
param([string]$OutputDirectory = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$style = @'
:root{--bg:#f7f5ef;--paper:#fffefb;--ink:#243a32;--muted:#59675e;--line:#d9dfd5;--accent:#276849;--warm:#a94d28}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.85 system-ui,'Malgun Gothic',sans-serif}a{color:#185e42;text-underline-offset:4px}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #ce662f;outline-offset:4px}.skip{position:absolute;left:12px;top:-80px}.skip:focus{top:12px;background:white;padding:12px;z-index:9}header{padding:38px max(24px,calc((100vw - 1360px)/2));background:#e7eee3;border-bottom:1px solid var(--line)}.eyebrow{font-size:13px;font-weight:700;letter-spacing:.08em;color:var(--accent)}h1{font-size:clamp(27px,4vw,42px);line-height:1.25;margin:12px 0}.subtitle{max-width:760px;color:var(--muted);margin:0}nav.top{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}nav.top a{padding:8px 15px;border:1px solid #becbb9;border-radius:8px;text-decoration:none;background:#fff9}nav.top a[aria-current=page]{background:var(--accent);color:white;border-color:var(--accent)}.layout{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:285px minmax(0,1fr);gap:30px;padding:30px 24px 70px}aside{align-self:start;position:sticky;top:20px;max-height:calc(100vh - 40px);overflow:auto;padding:4px 12px 10px 0}aside h2{font-size:17px;margin:0 0 12px}label{display:block;font-size:14px;font-weight:650}input{width:100%;border:1px solid #a9bca5;border-radius:7px;padding:11px;background:white;font:inherit;margin:6px 0}button{font:inherit;color:var(--accent);background:transparent;border:1px solid #bbcbbb;border-radius:7px;padding:6px 10px;cursor:pointer}.tools{display:flex;gap:8px;flex-wrap:wrap;margin:7px 0 14px}.status{font-size:13px;color:var(--muted)}.toc{list-style:none;padding:0;margin:16px 0}.toc a{display:block;font-size:14px;line-height:1.5;text-decoration:none;padding:8px;border-radius:6px}.toc a:hover{background:#e6ede2}main{min-width:0}.intro{padding:4px 0 20px;color:var(--muted)}article{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:28px 34px;margin-bottom:24px;scroll-margin-top:20px}article h2{font-size:23px;line-height:1.5;margin:0 0 18px;letter-spacing:-.03em}article p{margin:15px 0}article strong{color:#175135}code{font-size:.9em;background:#edf0e8;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;font-size:14px}th,td{padding:10px;border:1px solid var(--line);vertical-align:top;text-align:left}th{background:#edf2e8}footer{max-width:1400px;margin:auto;padding:20px 24px 35px;font-size:13px;color:var(--muted);border-top:1px solid var(--line)}[hidden]{display:none!important}.empty{padding:20px;border:1px dashed var(--line)}@media(max-width:800px){header{padding:25px 18px}.layout{grid-template-columns:1fr;padding:20px 16px;gap:18px}aside{position:static;max-height:none;border-bottom:1px solid var(--line);padding-bottom:18px}.toc{max-height:230px;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px}article{padding:22px 20px}article h2{font-size:21px}body{font-size:15px}}@media(max-width:440px){.toc{grid-template-columns:1fr}article{padding:20px 16px}}@media print{body{background:white;font-size:10.5pt;line-height:1.65}header{padding:0 0 15px;background:white}.layout{display:block;padding:0}aside,nav.top,.skip,footer,.empty{display:none}article{border:0;border-radius:0;padding:0;break-before:page}article h2{font-size:18pt}a{color:inherit}article[hidden]{display:block!important}@page{size:A4;margin:18mm}}
'@
$script = @'
const input=document.querySelector('#query'),cards=[...document.querySelectorAll('article[data-card]')],links=[...document.querySelectorAll('.toc li[data-card]')],status=document.querySelector('#status');function filter(){const q=input.value.normalize('NFKC').toLocaleLowerCase().trim();let count=0;cards.forEach((card,i)=>{const visible=!q||card.textContent.normalize('NFKC').toLocaleLowerCase().includes(q);card.hidden=!visible;if(links[i])links[i].hidden=!visible;if(visible)count++});status.textContent=`${cards.length}개 중 ${count}개 표시`;document.querySelector('#empty').hidden=count!==0;}input.addEventListener('input',filter);document.querySelector('#reset').addEventListener('click',()=>{input.value='';filter();input.focus()});document.querySelector('#print').addEventListener('click',()=>window.print());filter();
'@
function Write-StudyPage([string]$InputName,[string]$OutputName,[string]$Title,[string]$Description,[string]$Current) {
  $markdown=Get-Content -LiteralPath (Join-Path $PSScriptRoot $InputName) -Raw -Encoding utf8
  $parts=[regex]::Split($markdown,'(?m)(?=^## )')
  $intro=($parts[0] -replace '(?m)^# .+\r?\n','' | ConvertFrom-Markdown).Html
  $articles=[System.Collections.Generic.List[string]]::new()
  $items=[System.Collections.Generic.List[string]]::new()
  $n=0
  foreach($part in $parts[1..($parts.Count-1)]) {
    $n++
    $heading=([regex]::Match($part,'^## ([^\r\n]+)')).Groups[1].Value
    $id='section-'+$n
    $numbered=$heading -match '^\d{2}\.'
    $flag=if($numbered){' data-card'}else{''}
    # 목차는 article의 고유 ID를 사용한다. 변환기의 제목 ID 중복을 제거한다.
    $html=(($part | ConvertFrom-Markdown).Html -replace '<h([1-6]) id="[^"]*">','<h$1>')
    $articles.Add('<article id="'+$id+'"'+$flag+'>'+$html+'</article>')
    $items.Add('<li'+$flag+'><a href="#'+$id+'">'+[System.Net.WebUtility]::HtmlEncode($heading)+'</a></li>')
  }
  $sourceCurrent=if($Current -eq 'source'){' aria-current="page"'}else{''}
  $sitesCurrent=if($Current -eq 'sites'){' aria-current="page"'}else{''}
  $journalCurrent=if($Current -eq 'journal'){' aria-current="page"'}else{''}
  $page=@"
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>$Title · 책방 친구</title><style>$style</style></head><body><a class="skip" href="#content">본문으로 이동</a><header><div class="eyebrow">책방 친구 · 픽셀 아트 연구</div><h1>$Title</h1><p class="subtitle">$Description</p><nav class="top" aria-label="연구 페이지"><a href="index.html"$sourceCurrent>원전 21개</a><a href="sites.html"$sitesCurrent>연구 사이트 5곳</a><a href="journal.html"$journalCurrent>실행 일지</a><a href="../../research.html">기존 연구 영역</a></nav></header><div class="layout"><aside><h2>자료 찾기</h2><label for="query">제목·개념·본문 검색</label><input id="query" type="search" placeholder="예: 실루엣, 회전, 팔레트" autocomplete="off"><div class="tools"><button id="reset" type="button">검색 초기화</button><button id="print" type="button">인쇄</button></div><p id="status" class="status" role="status" aria-live="polite"></p><nav aria-label="문서 목차"><ul class="toc">$($items -join "`n")</ul></nav></aside><main id="content"><div class="intro">$intro</div><p id="empty" class="empty" hidden>검색 결과가 없습니다. 다른 낱말로 찾아보세요.</p>$($articles -join "`n")</main></div><footer>원문 확인 2026-11-15 · 자료 검토와 적용 실험 설계를 구분합니다. 이 페이지에 제안된 실험은 아직 수행하지 않았습니다.</footer><script>$script</script></body></html>
"@
  [System.IO.File]::WriteAllText((Join-Path $OutputDirectory $OutputName),$page,[System.Text.UTF8Encoding]::new($false))
}
Write-StudyPage '01_자료별_연구.md' 'index.html' '픽셀 아트 원전 연구' '제작자 원전과 공식 문서 21개를 읽고, 몸·동작·배경·표시 실험으로 연결합니다.' 'source'
Write-StudyPage '02_연구_사이트.md' 'sites.html' '픽셀 아트 연구 사이트' '자료량과 활동 근거를 확인한 5곳. 절대 순위와 실제 확인한 정보를 구분합니다.' 'sites'
Write-StudyPage '03_실행_일지.md' 'journal.html' '픽셀 아트 실행 일지' '수행한 검토, 아직 하지 않은 실험, 다음 단계의 통과 조건을 기록합니다.' 'journal'
Get-ChildItem -LiteralPath $OutputDirectory | Select-Object Name,Length
