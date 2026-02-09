# SciPy 라이브러리 개요

## 공식 문서 및 참고 링크

- **공식 문서**: https://docs.scipy.org/doc/scipy/
- **User 가이드**: https://docs.scipy.org/doc/scipy/tutorial/index.html
- **API 레퍼런스**: https://docs.scipy.org/doc/scipy/reference/stats.html

---

## SciPy란?

SciPy(Scientific Python)는 Python 기반의 과학 계산 라이브러리로, NumPy 위에 구축되어 수학, 과학, 공학 분야의 고급 연산 기능을 제공합니다.

## NumPy와의 관계

- **NumPy**: 배열 연산, 기본 수학 함수 제공 (기반 라이브러리)
- **SciPy**: NumPy 위에 통계검정, 최적화, 신호처리 등 고급 과학 계산 기능 추가

## 설치

둘 중 하나를 선택하여 설치합니다.

```bash
uv add scipy
```

```bash
pip install scipy
```

---

## 주요 모듈

| 모듈 | 기능 |
|------|------|
| `scipy.stats` | 확률분포, 통계검정, 기술통계 |
| `scipy.optimize` | 최적화, 방정식 풀기, 곡선 적합 |
| `scipy.linalg` | 선형대수 (역행렬, 고유값 등) |
| `scipy.interpolate` | 보간법 |
| `scipy.integrate` | 수치적분, 미분방정식 |
| `scipy.signal` | 신호처리 |
| `scipy.sparse` | 희소행렬 연산 |
| `scipy.cluster` | 군집분석 |
| `scipy.spatial` | 공간 데이터 구조, 거리 계산 |
| `scipy.fft` | 고속 푸리에 변환 |

---

## 통계 실습에서 자주 쓰는 기능 (`scipy.stats`)

### 1. 기술통계

```python
stats.describe(data)              # 기본 기술통계량 요약
stats.trim_mean(data, 0.1)       # 절사평균 (양쪽 10% 제거)
stats.zscore(data)                # Z-점수 표준화
stats.iqr(data)                   # 사분위범위 (IQR)
stats.mode(data)                  # 최빈값
stats.skew(data)                  # 왜도
stats.kurtosis(data)              # 첨도
stats.sem(data)                   # 표준오차
```

### 2. 정규성 검정

```python
stats.shapiro(data)               # Shapiro-Wilk 검정
stats.normaltest(data)            # D'Agostino-Pearson 검정
stats.kstest(data, 'norm')        # Kolmogorov-Smirnov 검정
stats.anderson(data, dist='norm') # Anderson-Darling 검정
```

### 3. 등분산 검정

```python
stats.levene(g1, g2)             # Levene 검정
stats.bartlett(g1, g2)           # Bartlett 검정
```

### 4. t-검정

```python
stats.ttest_1samp(data, popmean)         # 단일표본 t-검정
stats.ttest_ind(g1, g2)                  # 독립표본 t-검정
stats.ttest_ind(g1, g2, equal_var=False) # Welch's t-검정
stats.ttest_rel(before, after)           # 대응표본 t-검정
```

### 5. 분산분석 (ANOVA)

```python
stats.f_oneway(g1, g2, g3)              # 일원분산분석
stats.kruskal(g1, g2, g3)               # Kruskal-Wallis (비모수)
stats.friedmanchisquare(g1, g2, g3)     # Friedman 검정 (반복측정 비모수)
```

### 6. 비모수 검정

```python
stats.mannwhitneyu(g1, g2)       # Mann-Whitney U 검정
stats.wilcoxon(d1, d2)           # Wilcoxon 부호순위 검정
stats.rankdata(data)             # 순위 변환
```

### 7. 상관분석

```python
stats.pearsonr(x, y)             # Pearson 상관계수
stats.spearmanr(x, y)            # Spearman 순위상관
stats.kendalltau(x, y)           # Kendall 순위상관
stats.pointbiserialr(x, y)      # 점이연 상관계수
```

### 8. 카이제곱 검정

```python
stats.chi2_contingency(table)        # 독립성 검정
stats.chisquare(observed, expected)  # 적합도 검정
stats.fisher_exact(table)            # Fisher 정확검정 (2x2)
```

### 9. 확률분포

```python
# 공통 메서드 (모든 분포에 동일하게 적용)
dist.pdf(x)       # 확률밀도함수 (연속)
dist.pmf(x)       # 확률질량함수 (이산)
dist.cdf(x)       # 누적분포함수
dist.ppf(q)       # 분위수 함수 (역CDF)
dist.rvs(size)    # 난수 생성

# 연속분포
stats.norm         # 정규분포
stats.t            # t-분포
stats.f            # F-분포
stats.chi2         # 카이제곱분포
stats.uniform      # 균일분포
stats.expon        # 지수분포

# 이산분포
stats.binom        # 이항분포
stats.poisson      # 포아송분포
```

### 10. 신뢰구간

```python
stats.t.interval(confidence, df, loc, scale)   # t-분포 기반 신뢰구간
stats.norm.interval(confidence, loc, scale)    # 정규분포 기반 신뢰구간
```

