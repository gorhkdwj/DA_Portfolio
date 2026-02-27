"""
잡코리아 데이터분석 채용공고 상세 스크래퍼
- 기존 jobkorea_data_analyst.json 에서 링크를 읽어
- 각 공고 상세 페이지에서 스킬, 우대조건, 핵심역량 등을 추가 수집
"""

import asyncio
import csv
import json
import os
import sys
import time
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

INPUT_JSON = "jobkorea_data_analyst.json"
OUTPUT_CSV = "jobkorea_data_analyst_detail.csv"
OUTPUT_JSON = "jobkorea_data_analyst_detail.json"
CONCURRENCY = 3       # 동시에 열 탭 수
DELAY_SEC = 0.8       # 요청 사이 딜레이 (초)


def parse_detail(html: str) -> dict:
    """상세 페이지 HTML → 추가 정보 dict"""
    soup = BeautifulSoup(html, "lxml")
    result = {}

    def get_row(label: str) -> str:
        el = soup.find("span", string=label)
        if not el:
            return ""
        row = el.find_parent("div")
        if not row:
            return ""
        parts = [p for p in row.get_text(separator="|", strip=True).split("|") if p]
        # 레이블 자체 제거 후 나머지 합치기
        if parts and parts[0] == label:
            parts = parts[1:]
        return " / ".join(parts)

    # 스킬 (기술스택)
    result["스킬"] = get_row("스킬")

    # 핵심역량
    raw = get_row("핵심역량")
    result["핵심역량"] = raw.replace(" / ,", ",").replace(" / ", ", ")

    # 우대조건 전체 행
    result["우대_기본"] = get_row("기본우대")
    result["우대_자격증"] = get_row("자격증")
    result["우대_전공"] = get_row("우대전공")

    # 학력
    edu_el = soup.find("span", string="학력")
    if edu_el:
        row = edu_el.find_parent("div")
        if row:
            parts = [p for p in row.get_text(separator="|", strip=True).split("|") if p and p != "학력"]
            result["학력"] = " / ".join(parts)
    if "학력" not in result:
        result["학력"] = ""

    # 복리후생 (있으면)
    benefit_section = soup.find("span", string="복리후생")
    if benefit_section:
        row = benefit_section.find_parent("div")
        if row:
            # 복리후생은 좀 길 수 있으므로 제한
            result["복리후생"] = row.get_text(separator=", ", strip=True).replace("복리후생, ", "")[:200]
    if "복리후생" not in result:
        result["복리후생"] = ""

    return result


async def fetch_detail(context, url: str) -> dict:
    page = await context.new_page()
    try:
        await page.goto(url, wait_until="networkidle", timeout=25000)
        await page.wait_for_timeout(800)
        html = await page.content()
        return parse_detail(html)
    except Exception as e:
        print(f"  오류 ({url[-10:]}): {e}")
        return {}
    finally:
        await page.close()


async def process_batch(context, batch: list) -> list:
    tasks = [fetch_detail(context, job["링크"]) for job in batch]
    results = await asyncio.gather(*tasks)
    return results


async def scrape_details(jobs: list) -> list:
    enriched = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        total = len(jobs)
        for i in range(0, total, CONCURRENCY):
            batch = jobs[i : i + CONCURRENCY]
            batch_num = i // CONCURRENCY + 1
            total_batches = (total + CONCURRENCY - 1) // CONCURRENCY
            print(f"[{i+1}~{min(i+CONCURRENCY, total)}/{total}] 상세 페이지 수집 중...", flush=True)

            details = await process_batch(context, batch)

            for job, detail in zip(batch, details):
                merged = {**job, **detail}
                enriched.append(merged)
                if detail.get("스킬"):
                    print(f"  ✓ {job['회사명'][:15]}: 스킬=[{detail['스킬'][:50]}]")

            await asyncio.sleep(DELAY_SEC)

        await browser.close()

    return enriched


def save_results(jobs: list):
    fieldnames = [
        "회사명", "공고제목", "경력", "학력", "지역", "직종", "급여",
        "스킬", "핵심역량", "우대_기본", "우대_자격증", "우대_전공",
        "복리후생", "마감일", "등록일", "링크"
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(jobs)
    print(f"\nCSV 저장 완료: {OUTPUT_CSV}")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    print(f"JSON 저장 완료: {OUTPUT_JSON}")


def print_preview(jobs: list, n: int = 5):
    print(f"\n{'='*65}")
    print(f" 상세 수집 결과 미리보기 (상위 {n}개)")
    print(f"{'='*65}")
    for i, job in enumerate(jobs[:n], 1):
        print(f"\n[{i}] {job.get('회사명', '')} - {job.get('공고제목', '')[:40]}")
        print(f"    경력: {job.get('경력', '')} | 지역: {job.get('지역', '')}")
        print(f"    스킬: {job.get('스킬', '없음')[:80]}")
        print(f"    우대: {job.get('우대_기본', '없음')[:80]}")
        print(f"    역량: {job.get('핵심역량', '없음')[:60]}")


if __name__ == "__main__":
    with open(INPUT_JSON, encoding="utf-8") as f:
        jobs = json.load(f)

    print(f"총 {len(jobs)}개 공고의 상세 정보 수집 시작...")
    print(f"(동시 {CONCURRENCY}개 탭, 배치 간 {DELAY_SEC}초 딜레이)\n")

    start = time.time()
    enriched = asyncio.run(scrape_details(jobs))
    elapsed = time.time() - start

    print(f"\n완료! 소요시간: {elapsed:.0f}초")
    save_results(enriched)
    print_preview(enriched)
