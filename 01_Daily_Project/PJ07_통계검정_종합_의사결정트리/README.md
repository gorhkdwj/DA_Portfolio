# � 통계 분석 종합 의사결정 트리 (Statistical Test Decision Tree)

**(부제: 올바른 통계 검정 기법을 찾아주는 인터랙티브 가이드)**

> **"데이터는 준비되었는데, 어떤 분석을 해야 할지 모르겠다면?"**
> 복잡한 통계 기법 선택 과정을 **직관적인 질문과 답변(Step-by-Step)** 형태로 풀어낸 웹 애플리케이션입니다.

- 사용 도구: VSCode(Google Antigravity) - 큰 틀은 Claude Opus 4.6, 세부 내용들은 Gemini 3 모델 활용.

---

## 1. Project Overview

데이터 분석 프로젝트에서 가장 난관인 **"적절한 통계 검정 방법 선택"**을 돕기 위해 개발되었습니다. 분석 목적, 변수 유형, 데이터 분포(정규성 등)에 따라 최적의 통계 기법을 추천하고, 바로 사용할 수 있는 **Python 코드 예제**까지 제공합니다.

- **수행 기간:** 2026.02.10 (1일)
- **배포 URL:** [GitHub Pages Link](https://gorhkdwj.github.io/DA_Portfolio/01_Daily_Project/PJ07_통계검정_종합_의사결정트리/index.html)

### 🎯 핵심 목표

1. **정확한 기법 선정:** 정규성, 등분산성, 표본 크기 등 통계적 가정(Assumption)을 고려한 정밀한 가이드 제공.
2. **직관적 UX:** 어려운 통계 용어 대신, 예시와 아이콘을 활용하여 누구나 쉽게 따라갈 수 있는 UI 구성.
3. **실무 적용성:** `scipy.stats`, `statsmodels` 등 실제 Python 라이브러리 활용 코드 즉시 제공.

---

## 2. Key Features & Decision Logic

이 프로젝트는 크게 **4가지 분석 목적**에 따라 20여 종 이상의 통계 기법을 분류합니다.

### ⓵ 단일 표본 (Single Sample)

- **목적:** 하나의 집단이 특정 기준값과 차이가 있는지 확인.
- **주요 로직:**
  - 연속형: 정규성 만족 시 `One-Sample t-test`, 불만족 시 `Wilcoxon Signed-Rank`.
  - 비율형: 표본 수에 따라 `z-test` 또는 `Binomial Test`.
  - 범주형: `Chi-square Goodness of Fit`.

### ⓶ 집단 비교 (Group Comparison)

- **목적:** 두 개 이상의 집단 간 차이 비교 (A/B 테스트 등).
- **주요 로직:**
  - **집단 수 & 대응 여부:** 2집단(Independent/Paired) vs 3집단 이상(ANOVA 등).
  - **가정 검정:** 정규성(Shapiro-Wilk) 및 등분산성(Levene) 결과에 따른 분기.
  - **비모수 검정:** `Mann-Whitney U`, `Kruskal-Wallis`, `Friedman Test` 등 포함.
  - **사후 검정:** `Tukey HSD`, `Games-Howell`, `Dunn Test` 등 안내.

### ⓷ 범주형 분석 (Categorical Analysis)

- **목적:** 범주형 변수 간의 빈도 차이 및 연관성(독립성) 분석.
- **주요 로직:**
  - **교차표 크기:** 2x2 vs RxC.
  - **기대 빈도 이슈:** `Fisher's Exact Test` 및 `Fisher-Freeman-Halton` (Monte Carlo) 자동 추천.
  - **대응 표본:** `McNemar`(2시점), `Cochran's Q`(3시점 이상) 등.

### ⓸ 관계 분석 (Relationship Analysis)

- **목적:** 변수 간의 상관성 파악 또는 수치 예측.
- **주요 로직:**
  - **상관관계:** 선형(`Pearson`), 서열/비선형(`Spearman`), 소표본(`Kendall`).
  - **회귀분석:** 다중공선성(VIF) 문제 시 `Ridge/Lasso`, 비선형 시 `Polynomial Regression`.

---

## 3. Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
  - 별도의 프레임워크 없이 가볍고 빠른 성능 구현.
  - CSS Flexbox/Grid를 활용한 반응형 레이아웃.
- **Design:** Modern UI Style
  - Soft Shadow, Rounded Corners, Interactive Hover Effects.

---

## 4. How to Use

### 💻 로컬에서 실행하기

1. 이 저장소를 클론(Clone)하거나 다운로드합니다.
2. `index.html` 파일을 더블 클릭하여 브라우저에서 엽니다.
3. 또는 VS Code의 **Live Server** 확장 프로그램을 사용하면 실시간으로 실행 가능합니다.

### 🌐 웹에서 실행하기

- GitHub Pages를 통해 언제 어디서든 접속 가능합니다.
- URL: `https://gorhkdwj.github.io/DA_Portfolio/01_Daily_Project/PJ07_통계검정_종합_의사결정트리/index.html`

---

## 5. Project Structure

```bash
📂 PJ07_통계검정_종합_의사결정트리
├── index.html       # 메인 UI 구조 (질문 영역, 결과 영역)
├── app.js           # 의사결정 트리 데이터(JSON) 및 로직(Traversal) 구현
├── style.css        # 전체 디자인 스타일링
└── README.md        # 프로젝트 설명서
```

---

*Created by **Kim Jae-cheon (gorhkdwj)** | Data Analyst Portfolio*
