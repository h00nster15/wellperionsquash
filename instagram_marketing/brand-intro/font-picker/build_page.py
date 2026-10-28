"""Builds the font-picker page for the Wellperion overview card series.
python3 build_page.py <repo/instagram_marketing dir> <logo.txt> <fonts dir> <out.html> <caption.txt>"""
import sys, re, json, base64, html
src, logo_f, fonts, out, cap_f = sys.argv[1:6]
LOGO = open(logo_f).read().strip()
CARDS = [('Main', '01 브랜드 소개'), ('Junior', '02 주니어 입시'), ('Women', '03 여성 초보 커뮤니티'), ('Senior', '04 45+ 웰니스'),
         ('Tip', '05 레슨 팁: T 포지션'), ('Ladder', '06 클럽 래더'), ('FirstDay', '07 첫 레슨 준비물'), ('Trial', '08 무료 체험 안내')]
cards = []
for name, label in CARDS:
    s = open(f'{src}/{name}.dc.html').read()
    style = re.search(r'<style>(.*?)</style>', s, re.S).group(1).replace('body{margin:0}', '')
    body = re.search(r'</helmet>(.*?)</x-dc>', s, re.S).group(1)
    body = re.sub(r'/_blob/[a-f0-9]+', LOGO, body)
    cards.append({'label': label, 'style': style, 'body': body.strip()})
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
caption = open(cap_f).read().strip()

page = r'''<title>웰페리온 카드 폰트</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=IBM+Plex+Sans+KR:wght@300;400;500;700&family=Gothic+A1:wght@300;400;500;700;900&family=Gowun+Dodum&family=Hahmlet:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@300;400;500;700;900&family=Gowun+Batang:wght@400;700&family=Montserrat:wght@400;500;700;900&family=Playfair+Display:wght@400;500;700;900&family=Cormorant+Garamond:wght@400;500;700&display=swap">
<style>
@font-face{font-family:'Pretendard';src:url(data:font/woff2;base64,__PRET__) format('woff2');font-weight:45 920;font-display:swap}
@font-face{font-family:'SUIT';src:url(data:font/woff2;base64,__SUIT__) format('woff2');font-weight:100 900;font-display:swap}
/* Layout: sticky control bar of font chips over a two-column wall of the real 1080px cards, scaled down */
:root{
  --bg:#F2F4F2; --surface:#FFFFFF; --fg:#1A1F1C; --muted:#5E6B63; --line:#D5DDD8; --accent:#56695E; --accent-fg:#FFFFFF;
  --ui:'Pretendard','Noto Sans KR',system-ui,sans-serif;
  --kr:'Noto Sans KR'; --lat:'Noto Sans KR'; --hw:900; --ls:-0.04em;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#141816;--surface:#1D2320;--fg:#EDF1EE;--muted:#A2AFA7;--line:#323B36;--accent:#9DB3A6;--accent-fg:#111411;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141816;--surface:#1D2320;--fg:#EDF1EE;--muted:#A2AFA7;--line:#323B36;--accent:#9DB3A6;--accent-fg:#111411;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:var(--ui);font-size:15px;line-height:1.5}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--surface)}
.wrap{max-width:1240px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header.top{padding-block:28px 14px}
header.top h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;text-wrap:balance}
header.top p{margin:6px 0 0;color:var(--muted);max-width:62ch}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--surface);border-bottom:1px solid var(--line)}
.bar .wrap{display:flex;flex-direction:column;gap:10px;padding-block:12px}
.grp{display:flex;align-items:center;gap:10px;min-width:0}
.grp>span{flex-shrink:0;width:74px;font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.04em}
.chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;min-width:0;padding-block:2px}
.chips button{flex-shrink:0;font:inherit;font-size:14px;color:var(--fg);background:transparent;border:1px solid var(--line);border-radius:999px;padding:6px 13px;cursor:pointer;min-height:34px;white-space:nowrap}
.chips button[aria-pressed="true"]{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
.chips button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.now{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:13px;color:var(--muted)}
.now b{color:var(--fg);font-weight:700}
.now button{font:inherit;font-size:13px;font-weight:700;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:999px;padding:4px 12px;cursor:pointer}
main{padding-block:24px 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,440px),1fr));gap:22px}
figure{margin:0;display:flex;flex-direction:column;gap:8px;min-width:0}
.frame{position:relative;width:100%;max-width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:10px;border:1px solid var(--line);background:#FFFFFF}
.frame>div{position:absolute;top:0;left:0;width:1080px;height:1080px;transform-origin:0 0}
figcaption{font-size:14px;font-weight:700}
section.cap{padding-block:30px 48px}
section.cap h2{margin:0 0 10px;font-size:20px;font-weight:800}
section.cap pre{margin:0;white-space:pre-wrap;word-break:keep-all;font-family:var(--ui);font-size:15px;line-height:1.7;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px 20px;max-width:70ch}
section.cap button{margin-top:10px;font:inherit;font-weight:700;border:1px solid var(--accent);background:var(--accent);color:var(--accent-fg);border-radius:999px;padding:8px 16px;cursor:pointer}
.hint{font-size:13px;color:var(--muted);margin-top:6px}
</style>

<header class="wrap top">
  <h1>웰페리온 카드 폰트 고르기</h1>
  <p>첫 번째 시리즈(전체 개요 8장)에 폰트를 바로 바꿔 적용해 볼 수 있어요. 마음에 드는 조합을 고르고 "조합 복사"를 눌러 채팅에 붙여 주시면 그 폰트로 PNG를 다시 만들어 드릴게요.</p>
</header>

<div class="bar"><div class="wrap">
  <div class="grp"><span>한글 폰트</span><div class="chips" id="kr" role="group" aria-label="한글 폰트"></div></div>
  <div class="grp"><span>영문·숫자</span><div class="chips" id="lat" role="group" aria-label="영문과 숫자 폰트"></div></div>
  <div class="grp"><span>제목 굵기</span><div class="chips" id="hw" role="group" aria-label="제목 굵기"></div></div>
  <div class="now"><span id="desc"></span><button type="button" id="copy">조합 복사</button><span id="copied" aria-live="polite"></span></div>
</div></div>

<main class="wrap"><div class="grid" id="grid"></div></main>

<section class="wrap cap">
  <h2>인스타 캡션 · 전체 개요 시리즈</h2>
  <pre id="captxt">__CAPTION__</pre>
  <button type="button" id="capcopy">캡션 복사</button>
  <div class="hint" id="capok" aria-live="polite"></div>
</section>

<script>
const CARDS = __CARDS__;
const KR = [
  {id:'noto', name:'Noto Sans KR', fam:"'Noto Sans KR'", note:'지금 쓰는 폰트. 무난하고 굵기가 다양해요.'},
  {id:'pret', name:'Pretendard', fam:"'Pretendard'", note:'요즘 브랜드들이 많이 쓰는 깔끔한 고딕. 자간이 좁아 세련돼 보여요.'},
  {id:'suit', name:'SUIT', fam:"'SUIT'", note:'기하학적이고 모던한 고딕. 숫자가 예뻐요.'},
  {id:'plex', name:'IBM Plex Sans KR', fam:"'IBM Plex Sans KR'", note:'단정하고 지적인 느낌. 가장 굵은 굵기는 700이에요.'},
  {id:'gothic', name:'Gothic A1', fam:"'Gothic A1'", note:'잡지 같은 또렷한 고딕.'},
  {id:'dodum', name:'고운돋움', fam:"'Gowun Dodum'", note:'부드럽고 차분한 고딕. 굵기가 하나뿐이라 제목이 가벼워요.'},
  {id:'hahm', name:'함렛', fam:"'Hahmlet'", note:'모던한 명조. 클래식하지만 딱딱하지 않아요.'},
  {id:'serif', name:'Noto Serif KR', fam:"'Noto Serif KR'", note:'정통 명조. 격식 있는 느낌.'},
  {id:'batang', name:'고운바탕', fam:"'Gowun Batang'", note:'부드러운 명조. 가장 굵은 굵기는 700이에요.'}
];
const LAT = [
  {id:'same', name:'한글과 같게', fam:''},
  {id:'mont', name:'Montserrat', fam:"'Montserrat'"},
  {id:'play', name:'Playfair Display', fam:"'Playfair Display'"},
  {id:'corm', name:'Cormorant Garamond', fam:"'Cormorant Garamond'"}
];
const HW = [{id:'900',name:'아주 굵게'},{id:'700',name:'굵게'},{id:'500',name:'중간'}];
const OVERRIDE = `.f,.f *{font-family:var(--lat),var(--kr),'Noto Sans KR',sans-serif !important}
.f .h,.f h1,.f h2,.f h3{font-weight:var(--hw) !important;letter-spacing:var(--ls) !important}`;

let st = {kr:'noto', lat:'same', hw:'900'};
try { Object.assign(st, JSON.parse(localStorage.getItem('wp-font') || '{}')); } catch (e) {}

const grid = document.getElementById('grid');
const hosts = [];
CARDS.forEach(c => {
  const fig = document.createElement('figure');
  const frame = document.createElement('div'); frame.className = 'frame';
  const inner = document.createElement('div');
  const root = inner.attachShadow({mode:'open'});
  root.innerHTML = `<style>${c.style}${OVERRIDE}</style>${c.body}`;
  frame.appendChild(inner); fig.appendChild(frame);
  const cap = document.createElement('figcaption'); cap.textContent = c.label; fig.appendChild(cap);
  grid.appendChild(fig); hosts.push([frame, inner]);
});
const fit = () => hosts.forEach(([f, i]) => { i.style.transform = `scale(${f.clientWidth / 1080})`; });
new ResizeObserver(fit).observe(grid); fit();

function chips(el, list, key) {
  const box = document.getElementById(el);
  list.forEach(o => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = o.name; b.dataset.id = o.id;
    if (o.fam) b.style.fontFamily = o.fam + ', var(--ui)';
    b.addEventListener('click', () => { st[key] = o.id; apply(); });
    box.appendChild(b);
  });
}
chips('kr', KR, 'kr'); chips('lat', LAT, 'lat'); chips('hw', HW, 'hw');

function apply() {
  const k = KR.find(x => x.id === st.kr) || KR[0], l = LAT.find(x => x.id === st.lat) || LAT[0];
  const r = document.documentElement.style;
  r.setProperty('--kr', k.fam);
  r.setProperty('--lat', l.fam || k.fam);
  r.setProperty('--hw', st.hw);
  r.setProperty('--ls', /Serif|Hahmlet|Batang/.test(k.fam) ? '-0.02em' : '-0.04em');
  for (const [id, v] of [['kr', st.kr], ['lat', st.lat], ['hw', st.hw]])
    document.querySelectorAll('#' + id + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === v));
  document.getElementById('desc').innerHTML = `<b>${k.name}</b> · 영문 ${l.id === 'same' ? '한글과 같게' : '<b>' + l.name + '</b>'} · 제목 ${HW.find(x => x.id === st.hw).name}<br>${k.note}`;
  try { localStorage.setItem('wp-font', JSON.stringify(st)); } catch (e) {}
}
apply();

function copy(text, okEl, okMsg, fallbackEl) {
  const ok = () => { okEl.textContent = okMsg; setTimeout(() => okEl.textContent = '', 2500); };
  const fb = () => { const s = getSelection(), r = document.createRange(); r.selectNodeContents(fallbackEl); s.removeAllRanges(); s.addRange(r); okEl.textContent = '선택됐어요. 길게 눌러 복사해 주세요.'; };
  try { navigator.clipboard.writeText(text).then(ok, fb); } catch (e) { fb(); }
}
document.getElementById('copy').addEventListener('click', () => {
  const k = KR.find(x => x.id === st.kr), l = LAT.find(x => x.id === st.lat);
  copy(`폰트 조합: 한글 ${k.name} / 영문·숫자 ${l.name} / 제목 ${HW.find(x => x.id === st.hw).name}`, document.getElementById('copied'), '복사했어요', document.getElementById('desc'));
});
document.getElementById('capcopy').addEventListener('click', () => {
  copy(document.getElementById('captxt').textContent, document.getElementById('capok'), '캡션을 복사했어요', document.getElementById('captxt'));
});
</script>
'''
page = (page.replace('__PRET__', b64(f'{fonts}/pret.woff2')).replace('__SUIT__', b64(f'{fonts}/suit.woff2'))
        .replace('__CAPTION__', html.escape(caption)).replace('__CARDS__', json.dumps(cards, ensure_ascii=False).replace('</', '<\\/')))
open(out, 'w').write(page)
print(len(page))
