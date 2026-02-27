import asyncio
import sys
import os
from playwright.async_api import async_playwright

os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8")

SAMPLE_URL = "https://www.jobkorea.co.kr/Recruit/GI_Read/48669860"


async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(SAMPLE_URL, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        html = await page.content()
        with open("detail_dump.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"HTML saved: {len(html)} chars")

        # 페이지 텍스트 전체
        body = await page.evaluate("() => document.body.innerText")
        with open("detail_text.txt", "w", encoding="utf-8") as f:
            f.write(body)
        print(f"Text saved: {len(body)} chars")
        print("\n--- Body text (first 3000 chars) ---")
        print(body[:3000])

        await browser.close()


asyncio.run(inspect())
