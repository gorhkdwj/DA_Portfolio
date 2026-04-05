# 📂 PJ13_AI_Agent_EDA_Pipeline

**(부제: CSV 파일 경로 하나로 완전한 EDA 리포트를 자동 생성하는 AI 에이전트 파이프라인)**

> **"분석가의 반복 작업을 AI에게 위임하라."**
> 매 프로젝트마다 반복되는 EDA 초기 작업을 자동화하기 위해, **PydanticAI + Google Gemini** 기반으로 구축한 범용 탐색적 데이터 분석 자동화 파이프라인입니다.

---

## 1. Project Overview

* **프로젝트 명:** PJ13_AI_Agent_EDA_Pipeline
* **수행 기간:** 2026.04.03 (1일)

### 💼 가상 시나리오 (Scenario)

> **"새 프로젝트를 받을 때마다 반복되는 EDA, 이제는 자동화할 때가 됐다."**
>
> 당신은 데이터 분석가입니다. 새로운 데이터셋을 받을 때마다 결측치 확인, 이상치 탐지, 분포 시각화, 상관관계 분석 등 동일한 EDA 작업을 수작업으로 반복해왔습니다.
>
> 팀장님은 **"다음 주부터 3개의 신규 데이터셋을 분석해야 하는데, EDA 초안을 하루 안에 만들 수 있겠어?"** 라고 요청합니다. 당신의 임무는 어떤 CSV/JSON/Excel 파일이든 경로 하나만 입력하면 구조화된 EDA 리포트를 자동 생성하는 AI 에이전트 파이프라인을 구축하는 것입니다.

* **목표:**
  1. PydanticAI 프레임워크를 활용한 Tool 기반 AI 에이전트 설계 및 구현
  2. 어떤 표 형태 데이터(.csv / .json / .xlsx)에도 동작하는 범용 EDA 자동화 구현
  3. Pydantic 스키마 기반 구조화 리포트(JSON) 자동 생성 및 저장

---

## 2. Tech Stack & Concepts

* **Language & Library:** Python 3.12, PydanticAI, Google Gemini API (`google-gla`), pandas, matplotlib, seaborn, Pydantic v2, python-dotenv

* **AI Agent (Tool Use Pattern):**
  * LLM이 직접 분석하는 것이 아니라, **Tool 함수(pandas 기반)**를 호출하여 실제 수치를 계산하고 그 결과를 바탕으로 인사이트를 생성
  * 에이전트가 어떤 Tool을 어떤 순서로 호출할지 자율적으로 판단 (`@agent.tool` 데코레이터)

* **Structured Output (Pydantic BaseModel):**
  * `output_type=EDAReport`로 에이전트 출력을 자유 텍스트가 아닌 **고정 스키마 JSON 객체**로 강제
  * `DataOverview`, `MissingInfo`, `OutlierInfo`, `CorrelationHighlight`, `KeyInsight` 5개 중첩 모델로 구성

* **Dependency Injection (`deps_type`):**
  * `DataDeps(df, dataset_name)` dataclass를 통해 에이전트 실행 시 데이터프레임을 안전하게 주입
  * Tool 함수 내부에서 `ctx.deps.df`로 접근하여 외부 상태 없이 순수 함수 형태 유지

---

## 3. Implementation Details

데이터 로드 → Tool 실행 → 구조화 리포트 생성 → JSON 저장 → 정확도 검증의 5단계 파이프라인입니다.

### Step 1: 범용 데이터 로더

파일 확장자(`.csv` / `.json` / `.xlsx`)를 자동 감지하여 `pd.DataFrame`으로 로드합니다.

* **인코딩 자동 감지:** UTF-8 실패 시 CP949(한글 Windows 기본 인코딩)로 재시도
* **Date 인덱스 처리:** `DATE_COLUMN` 설정 시 `pd.to_datetime()` 변환 후 인덱스로 설정
* **사용자 설정 최소화:** `FILE_PATH`, `DATASET_NAME` 두 변수만 변경하면 동작

### Step 2: Tool 함수 5종 (pandas 기반)

모든 함수는 `pd.DataFrame`을 인수로 받아 어떤 데이터에도 동작합니다.

| Tool 함수 | 기능 | 핵심 로직 |
|-----------|------|-----------|
| `describe_data` | 기본 통계량 요약 | `df.describe()`, 수치형/범주형 분리 |
| `check_missing` | 결측치 현황 분석 | `df.isnull().sum() / len(df)` (0~1 비율 반환) |
| `detect_outliers_all` | IQR 기반 이상치 일괄 탐지 | `Q1 - 1.5*IQR`, `Q3 + 1.5*IQR` 경계 계산 |
| `correlation_top` | 상위 상관관계 추출 | `df.corr()` 후 절댓값 기준 정렬 |
| `visualize_summary` | 분포 시각화 (최대 6개) | 히스토그램 + 평균선 서브플롯 |

### Step 3: EDA 에이전트 구성

```python
agent = Agent(
    model="google-gla:gemini-3.1-flash-lite-preview",
    deps_type=DataDeps,
    output_type=EDAReport,
    system_prompt="모든 Tool을 실행한 뒤 실제 수치를 기반으로 EDAReport를 채우십시오..."
)
```

에이전트는 시스템 프롬프트에 따라 Tool 호출 순서를 자율 결정하며, 실행 결과를 종합하여 `EDAReport` 스키마를 완성합니다.

### Step 4: 구조화 리포트 스키마

```
EDAReport
├── overview: DataOverview          # 행/열 수, 컬럼 목록, 총 결측 셀
├── missing_analysis: [MissingInfo] # 컬럼별 결측치 개수·비율·권장사항
├── outlier_analysis: [OutlierInfo] # IQR 경계, 이상치 수·비율·권장사항
├── correlation_highlights: [...]   # 상위 상관관계 쌍 + 해석
├── key_insights: [KeyInsight]      # 핵심 인사이트 (우선순위 포함)
└── next_steps: [str]               # 권장 후속 작업 목록
```

### Step 5: 정확도 검증

에이전트 출력값을 pandas로 직접 계산한 실측값과 비교하여 신뢰도를 확인합니다.

---

## 4. Troubleshooting

### Issue 1: `GeminiModel.__init__()` got an unexpected keyword argument `api_key`

* **Problem:** `GeminiModel(model_name="...", api_key=api_key)` 형태로 초기화 시 `TypeError` 발생
* **Cause:** `pydantic-ai` 최신 버전에서 `GeminiModel` 생성자의 `api_key` 인수가 제거됨
* **Fix:** `GeminiModel` 클래스 대신 `"google-gla:{모델명}"` 문자열 방식으로 변경. `load_dotenv(override=True)` 후 환경변수 `GEMINI_API_KEY`를 에이전트가 자동으로 참조
* **Insight:** pydantic-ai는 빠르게 업데이트되는 라이브러리이므로 클래스 생성자보다 문자열 기반 모델 지정이 더 안정적

### Issue 2: `UserError: Unknown keyword arguments: result_type`

* **Problem:** `Agent(result_type=EDAReport)` 초기화 시 `UserError` 발생
* **Cause:** `pydantic-ai` 업데이트로 `result_type` → `output_type`으로 파라미터명 변경
* **Fix:** `Agent(output_type=EDAReport)` 으로 수정

### Issue 3: 결측치·이상치 비율이 `0.8%` 등 비정상 표기

* **Problem:** Cabin 결측치 231개(실제 77%)가 `0.8%`로 출력됨
* **Cause:** 스키마 `description="결측 비율 (0~100)"`에도 불구하고 LLM이 0~1 소수로 값을 채움. 출력 포맷 `:.1f%`가 소수에 `%` 기호만 붙여 `0.8%`로 표기
* **Fix:** 스키마 description을 `"결측 비율 (0.0~1.0)"`으로 변경하고, 출력 포맷을 `:.1%`로 통일 (Python이 자동으로 ×100 처리)

### Issue 4: `ModelHTTPError: status_code 429` (할당량 초과)

* **Problem:** API 호출 시 `RESOURCE_EXHAUSTED` 오류, `limit: 0`
* **Cause:** AI Studio 무료 티어의 일일 할당량 소진 또는 API 키 만료
* **Fix:** API 키 재발급 후 `.env` 업데이트. `load_dotenv(override=True)` 사용으로 커널 재시작 없이 새 키 적용

---

## 5. Retrospective & Insights

### Domain Knowledge

단순한 EDA 코드 작성을 넘어, **AI 에이전트가 실제 업무에서 어떤 역할을 해야 하는지** 설계 관점을 익혔습니다. LLM은 판단과 해석을, pandas Tool은 정확한 수치 계산을 담당하는 역할 분리가 핵심이었습니다.

### Tech Insight

* **PydanticAI의 Tool Use 패턴:** `@agent.tool` 데코레이터와 `RunContext[DataDeps]`를 통한 의존성 주입 설계를 실습
* **Structured Output:** `output_type`으로 LLM 출력을 Pydantic 모델로 강제하면 후처리 파싱이 불필요하고, JSON 저장·복원이 `model_dump()` / `model_validate()`로 단순화됨
* **LLM 특성 이해:** 스키마 description의 단위 표기(0~1 vs 0~100)가 LLM 출력에 직접 영향을 미침. 프롬프트 엔지니어링이 코드 수준에서 필요함

### Data Integrity / Architecture

`FILE_PATH`와 `DATASET_NAME` 두 변수만 변경하면 어떤 파일에도 동작하는 **설정-실행 분리 구조**를 적용했습니다. 정확도 검증 섹션을 통해 AI 에이전트의 신뢰도를 객관적으로 측정할 수 있는 구조를 설계했습니다.

---

## 6. Future Work

* **비동기 병렬화:** 다수 컬럼의 이상치 탐지를 `asyncio.gather()`로 병렬 실행하여 처리 속도 개선
* **Streamlit 연동:** 웹 UI에서 파일 업로드 → 자동 EDA 리포트 출력 및 다운로드 기능 구현
* **다중 파일 배치 처리:** 여러 CSV를 한 번에 입력받아 비교 리포트 생성
* **시각화 저장:** matplotlib 차트를 Base64 또는 PNG로 자동 저장하여 리포트에 포함

---

## 7. Project Structure

```
PJ13_AI_Agent_EDA_Pipeline/
├── EDA_자동화_파이프라인.ipynb   # 메인 파이프라인 (범용 EDA 자동화 도구)
├── .env                          # API 키 (git 제외)
├── data/
│   ├── prices.csv                # 금융 자산 가격 데이터 (테스트용)
│   ├── sample_data.csv           # 타이타닉 유사 샘플 데이터 (테스트용)
│   └── eda_report_*.json         # 자동 생성된 EDA 리포트 (실행 결과)
└── README.md                     # 프로젝트 문서
```

### 학습 과정 (07_AI_Study/02_DA_Agent/)

| 노트북 | 주제 | 핵심 학습 내용 |
|--------|------|----------------|
| 01 | 에이전트 기본구성 | PydanticAI + Gemini 연결, 멀티턴 대화 |
| 02 | 데이터분석 도구정의 | Tool 함수 5종 구현 및 에이전트 등록 |
| 03 | EDA 자동화 파이프라인 | 자율 Tool 선택 및 호출 로그 추적 |
| 04 | 구조화 리포트 생성 | Pydantic 스키마 기반 JSON 리포트 생성 |
| 05 | 종합 실험 | 실제 데이터 적용 및 품질 평가 |
| 06 | **EDA 자동화 파이프라인** | **최종 범용 실무 적용 버전** |

---

*Created by gorhk · 2026.04.03*
