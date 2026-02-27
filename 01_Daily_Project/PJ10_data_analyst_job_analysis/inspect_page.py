import asyncio
from playwright.async_api import async_playwright


async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(
            "https://www.jobkorea.co.kr/Search/?stext=데이터분석&tabType=recruit",
            wait_until="networkidle",
            timeout=30000,
        )
        await page.wait_for_timeout(3000)

        # li 요소들 확인
        li_info = await page.evaluate("""
            () => {
                const lis = document.querySelectorAll("li");
                return [...lis].slice(0, 30).map(li => ({
                    cls: li.className,
                    txt: li.innerText.slice(0, 120)
                }));
            }
        """)
        print("LI ELEMENTS:")
        for li in li_info:
            cls = li["cls"]
            txt = li["txt"].replace("\n", " ")
            print(f"  [{cls[:50]}] {txt[:100]}")

        # article, div[data-*] 등 확인
        articles = await page.evaluate("""
            () => {
                const items = document.querySelectorAll("article, [data-recruit-id], [data-job-id]");
                return [...items].slice(0, 10).map(el => ({
                    tag: el.tagName,
                    cls: el.className,
                    txt: el.innerText.slice(0, 150)
                }));
            }
        """)
        print("\nARTICLE / data-* ELEMENTS:")
        for a in articles:
            print(f"  <{a['tag']} class={a['cls'][:50]}> {a['txt'][:100].replace(chr(10), ' ')}")

        # 페이지 타이틀과 주요 텍스트
        title = await page.title()
        print(f"\nPage title: {title}")

        # 실제 채용공고처럼 보이는 텍스트 블록 찾기
        text_blocks = await page.evaluate("""
            () => {
                const divs = document.querySelectorAll("div, section");
                const results = [];
                divs.forEach(d => {
                    const txt = d.innerText;
                    if (txt && txt.length > 50 && txt.length < 300) {
                        const lines = txt.split("\\n").filter(l => l.trim());
                        if (lines.length >= 3) {
                            results.push({cls: d.className.slice(0, 60), txt: txt.slice(0, 200)});
                        }
                    }
                });
                return results.slice(0, 15);
            }
        """)
        print("\nTEXT BLOCKS (50-300 chars, 3+ lines):")
        for b in text_blocks:
            print(f"\n  [{b['cls']}]")
            print(f"  {b['txt'][:200].replace(chr(10), ' | ')}")

        await browser.close()


asyncio.run(inspect())
