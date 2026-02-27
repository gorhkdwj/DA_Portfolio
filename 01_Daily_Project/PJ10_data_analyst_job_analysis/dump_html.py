import asyncio
import sys
import os
from playwright.async_api import async_playwright

# Windows 인코딩 문제 해결
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


async def dump():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(
            "https://www.jobkorea.co.kr/Search/?stext=데이터분석&tabType=recruit",
            wait_until="networkidle",
            timeout=30000,
        )
        await page.wait_for_timeout(3000)

        # HTML 전체를 파일에 저장
        content = await page.content()
        with open("page_dump.html", "w", encoding="utf-8") as f:
            f.write(content)
        print(f"HTML saved: {len(content)} chars")

        # 네트워크 요청 중 API 콜 찾기
        # 페이지의 모든 a 태그 href 확인
        links = await page.evaluate("""
            () => {
                return [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('recruit') || h.includes('job') || h.includes('Recruit'))
                    .slice(0, 20);
            }
        """)
        print("\nJob-related links:")
        for link in links:
            print(" ", link)

        # 실제 보이는 텍스트 구조 확인 (innerText of body)
        body_text = await page.evaluate("() => document.body.innerText")
        with open("page_text.txt", "w", encoding="utf-8") as f:
            f.write(body_text)
        print(f"\nBody text saved: {len(body_text)} chars")
        print("\nFirst 1000 chars of body text:")
        print(body_text[:1000])

        await browser.close()


asyncio.run(dump())
