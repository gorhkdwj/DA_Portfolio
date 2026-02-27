"""
잡코리아 데이터분석 직무 채용공고 스크래퍼
"""

import asyncio
import csv
import json
import os
import re
import sys
from datetime import datetime

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


SEARCH_KEYWORD = "데이터분석"
MAX_PAGES = 10
OUTPUT_CSV = "jobkorea_data_analyst.csv"
OUTPUT_JSON = "jobkorea_data_analyst.json"


def parse_card(card):
    """CardJob HTML 요소에서 채용 정보 추출"""
    job = {}

    # 공고 링크 + 제목 (두 번째 GI_Read 링크가 제목)
    links = card.find_all("a", href=re.compile(r"GI_Read"))
    if len(links) >= 2:
        job["공고제목"] = links[1].get_text(strip=True)
        job["링크"] = links[1]["href"].split("?")[0]  # 쿼리스트링 제거
    elif links:
        job["공고제목"] = links[0].get_text(strip=True)
        job["링크"] = links[0]["href"].split("?")[0]
    else:
        return None

    # 회사명 (세 번째 GI_Read 링크)
    if len(links) >= 3:
        job["회사명"] = links[2].get_text(strip=True)
    else:
        job["회사명"] = ""

    # 나머지 텍스트에서 정보 추출
    full_text = card.get_text(separator="|", strip=True)
    parts = [p for p in full_text.split("|") if p and p != "•" and p != "스크랩"]

    # 경력 (예: 경력4년↑, 경력무관, 신입)
    career = next((p for p in parts if re.search(r"경력|신입", p)), "")
    job["경력"] = career

    # GrayChip 컴포넌트에서 지역/직종 추출
    chips = [el.get_text(strip=True) for el in card.find_all(attrs={"data-sentry-component": "GrayChip"})]
    job["지역"] = chips[0] if len(chips) > 0 else ""
    job["직종"] = chips[1] if len(chips) > 1 else ""

    # 마감일
    deadline = next((p for p in parts if re.search(r"마감|상시|채용시", p)), "")
    job["마감일"] = deadline

    # 등록일
    reg_date = next((p for p in parts if re.search(r"전 등록|시간 전|일 전|방금", p)), "")
    job["등록일"] = reg_date

    # 급여 (있을 경우)
    salary = next((p for p in parts if re.search(r"만원|억|연봉|월급", p)), "")
    job["급여"] = salary

    return job


async def scrape_page(page, page_num):
    """단일 페이지 스크래핑"""
    url = (
        f"https://www.jobkorea.co.kr/Search/"
        f"?stext={SEARCH_KEYWORD}&tabType=recruit&Page_No={page_num}"
    )
    await page.goto(url, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(1500)

    html = await page.content()
    soup = BeautifulSoup(html, "lxml")
    cards = soup.find_all(attrs={"data-sentry-component": "CardJob"})
    return cards


async def scrape_jobkorea():
    jobs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for page_num in range(1, MAX_PAGES + 1):
            print(f"[{page_num}/{MAX_PAGES}] 페이지 수집 중...", flush=True)
            try:
                cards = await scrape_page(page, page_num)
            except Exception as e:
                print(f"  오류: {e}")
                break

            if not cards:
                print("  더 이상 공고가 없습니다.")
                break

            page_jobs = []
            for card in cards:
                job = parse_card(card)
                if job:
                    page_jobs.append(job)

            jobs.extend(page_jobs)
            print(f"  → {len(page_jobs)}개 공고 수집 (누적 {len(jobs)}개)")

        await browser.close()

    return jobs


def save_results(jobs):
    if not jobs:
        print("저장할 데이터가 없습니다.")
        return

    # CSV 저장
    fieldnames = ["회사명", "공고제목", "경력", "지역", "직종", "급여", "마감일", "등록일", "링크"]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(jobs)
    print(f"\nCSV 저장 완료: {OUTPUT_CSV}")

    # JSON 저장
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    print(f"JSON 저장 완료: {OUTPUT_JSON}")


def print_preview(jobs, n=10):
    print(f"\n{'='*60}")
    print(f" 수집 결과 미리보기 (상위 {n}개)")
    print(f"{'='*60}")
    for i, job in enumerate(jobs[:n], 1):
        print(f"\n[{i}] {job['회사명']}")
        print(f"    제목: {job['공고제목']}")
        print(f"    경력: {job['경력']} | 지역: {job['지역']}")
        if job.get('급여'):
            print(f"    급여: {job['급여']}")
        print(f"    마감: {job['마감일']} | {job['등록일']}")
        print(f"    링크: {job['링크']}")


if __name__ == "__main__":
    print("=" * 60)
    print(f"  잡코리아 '{SEARCH_KEYWORD}' 채용공고 수집기")
    print(f"  시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    jobs = asyncio.run(scrape_jobkorea())

    print(f"\n총 {len(jobs)}개 공고 수집 완료!")

    save_results(jobs)
    print_preview(jobs)
