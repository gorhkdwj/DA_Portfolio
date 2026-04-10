import csv
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# ---------------------------------------------------------------------------
# 로깅 설정
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            Path(__file__).parent / "crawler.log", encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 상수
# ---------------------------------------------------------------------------
FIELDNAMES = [
    "keyword", "title", "press",
    "date", "date_str",
    "link", "body_preview", "crawled_at",
]
BODY_SELECTORS = [
    "#dic_area",
    ".newsct_article",
    "#articeBody",
    "#articleBodyContents",
]

# 수집 전체 기간 (2년)
CRAWL_START = datetime(2024, 4, 5)
CRAWL_END   = datetime(2026, 4, 5)


# ---------------------------------------------------------------------------
# 날짜 구간 생성
# ---------------------------------------------------------------------------
def _add_months(dt: datetime, months: int) -> datetime:
    """월 단위 덧셈 (월말 처리 포함)."""
    month = dt.month - 1 + months
    year  = dt.year + month // 12
    month = month % 12 + 1
    days_in_month = [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0))
                     else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return datetime(year, month, min(dt.day, days_in_month[month - 1]))


def _next_date(cur: datetime, interval_size: int, interval_unit: str) -> datetime:
    """interval_unit에 따라 다음 날짜 계산.
    interval_unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
    """
    if interval_unit == "days":
        return cur + timedelta(days=interval_size)
    if interval_unit == "weeks":
        return cur + timedelta(weeks=interval_size)
    if interval_unit == "months":
        return _add_months(cur, interval_size)
    if interval_unit == "quarters":
        return _add_months(cur, interval_size * 3)
    if interval_unit == "years":
        return _add_months(cur, interval_size * 12)
    raise ValueError(f"지원하지 않는 interval_unit: '{interval_unit}' "
                     f"(days / weeks / months / quarters / years)")


def generate_segments(
    start: datetime = CRAWL_START,
    end: datetime   = CRAWL_END,
    interval_size: int = 1,
    interval_unit: str = "days",
) -> list[tuple[datetime, datetime]]:
    """날짜 구간 리스트 반환.
    interval_unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
    """
    segments: list[tuple[datetime, datetime]] = []
    cur = start
    while cur < end:
        nxt = _next_date(cur, interval_size, interval_unit)
        if nxt > end:
            nxt = end
        segments.append((cur, nxt))
        cur = nxt
    return segments


# ---------------------------------------------------------------------------
# 드라이버 초기화
# ---------------------------------------------------------------------------
def init_driver() -> webdriver.Chrome:  # type: ignore[return]
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"},
    )
    driver.implicitly_wait(5)
    return driver


# ---------------------------------------------------------------------------
# URL 생성
# ---------------------------------------------------------------------------
def build_search_url(
    keyword: str,
    page: int,
    start_date: datetime,
    end_date: datetime,
) -> str:
    start = 1 + (page - 1) * 10
    s = start_date.strftime("%Y%m%d")
    e = end_date.strftime("%Y%m%d")
    return (
        "https://search.naver.com/search.naver"
        f"?where=news&query={quote(keyword)}"
        f"&nso=so:dd,p:from{s}to{e}&start={start}"
    )


# ---------------------------------------------------------------------------
# 날짜 파싱
# ---------------------------------------------------------------------------
def parse_date(date_str: str) -> datetime | None:
    now = datetime.now()
    s = date_str.strip()

    # 절대 날짜: "2024.03.15." 또는 "2024.03.15"
    m = re.match(r"(\d{4})\.(\d{2})\.(\d{2})\.?$", s)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None

    # 절대 날짜 (연.월): "2024.03."
    m = re.match(r"(\d{4})\.(\d{2})\.?$", s)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), 1)
        except ValueError:
            return None

    if s == "방금 전":
        return now

    m = re.match(r"(\d+)분\s*전", s)
    if m:
        return now - timedelta(minutes=int(m.group(1)))

    m = re.match(r"(\d+)시간\s*전", s)
    if m:
        return now - timedelta(hours=int(m.group(1)))

    m = re.match(r"(\d+)일\s*전", s)
    if m:
        return now - timedelta(days=int(m.group(1)))

    m = re.match(r"(\d+)주\s*전", s)
    if m:
        return now - timedelta(weeks=int(m.group(1)))

    m = re.match(r"(\d+)개월\s*전", s)
    if m:
        return now - timedelta(days=int(m.group(1)) * 30)

    logger.warning(f"날짜 파싱 실패: '{s}'")
    return None


# ---------------------------------------------------------------------------
# 검색 결과 페이지 파싱
# ---------------------------------------------------------------------------
def parse_search_page(soup: BeautifulSoup) -> list[dict]:
    items = []

    container = soup.select_one("div[class*='fds-news-item']")
    if not container:
        return items

    for unit in container.find_all("div", recursive=False):
        article_a = unit.select_one("a[href*='n.news.naver.com/mnews/article']")
        if not article_a:
            continue
        link = str(article_a.get("href", ""))

        title_text = ""
        for a in unit.select("a[href]"):
            href = str(a.get("href", ""))
            text = a.get_text(strip=True)
            if (len(text) > 15
                    and "naver.com" not in href
                    and "keep" not in href.lower()):
                title_text = text
                break

        date_str = ""
        DATE_PATTERN = re.compile(r"\d+\s*(분|시간|일|주|개월)\s*전|\d{4}\.\d{2}")
        for span in unit.select("span[class*='sds-comps-text-type-body2']"):
            t = span.get_text(strip=True)
            if DATE_PATTERN.search(t):
                date_str = t
                break

        press_text = ""
        for a in unit.select("a[href*='media.naver.com/press/']"):
            t = a.get_text(strip=True)
            if t:
                press_text = t
                break

        parsed_dt = parse_date(date_str) if date_str else None
        date_formatted = parsed_dt.strftime("%Y-%m-%d") if parsed_dt else ""

        items.append(
            {
                "title": title_text,
                "press": press_text,
                "date": date_formatted,
                "date_str": date_str,
                "link": link,
                "_dt": parsed_dt,
            }
        )

    return items


# ---------------------------------------------------------------------------
# 기사 본문 첫 100자 추출
# ---------------------------------------------------------------------------
def get_article_body(driver: webdriver.Chrome, url: str) -> str:  # type: ignore[misc]
    try:
        driver.get(url)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        for selector in BODY_SELECTORS:
            el = soup.select_one(selector)
            if el:
                return el.get_text(separator=" ", strip=True)[:100]
        logger.warning(f"본문 셀렉터 미발견: {url}")
    except Exception as e:
        logger.error(f"본문 추출 실패 ({url}): {e}")
    return ""


# ---------------------------------------------------------------------------
# CSV 저장 (구간별 append)
# ---------------------------------------------------------------------------
def append_to_csv(items: list[dict], filepath: Path, write_header: bool = False) -> None:
    with open(filepath, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        if write_header:
            writer.writeheader()
        writer.writerows(items)


# ---------------------------------------------------------------------------
# 단일 구간 크롤러
# ---------------------------------------------------------------------------
def crawl_segment(
    driver: webdriver.Chrome,  # type: ignore[misc]
    keyword: str,
    start_date: datetime,
    end_date: datetime,
) -> list[dict]:
    """단일 날짜 구간 크롤링. 드라이버는 외부에서 주입."""
    logger.info(
        f"  구간 수집 시작: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}"
    )
    items: list[dict] = []
    crawled_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    page = 1

    while True:
        url = build_search_url(keyword, page, start_date, end_date)
        logger.info(f"    페이지 {page} 수집 중... ({url})")
        driver.get(url)

        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div[class*='fds-news-item']")
                )
            )
        except Exception:
            logger.info(f"    페이지 {page}: 검색 결과 소진. 구간 수집 종료.")
            break

        soup = BeautifulSoup(driver.page_source, "html.parser")
        page_items = parse_search_page(soup)

        if not page_items:
            logger.info(f"    페이지 {page}: 네이버뉴스 기사 없음 (외부 언론사 페이지). 건너뜀.")
            page += 1
            continue

        for item in page_items:
            item["body_preview"] = get_article_body(driver, item["link"])
            item["keyword"] = keyword
            item["crawled_at"] = crawled_at

        items.extend(page_items)
        logger.info(f"    -> {len(page_items)}건 수집 (구간 누적: {len(items)}건)")
        page += 1

    logger.info(
        f"  구간 완료: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')} "
        f"총 {len(items)}건"
    )
    return items


# ---------------------------------------------------------------------------
# 전체 크롤러 (순차 실행 + 구간별 중간 저장)
# ---------------------------------------------------------------------------
def run_full_crawl(
    keyword: str = "성남시",
    start: datetime = CRAWL_START,
    end: datetime = CRAWL_END,
    interval_size: int = 1,
    interval_unit: str = "days",
) -> int:
    segments = generate_segments(
        start=start, end=end,
        interval_size=interval_size, interval_unit=interval_unit,
    )

    # 출력 파일 경로 미리 확정 (전체 실행에 걸쳐 단일 파일 사용)
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = output_dir / f"{keyword}_news_{timestamp}.csv"

    # 헤더 먼저 기록
    append_to_csv([], filepath, write_header=True)

    logger.info(
        f"[{keyword}] 전체 크롤링 시작 — "
        f"{start.strftime('%Y-%m-%d')} ~ {end.strftime('%Y-%m-%d')}, "
        f"구간 {interval_size}{interval_unit} 단위, 총 {len(segments)}개 구간 | 저장 경로: {filepath}"
    )

    driver = None
    total_count = 0
    seen_links: set[str] = set()

    try:
        driver = init_driver()

        for idx, (seg_start, seg_end) in enumerate(segments, start=1):
            logger.info(
                f"[구간 {idx}/{len(segments)}] {seg_start.strftime('%Y-%m-%d')}"
            )
            seg_items = crawl_segment(driver, keyword, seg_start, seg_end)

            # 중복 제거 후 즉시 파일에 저장
            new_items = [it for it in seg_items if it["link"] not in seen_links]
            for it in new_items:
                seen_links.add(it["link"])

            if new_items:
                append_to_csv(new_items, filepath)
                total_count += len(new_items)

            logger.info(
                f"[구간 {idx}/{len(segments)}] +{len(new_items)}건 저장 "
                f"(누적: {total_count}건)"
            )

    except Exception as e:
        logger.error(f"크롤링 중 예외 발생: {e}")
    finally:
        if driver is not None:
            driver.quit()
            logger.info("드라이버 종료 완료.")

    logger.info(f"전체 크롤링 완료. 최종 {total_count}건 수집 → {filepath}")
    return total_count


# ---------------------------------------------------------------------------
# 진입점
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    run_full_crawl(
        keyword="성남시",
        start=datetime(2024, 4, 5),
        end=datetime(2026, 4, 5),
        interval_size=1,
        interval_unit="days",
    )
