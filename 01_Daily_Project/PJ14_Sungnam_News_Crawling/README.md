# PJ14_Sungnam_News_Crawling

**(부제: 성남시 뉴스 크롤링 및 공공 문제 키워드 분석)**

> **"데이터로 성남시의 문제를 발굴하다"**
> 2년치 네이버 뉴스를 수집하고, 문제 지시어 필터링 + 토픽 모델링으로
> 성남시의 주요 공공 문제 키워드를 도출하여 다음 데이터 분석 프로젝트의 주제를 선정한다.

---

## 1. Project Overview

- **프로젝트명:** PJ14_Sungnam_News_Crawling
- **수행 기간:** 2026.04.05 ~ 2026.04.07

### 목표

1. 성남시 관련 네이버 뉴스 2년치(2024-04 ~ 2026-04) 크롤링
2. 문제 지시어 필터링 + BERTopic으로 주요 공공 문제 키워드 도출
3. Gemini AI를 통한 세부 주제 분류 및 이해관계자 분석
4. 도출된 인사이트를 바탕으로 차기 프로젝트(PJ15) 방향 결정

### 전체 파이프라인

```
[Phase 1] 크롤링 (naver_news_crawler.py)
    ↓ 날짜 구간 분할 수집 (1일 × 730구간) → 19,472건 수집 완료
[Phase 2] 분석 (PJ14_Sungnam_News_Crawling.ipynb)
    ↓ Step 1: 데이터 로드 및 전처리
    ↓ Step 2: 문제 지시어 필터링 → 3,190건 (전체의 16.6%)
    ↓ Step 3: 형태소 분석 (kiwipiepy NNG/NNP)
    ↓ Step 4: BERTopic 토픽 모델링
    ↓ Step 5: 정치 토픽 제외 → 시민 생활 토픽 선별
[Phase 3] AI 세부 분석 (PJ14_AI_Analysis.ipynb)
    ↓ Gemini API로 토픽 기사 전문 수집 + 세부 분류
[Phase 4] 인사이트 리포트 (PJ14_AI_Report_Analysis.ipynb)
    ↓ 문제 유형 분포, 이해관계자 네트워크, 주거 세부 분류
    ↓ PJ15 방향 확정
```

---

## 2. Tech Stack

| 분류 | 내용 |
|------|------|
| Language | Python 3.12 |
| 크롤링 | Selenium, BeautifulSoup4, curl_cffi, WebDriver Manager |
| 형태소 분석 | kiwipiepy (NNG/NNP 명사 추출) |
| 토픽 모델링 | BERTopic (`jhgan/ko-sroberta-multitask` + UMAP + HDBSCAN) |
| AI 분석 | pydantic-ai + Google Gemini API (`gemini-2.0-flash`) |
| 이해관계자 네트워크 | NetworkX |
| 저장 | csv (표준 라이브러리), utf-8-sig |
| 로깅 | logging (콘솔 + crawler.log 파일) |

---

## 3. Phase 1 — 크롤링 설계 및 개발 기록

### 3-1. 크롤링 대상 및 방식

- **대상:** 네이버 뉴스 검색 (`n.news.naver.com` 도메인 기사만)
- **검색 키워드:** 성남시
- **수집 필드:** 제목, 언론사, 날짜, 본문 첫 100자, 기사 링크

### 3-2. 네이버 뉴스 신규 UI 대응 (2026.04 기준)

개발 초기 기존 셀렉터(`a.news_tit`)가 작동하지 않음을 확인하고
현재 네이버 검색 결과 페이지의 DOM 구조를 직접 분석하여 새로운 셀렉터를 적용했다.

| 항목 | 구 셀렉터 | 신규 셀렉터 |
|------|----------|------------|
| 기사 컨테이너 | 없음 | `div[class*='fds-news-item']` 의 직접 자식 `div` |
| 기사 URL | `a.news_tit` | `a[href*='n.news.naver.com/mnews/article']` |
| 언론사 | `a.info.press` | `a[href*='media.naver.com/press/']` |
| 날짜 | `span.info` | `span[class*='sds-comps-text-type-body2']` + 날짜 정규식 |

### 3-3. 본문 추출

기사 개별 페이지 방문 후 다음 셀렉터 순서로 본문 추출:
`#dic_area` → `.newsct_article` → `#articeBody` → `#articleBodyContents`

### 3-4. 봇 탐지 우회

```python
--disable-blink-features=AutomationControlled
excludeSwitches: ["enable-automation"]
CDP: navigator.webdriver → undefined
--headless=new  (Chrome 112+ 신형 헤드리스)
```

### 3-5. 트러블슈팅 기록

| Issue | Problem | Fix |
|---|---|---|
| URL 인코딩 누락 | 한글 키워드 URL 삽입 실패 | `urllib.parse.quote(keyword)` |
| `finally` NameError | 드라이버 초기화 실패 시 quit() 호출 오류 | `driver = None` 초기화 후 가드 추가 |
| 언론사/날짜 오인식 | `"전" in t` 가 "전자신문"도 날짜로 인식 | 정규식으로 정밀 감지 |
| `so:r` 수집 편중 | 관련도순 → 최근 몇 주치만 수집 | `so:dd` 날짜 내림차순 변경 |
| 조기 종료 | 0건 페이지에서 종료 조건 오작동 | 0건 페이지는 `continue` 처리 |
| 1,000건 제한 | 2개월 구간 실수집 시 마지막 1~6일치만 수집 | 일별 구간(1일 × 730개)으로 재설계 |

### 3-6. 최종 크롤러 구조

```
generate_segments(interval_days=1)  ← 일 단위 구간 생성
crawl_segment()                     ← 단일 구간 수집
append_to_csv(write_header)         ← append 모드 즉시 저장
run_full_crawl()                    ← 구간마다 즉시 append (중간 저장)
```

---

## 4. Phase 2 — 분석 설계 및 실행 기록

### 4-1. 문제 지시어 필터링

```python
문제_지시어 = [
    "민원", "불만", "논란", "갈등", "문제", "부족", "부재",
    "위험", "사고", "미흡", "지연", "적체", "부담", "피해",
    "반발", "충돌", "오염", "결함", "위반", "방치"
]
```

**결과:** 19,472건 → **3,190건 (16.6%)**

시정 전반을 다루는 성남시 키워드 특성상 정상 수준이다.
사업 공고·행정 안내·문화 행사 등 중립/긍정 기사가 약 83%를 차지하므로
문제 지시어 기반 OR 필터 결과로 타당하다.

> **⚠️ 구조적 한계:** 자영업·상권 분석처럼 중립 기사도 필요한 경우 이 방식은 부적합하다.
> 해당 목적에는 전체 19,472건을 대상으로 하거나
> 별도 키워드("소상공인", "상권", "폐업")로 재크롤링이 필요하다. → PJ15 참고

### 4-2. 형태소 분석기 선택 — KoNLPy → kiwipiepy 교체

KoNLPy Okt는 Java JVM 의존으로 `JVMNotFoundException` 발생 → kiwipiepy로 교체.

| 항목 | KoNLPy Okt | kiwipiepy |
|------|-----------|-----------|
| Java 의존 | 필요 | 불필요 (C++ 기반) |
| 속도 | 느림 | 빠름 |
| 명사 추출 정확도 | 보통 | Okt 대비 우수 |

`token.tag in ("NNG", "NNP")` 조건으로 일반명사/고유명사만 추출.

### 4-3. BERTopic 파라미터 조정 기록

#### 1차 실행 — min_cluster_size=10, 55개 토픽

| 시각화 | 관찰 |
|---|---|
| 인터토픽 거리 맵 | 큰 원 안에 작은 원 중첩 → 토픽 간 실질 구분 없음 |
| 문서 클러스터 맵 | 수십 개 토픽이 한 덩어리로 뭉침 |
| 원인 | `min_cluster_size=10` 이 너무 작아 10건짜리 세부 이슈도 독립 토픽 분리 |

#### 2차 실행 — 파라미터 조정, 19개 토픽 (채택)

| 파라미터 | 1차 | 2차 (채택) |
|---|---|---|
| `min_cluster_size` | 10 | 30~50 |
| `min_samples` | 5 | 10~15 |
| `nr_topics` | `"auto"` | 목표 수 직접 지정 |
| `ngram_range` | `(1,1)` | `(1,2)` uni+bigram 혼합 |

2차 결과: 인터토픽 거리 맵 3개 독립 군집 분리, 히트맵 대각선 강조 명확, 오프다이어고널 0.3~0.5 수준 → 양호.
bigram 적용으로 "정자교 붕괴", "선도 지구" 등 복합 의미 키워드 명확히 추출됨.

#### BERTopic 파이프라인

```
[1] 텍스트 입력 (kiwipiepy 명사 추출 결과)
[2] 문장 임베딩 — jhgan/ko-sroberta-multitask → 768차원
[3] UMAP 차원 축소 → 5차원 (n_neighbors=15, metric=cosine)
[4] HDBSCAN 클러스터링 (밀도 기반, 군집 수 자동 결정)
[5] c-TF-IDF 키워드 추출 (토픽 내 빈출 + 타 토픽 희소)
[6] nr_topics 병합 → 최종 19개 토픽
```

### 4-4. 정치 토픽 제외 (Step 5)

- 불용어 추가 방식 기각: 55 → 8개로 토픽 붕괴
- **확정 방식:** `정치_제외_토픽` 수동 리스트 → `df_topics_시민` 생성

19개 토픽 기준 제외 대상:

| 토픽 | 내용 |
|---|---|
| 0 | 이재명/선거법 |
| 3 | 윤석열/항소 |
| 6 | 이상경/교통부 |
| 7 | 김현지/대통령실 |
| 13 | 김인호/산림청장 |
| 14 | 이예람중사 |
| 15 | 유출의혹 |
| 16 | 사랑상품권/중동 |
| 18 | 공직자범죄 |

→ **시민 생활 토픽 10개** (1, 2, 4, 5, 8, 9, 10, 11, 12, 17) 확보.

### 4-5. 대표 기사 조회 — `get_representative_docs()`

| 구분 | 키워드 문자열 검색 | `get_representative_docs()` |
|------|-----------------|---------------------------|
| 기반 | 키워드 포함 여부 | 임베딩 거리 기반 클러스터 할당 |
| 정확도 | 낮음 | 높음 |

`topic_model.topics_`(임베딩 기반)와 키워드 문자열 매칭은 독립적이다.
키워드가 본문에 없어도 임베딩 유사도로 해당 토픽에 배정될 수 있음.

### 4-6. URL 기준 중복 통과 문제

동일 기사가 복수 article ID(sid 다름)로 네이버에 등록 → 링크 기준 dedup 통과.

```python
df = df.drop_duplicates(subset=["title", "date", "press"]).reset_index(drop=True)
```

---

## 5. Phase 3 — AI 세부 분석 (`PJ14_AI_Analysis.ipynb`)

### 5-1. 분석 구조

토픽별 CSV → 기사 전문 재크롤링 (curl_cffi, 최대 3,000자) → Gemini 배치 분석 → 결과 CSV 저장

```python
class ArticleAnalysis(BaseModel):
    세부_주제: str            # 성남시 관점 15~30자, 명사형 종결
    관련_이해관계자: List[str]  # 실제 역할 주체, 최대 5개
    문제_유형: str            # 10개 카테고리 중 1개
    한_줄_요약: str           # 40자 이내
```

### 5-2. 프롬프트 설계 원칙 (Flash Lite 최적화)

경량 모델 특성상 조건 분기 최소화.

- 이해관계자: 결정권자·피해자·사업주체·민원집단만, 최대 5개, 언론사 제외
- 문제_유형: 설명 없이 카테고리 목록만 제시 (설명 추가 시 판단 혼란 유발)
- RPM 제한: `TARGET_RPM = 15` → `SLEEP_SEC = 60 / TARGET_RPM = 4.0초`

### 5-3. 주요 트러블슈팅

| 오류 | 원인 | 해결 |
|---|---|---|
| `.env` 로드 실패 | Jupyter CWD와 프로젝트 루트 불일치 | `_THIS_DIR` 자동 탐지 함수 + `override=True` |
| `Unknown keyword 'result_type'` | pydantic-ai 1.77 파라미터명 변경 | `result_type` → `output_type` |
| `.data` AttributeError | pydantic-ai 1.77 API 변경 | `.data` → `.output` |
| 전체 분석실패 캐싱 | 오류 결과가 체크포인트에 저장됨 | 체크포인트 파일 삭제 후 재실행 |

---

## 6. Phase 4 — 인사이트 리포트 (`PJ14_AI_Report_Analysis.ipynb`)

### 6-1. 문제 유형 분포 (topic_4, 278건)

| 문제_유형 | 건수 |
|---|---|
| 주거/부동산 | 205 (73%) |
| 교통 | 33 |
| 행정/정책 | 15 |
| 예산/재정 | 8 |
| 인프라/시설 | 7 |
| 복지/의료 | 5 |
| 안전 | 2 |
| 환경 | 2 |
| 기타 | 1 |

주거/부동산 73% 편중으로 세부 분류 추가.

### 6-2. 주거/부동산 세부 분류

| 주거_세부유형 | 건수 |
|---|---|
| 재건축/선도지구 | 108 |
| 기타 주거 | 54 |
| 부동산 시세 | 23 |
| 분양/청약 | 20 |

> **주의:** 주거 목적 편향 분류. 상가·자영업 분석에 간접 참고 시 인과 관계 부재에 주의.
> 재건축 → 상권 영향 논리는 연결 고리가 성립하나 데이터 직접 근거 없이 주장 시
> 인과 없는 상관 추론이 됨.

### 6-3. 이해관계자 공동출현 네트워크

`관련_이해관계자` 파싱 → 공동출현 빈도 집계 → NetworkX 그래프 (Top 20 노드).

### 6-4. 문제 지시어 필터링의 구조적 한계 확인

**발견 경위:** 팀 논의에서 분석 목적이 "자영업 분석용 데이터 수집"으로 변경.

```
19,472건 전체
    ↓ 문제 지시어 필터 (부정 기사만)
3,190건
    ↓ "상권 현황", "소상공인 매출" 등 중립 기사 대부분 제외됨
```

**결론:** 자영업 분석은 "소상공인", "자영업", "상권", "폐업", "창업" 키워드로 **별도 크롤링 → PJ15로 분리**.

---

## 7. 진행 현황

| 항목 | 상태 |
|------|------|
| 크롤러 개발 및 네이버 UI 대응 | ✅ 완료 |
| 일별 구간 + 중간 저장 재설계 | ✅ 완료 |
| 2년치 전체 수집 (19,472건) | ✅ 완료 |
| kiwipiepy 교체 | ✅ 완료 |
| BERTopic 1차 실행 (55개 토픽) | ✅ 완료 |
| BERTopic 파라미터 조정 재실행 (19개 토픽) | ✅ 완료 |
| 토픽 분류 품질 시각화 3종 | ✅ 완료 |
| 정치 토픽 제외 (Step 5) | ✅ 완료 |
| 토픽별 기사 CSV 추출 | ✅ 완료 |
| AI 세부 분석 노트북 구축 (PJ14_AI_Analysis.ipynb) | ✅ 완료 |
| Gemini API 배치 분석 실행 | ✅ 완료 |
| 인사이트 리포트 노트북 구축 (PJ14_AI_Report_Analysis.ipynb) | ✅ 완료 |
| 문제 유형 분포 + 시계열 시각화 | ✅ 완료 |
| 주거/부동산 세부 분류 | ✅ 완료 |
| 이해관계자 네트워크 분석 | ✅ 완료 |
| 문제 지시어 필터 한계 확인 및 PJ15 방향 결정 | ✅ 완료 |
| **PJ15 자영업 분석 별도 크롤링 착수** | 🔲 PJ15에서 진행 |

---

## 8. Project Structure

```
PJ14_Sungnam_News_Crawling/
├── naver_news_crawler.py                     # 크롤러 메인 코드
├── PJ14_Sungnam_News_Crawling.ipynb          # BERTopic 분석 노트북
├── PJ14_AI_Analysis.ipynb                    # Gemini AI 세부 분석 노트북
├── PJ14_AI_Report_Analysis.ipynb             # 인사이트 리포트 노트북
├── .env                                      # GEMINI_API_KEY (비공개)
├── crawler.log                               # 실행 로그
├── output/
│   ├── 성남시_news_{timestamp}.csv           # 전체 수집 데이터 (19,472건)
│   ├── topic_{번호}_articles.csv             # 토픽별 기사 추출 결과
│   ├── topic_{번호}_articles_ai_분석결과.csv  # AI 세부 분류 결과
│   ├── topic_{번호}_articles_checkpoint.json # AI 분석 체크포인트
│   └── report_*.png                          # 인사이트 시각화 이미지
└── README.md
```

---

*Created by gorhk | 최초 작성: 2026-04-05 | 최종 수정: 2026-04-07*
