import asyncio, os
from playwright.async_api import async_playwright
HEAD='''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang&family=Do+Hyeon&family=Noto+Sans+KR:wght@500;700&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#F1EEE8;color:#141414;font-family:'Noto Sans KR',sans-serif;overflow:hidden}
.card{width:1080px;height:1080px;padding:150px 108px 0;position:relative}
.kick{font-family:'Do Hyeon';font-size:25px;letter-spacing:3.5px;color:#9B1C24}
.h{font-family:'Gowun Batang';font-size:84px;line-height:1.28;margin-top:96px;letter-spacing:3px}
.h i,.r{color:#B3121D;font-style:italic}
.rule{width:70px;height:5px;background:#B3121D;margin-top:70px}
.body{font-weight:700;font-size:28px;line-height:1.75;margin-top:52px}
.body .r{font-family:'Noto Sans KR';font-weight:700}
.foot{position:absolute;left:96px;right:96px;bottom:150px;border-top:1px solid #CFCBC3;padding-top:30px;display:flex;justify-content:space-between;font-family:'Do Hyeon';font-size:21px;color:#8A867E;padding-left:12px;padding-right:12px}
.mute{color:#8A867E;font-weight:500}
</style></head><body>'''
N=5
def card(i,h,body,hsize=76):
    return f'''<div class="card"><div class="kick">GLASS COURT BLOG · SCIENCE OF SQUASH</div>
<div class="h" style="font-size:{hsize}px">{h}</div><div class="rule"></div><div class="body">{body}</div>
<div class="foot"><span>@glass_court &nbsp;·&nbsp; 전체 글은 블로그에서</span><span>{i:02d} / {N:02d}</span></div></div>'''
C=[
card(1,"공 하나 놓칠 때마다<br>머릿속에서는 이미<br><i>스스로를 채점하고 있습니다</i>",
 "해결책은 판단이 아니라 <span class='r'>관찰</span>입니다.<br>잘했다, 못했다 대신 '어땠지?'라고 물어보세요.",70),
card(2,"'백핸드가 안 좋네'가<br>쌓이고 쌓이면<br><i>꼬리표가 됩니다</i>",
 "'난 백핸드를 못 쳐'라는 꼬리표가 생기면,<br>공이 오기만 해도 몸이 <span class='r'>먼저</span> 굳습니다."),
card(3,"좋고 나쁨 말고<br><i>있는 그대로</i><br>보세요",
 "<span class='mute'>판단: \"또 드롭 망했네.\"</span><br>관찰: \"틴보다 <span class='r'>한 뼘 높게</span> 맞았다. 라켓면이 열렸다.\""),
card(4,"뇌는 평가가 아니라<br><i>차이</i>에서<br>배웁니다",
 "예상한 결과와 실제 결과의 차이 (How We Decide).<br>'못했다'로 덮으면 <span class='r'>배워야 할 그 차이</span>를 놓칩니다.",70),
card(5,"드롭 10개,<br>평가는 빼고<br><i>결과만 말하세요</i>",
 "\"높았다.\" \"짧았다.\" \"옆벽에 붙었다.\"<br>자책이 올라오면 한 마디만: <span class='r'>\"어땠지?\"</span>"),
]
async def main():
    os.makedirs('out_p2c',exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        pg=await b.new_page(viewport={'width':1080,'height':1080})
        for i,c in enumerate(C,1):
            await pg.set_content(HEAD+c+'</body></html>',wait_until='networkidle')
            await pg.evaluate("document.fonts.ready")
            await pg.screenshot(path=f'out_p2c/{i:02d}.png')
        await b.close()
asyncio.run(main())
