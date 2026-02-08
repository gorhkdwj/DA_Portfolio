# statsmodels 라이브러리 개요

## 공식 문서 및 참고 링크

- **공식 문서**: https://www.statsmodels.org/stable/
- **User 가이드**: https://www.statsmodels.org/stable/user-guide.html
- **API 레퍼런스**: https://www.statsmodels.org/stable/api.html
- **통계검정 모듈**: https://www.statsmodels.org/stable/stats.html

---

## statsmodels란?

statsmodels는 Python 기반의 통계 모델링 라이브러리로, 회귀분석·가설검정·시계열 분석 등 전통적 통계학 방법론을 제공합니다. scipy.stats가 개별 검정 함수 위주라면, statsmodels는 **모델 추정 → 결과 요약 → 진단** 까지의 전체 워크플로우를 지원합니다.

## SciPy와의 관계

| 라이브러리 | 역할 |
|-----------|------|
| **NumPy** | 배열 연산, 기본 수학 함수 (기반) |
| **SciPy** | 확률분포, 개별 통계검정, 과학 계산 |
| **statsmodels** | 통계 모델링, 회귀분석, 상세 결과 요약표, 진단 도구 |

- SciPy: `stats.ttest_ind(g1, g2)` → p-value 하나 반환
- statsmodels: `OLS(y, X).fit()` → 계수, 표준오차, t값, p값, R², F-통계량 등 종합 요약

## 설치

둘 중 하나를 선택하여 설치합니다.

```bash
uv add statsmodels
```

```bash
pip install statsmodels
```

---

## 주요 모듈

| 모듈 | 기능 |
|------|------|
| `statsmodels.api` | 회귀분석(OLS/WLS/GLS), GLM, 이산변수 모델 등 |
| `statsmodels.formula.api` | R-style 수식으로 모델 지정 (`y ~ x1 + x2`) |
| `statsmodels.tsa.api` | 시계열 분석 (ARIMA, 지수평활, VAR 등) |
| `statsmodels.stats` | 통계검정, 다중비교, 검정력 분석 |
| `statsmodels.stats.proportion` | 비율 검정, 비율 신뢰구간 |
| `statsmodels.stats.weightstats` | 가중 기술통계, z-검정, t-검정 |
| `statsmodels.stats.power` | 검정력(power) 분석, 표본크기 계산 |
| `statsmodels.stats.diagnostic` | 잔차 진단, 이분산 검정, 자기상관 검정 |
| `statsmodels.stats.anova` | 분산분석 (ANOVA) |
| `statsmodels.stats.multicomp` | 다중비교 (Tukey HSD 등) |
| `statsmodels.graphics` | 통계 시각화 (QQ-plot, 잔차도 등) |

---

## 통계 실습에서 자주 쓰는 기능

### 1. 비율 검정 (`statsmodels.stats.proportion`)

```python
from statsmodels.stats.proportion import (
    proportions_ztest,
    proportion_confint,
    test_proportions_2indep,
)

# 단일 비율 z-검정
z, p = proportions_ztest(
    count=62,               # 성공 횟수
    nobs=100,               # 전체 시행 횟수
    value=0.5,              # 귀무가설의 모비율 p₀
    alternative='two-sided', # 'two-sided' | 'larger' | 'smaller'
    prop_var=0.5            # SE에 사용할 비율 (None이면 p̂ 사용)
)

# 비율 신뢰구간
lo, hi = proportion_confint(
    count=62,               # 성공 횟수
    nobs=100,               # 전체 시행 횟수
    alpha=0.05,             # 유의수준 (95% CI)
    method='normal'         # 'normal' | 'wilson' | 'agresti_coull' 등
)

# 두 독립 비율 비교
result = test_proportions_2indep(
    count1=45, nobs1=100,   # 그룹 1
    count2=35, nobs2=100,   # 그룹 2
    method='wald'           # 'wald' | 'score' | 'agresti-caffo'
)
```

### 2. z-검정 / t-검정 (`statsmodels.stats.weightstats`)

```python
from statsmodels.stats.weightstats import ztest, ttest_ind, DescrStatsW

# 단일 표본 z-검정
z, p = ztest(data, value=0)

# 두 표본 z-검정
z, p = ztest(x1, x2, value=0)

# 가중 기술통계
d = DescrStatsW(data)
d.mean                    # 평균
d.std                     # 표준편차
ci = d.tconfint_mean()    # 평균의 t-신뢰구간
z, p = d.ztest_mean(0.5)  # z-검정
```

### 3. 회귀분석

```python
import statsmodels.api as sm
import statsmodels.formula.api as smf

# 방법 1: 배열 기반
X = sm.add_constant(x)           # 절편 추가
model = sm.OLS(y, X).fit()
print(model.summary())           # 상세 결과 요약표

# 방법 2: 수식 기반 (R-style)
model = smf.ols('y ~ x1 + x2', data=df).fit()
print(model.summary())
```

### 4. 분산분석 (ANOVA)

```python
from statsmodels.stats.anova import anova_oneway
from statsmodels.formula.api import ols

# 일원분산분석
result = anova_oneway(g1, g2, g3)

# 수식 기반 ANOVA (이원 이상)
model = ols('score ~ C(group) + C(gender)', data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=2)
```

### 5. 다중비교

```python
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from statsmodels.stats.multitest import multipletests

# Tukey HSD 사후검정
result = pairwise_tukeyhsd(data, groups, alpha=0.05)
print(result)

# p-value 다중비교 보정
reject, pvals_corrected, _, _ = multipletests(
    pvals,
    alpha=0.05,
    method='bonferroni'   # 'bonferroni' | 'holm' | 'fdr_bh' 등
)
```

### 6. 검정력 분석 (`statsmodels.stats.power`)

```python
from statsmodels.stats.power import (
    TTestIndPower,
    TTestPower,
    NormalIndPower,
)

# 독립 t-검정 검정력 / 필요 표본크기
analysis = TTestIndPower()
power = analysis.solve_power(effect_size=0.5, nobs1=30, alpha=0.05)
n = analysis.solve_power(effect_size=0.5, power=0.8, alpha=0.05)

# 검정력 곡선 시각화
analysis.plot_power(dep_var='nobs', nobs=range(10, 100),
                    effect_size=[0.2, 0.5, 0.8])
```

### 7. 정규성 · 이분산 진단

```python
from statsmodels.stats.diagnostic import (
    het_breuschpagan,      # Breusch-Pagan 이분산 검정
    het_white,             # White 이분산 검정
    acorr_ljungbox,        # Ljung-Box 자기상관 검정
)
from statsmodels.stats.stattools import (
    durbin_watson,         # Durbin-Watson 통계량
    jarque_bera,           # Jarque-Bera 정규성 검정
)
```

### 8. 시계열 분석

```python
from statsmodels.tsa.api import (
    ARIMA,                 # ARIMA 모델
    ExponentialSmoothing,  # 지수평활법
    seasonal_decompose,    # 계절 분해
    adfuller,              # ADF 단위근 검정
)

# ARIMA 모델 적합
model = ARIMA(data, order=(1, 1, 1)).fit()
forecast = model.forecast(steps=10)
```

---

## SciPy vs statsmodels 비교

| 작업 | SciPy | statsmodels |
|------|-------|-------------|
| 단일 비율 검정 | 직접 구현 필요 | `proportions_ztest()` |
| 비율 신뢰구간 | 직접 구현 필요 | `proportion_confint()` |
| t-검정 | `stats.ttest_ind()` | `ttest_ind()` (가중치 지원) |
| 회귀분석 | `stats.linregress()` (단순) | `OLS().fit()` (다중, 상세 요약) |
| ANOVA | `stats.f_oneway()` | `anova_lm()` (이원 이상 지원) |
| 사후검정 | 없음 | `pairwise_tukeyhsd()` |
| 검정력 분석 | 없음 | `TTestIndPower()` |
| 시계열 | 없음 | `ARIMA`, `ExponentialSmoothing` |

일반적으로 **개별 검정은 SciPy**, **모델링·진단·상세 결과가 필요하면 statsmodels**를 사용합니다.
