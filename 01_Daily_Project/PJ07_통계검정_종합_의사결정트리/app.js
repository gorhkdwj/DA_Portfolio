// ============================================
// Decision Tree Data Structure
// ============================================
const decisionTree = {
    id: 'root',
    question: '분석의 목적은 무엇인가요?',
    description: '데이터 분석의 주된 목적을 선택해 주세요.',
    options: [
        // ============================================
        // ① 단일표본 (Y: 연속형/범주형/비율, X: 없음)
        // ============================================
        {
            label: '단일표본', icon: '1️⃣', desc: '표본 통계량 vs 기준값',
            color: 'cyan',
            next: {
                id: 'single_type',
                question: 'Y의 측정 수준은?',
                description: '분석하려는 종속변수(Y)의 유형을 선택하세요.',
                options: [
                    {
                        label: '연속형', icon: '📈', desc: '예: 점수, 체중, 온도',
                        color: 'blue',
                        next: {
                            id: 'single_cont_norm',
                            question: '정규성을 만족하나요?',
                            description: 'Shapiro-Wilk 검정 등으로 정규성을 확인하세요.',
                            options: [
                                {
                                    label: '예 (정규분포)', icon: '📐', desc: 'p > 0.05',
                                    color: 'emerald',
                                    next: { id: 'result_one_t', result: {
                                        name: '단일표본 t-검정',
                                        english: 'One-Sample t-Test',
                                        desc: '표본의 평균이 알려진 모집단 평균(기준값)과 유의하게 다른지 검정합니다.\n예: 제품 평균 중량이 500g인지',
                                        conditions: ['단일표본', '종속변수: 연속형', '정규분포 가정 충족', '비교할 기준값(μ₀) 존재'],
                                        code: `from scipy.stats import ttest_1samp

# 단일표본 t-검정 (기준값 = 100)
t_stat, p_value = ttest_1samp(data, popmean=100)
print(f"t = {t_stat:.4f}, p-value = {p_value:.4f}")
print(f"표본 평균 = {data.mean():.4f}, 기준값 = 100")`
                                    }}
                                },
                                {
                                    label: '아니오 (비정규)', icon: '🔀', desc: 'p ≤ 0.05',
                                    color: 'rose',
                                    next: { id: 'result_one_wilcoxon', result: {
                                        name: 'Wilcoxon 부호순위 검정 (단일표본)',
                                        english: 'One-Sample Wilcoxon Signed-Rank Test',
                                        desc: '표본의 중위수가 알려진 기준값과 유의하게 다른지 비모수적으로 검정합니다.\n예: 만족도 중앙값이 3점인지',
                                        conditions: ['단일표본', '종속변수: 연속형 또는 순서형', '정규분포 가정 불충족', '비교할 기준값 존재'],
                                        code: `from scipy.stats import wilcoxon
import numpy as np

# 기준값과의 차이에 대해 Wilcoxon 검정
median_test_value = 100
differences = data - median_test_value
w_stat, p_value = wilcoxon(differences)
print(f"W = {w_stat:.4f}, p-value = {p_value:.4f}")
print(f"표본 중위수 = {np.median(data):.4f}, 기준값 = {median_test_value}")`
                                    }}
                                }
                            ]
                        }
                    },
                    {
                        label: '비율/이항형', icon: '📊', desc: '예: 합격률, 불량률',
                        color: 'amber',
                        next: {
                            id: 'single_prop_approx',
                            question: '정규근사 가능한가요?',
                            description: 'np ≥ 5 이고 n(1-p) ≥ 5 인지 확인하세요.',
                            options: [
                                {
                                    label: '예 (np≥5, n(1-p)≥5)', icon: '✅', desc: '충분한 표본 크기',
                                    color: 'emerald',
                                    next: { id: 'result_prop_z', result: {
                                        name: '단일표본 비율 z-검정',
                                        english: 'One-Sample Proportion z-Test',
                                        desc: '표본비율이 기준비율과 유의하게 다른지 정규근사를 통해 검정합니다.\n예: 불량률이 5% 이하인지',
                                        conditions: ['단일표본', '종속변수: 비율(이항)', 'np ≥ 5 및 n(1-p) ≥ 5', '기준 비율(p₀) 존재'],
                                        code: `from statsmodels.stats.proportion import proportions_ztest

# 단일표본 비율 z-검정
# count: 성공 횟수, nobs: 전체 관측수, value: 기준비율
stat, p_value = proportions_ztest(count=45, nobs=100, value=0.5)
print(f"z = {stat:.4f}, p-value = {p_value:.4f}")
print(f"관측 비율 = {45/100:.2f}, 기준 비율 = 0.50")`
                                    }}
                                },
                                {
                                    label: '아니오 (근사 불가)', icon: '⚠️', desc: '소표본',
                                    color: 'rose',
                                    next: { id: 'result_binomial', result: {
                                        name: '이항검정',
                                        english: 'Binomial Test',
                                        desc: '관측된 비율(성공 횟수)이 특정 기준 비율과 유의하게 다른지 정확검정합니다.\n예: 소표본에서 합격률이 90%인지',
                                        conditions: ['단일표본', '종속변수: 이진형 (성공/실패)', '소표본 (정규근사 불가)', '기준 비율(p₀) 존재'],
                                        code: `from scipy.stats import binomtest

# 이항검정
# k: 성공 횟수, n: 전체 시행 횟수, p: 기준 비율
result = binomtest(k=45, n=100, p=0.5)
print(f"p-value = {result.pvalue:.4f}")
print(f"관측 비율 = {45/100:.2f}, 기준 비율 = 0.50")`
                                    }}
                                }
                            ]
                        }
                    },
                    {
                        label: '범주형', icon: '🏷️', desc: '예: 요일별 방문자 균등 여부',
                        color: 'purple',
                        next: { id: 'result_chisq_gof', result: {
                            name: 'Chi-square 적합도 검정',
                            english: 'Chi-Square Goodness of Fit Test',
                            desc: '관측빈도가 기대빈도와 유의하게 다른지 검정합니다.\n예: 요일별 방문자가 균등한지\n\n✅ 유의하면 → 조정된 잔차 분석으로 어떤 범주가 기대와 다른지 확인',
                            conditions: ['단일표본', '종속변수: 범주형', '기대빈도 분포 존재', '각 셀 기대빈도 ≥ 5 권장'],
                            code: `from scipy.stats import chisquare
import numpy as np

# 관측빈도
observed = np.array([50, 30, 20, 40, 60])

# 기대빈도 (균등분포일 경우)
expected = np.array([40, 40, 40, 40, 40])

chi2, p_value = chisquare(observed, f_exp=expected)
print(f"χ² = {chi2:.4f}, p-value = {p_value:.4f}")

# 조정된 잔차 (Adjusted Residuals)
residuals = (observed - expected) / np.sqrt(expected)
print(f"조정된 잔차: {residuals}")`
                        }}
                    }
                ]
            }
        },
        // ============================================
        // ② 집단비교 (Y: 연속형, X: 범주형)
        // ============================================
        {
            label: '집단비교', icon: '⚖️', desc: '집단 간 위치 차이',
            color: 'blue',
            next: {
                id: 'group_count',
                question: '집단 수는?',
                description: '비교하려는 그룹의 수를 선택하세요.',
                options: [
                    {
                        label: '2개', icon: '2️⃣', desc: '예: 실험군 vs 대조군',
                        color: 'blue',
                        next: {
                            id: 'group2_relation',
                            question: '독립/대응?',
                            description: '두 그룹이 서로 독립적인지, 같은 대상의 반복 측정인지 선택하세요.',
                            options: [
                                {
                                    label: '독립', icon: '👥', desc: '서로 다른 대상',
                                    color: 'blue',
                                    next: {
                                        id: 'group2_ind_norm',
                                        question: '정규성을 만족하나요?',
                                        description: 'Shapiro-Wilk 검정 등으로 각 그룹의 정규성을 확인하세요.',
                                        options: [
                                            {
                                                label: '예 (정규분포)', icon: '📐', desc: 'p > 0.05',
                                                color: 'emerald',
                                                next: {
                                                    id: 'group2_ind_var',
                                                    question: '등분산성을 만족하나요?',
                                                    description: 'Levene 검정으로 등분산성을 확인하세요.',
                                                    options: [
                                                        {
                                                            label: '예 (등분산)', icon: '⚖️', desc: 'Levene p > 0.05',
                                                            color: 'emerald',
                                                            next: { id: 'result_student_t', result: {
                                                                name: "Student's t-검정",
                                                                english: "Student's t-Test",
                                                                desc: '두 독립 집단의 평균 차이를 검정합니다. 등분산 가정을 충족할 때 사용합니다.\n예: A/B 그룹 평균 구매액 차이',
                                                                conditions: ['2개 독립 그룹', '종속변수: 연속형', '정규분포 가정 충족', '등분산 가정 충족'],
                                                                code: `from scipy.stats import ttest_ind, levene

# 등분산 검정
stat, p_levene = levene(group1, group2)
print(f"Levene p = {p_levene:.4f} → 등분산 충족")

# Student's t-검정 (equal_var=True)
t_stat, p_value = ttest_ind(group1, group2, equal_var=True)
print(f"t = {t_stat:.4f}, p-value = {p_value:.4f}")`
                                                            }}
                                                        },
                                                        {
                                                            label: '아니오 (이분산)', icon: '📊', desc: 'Levene p ≤ 0.05',
                                                            color: 'rose',
                                                            next: { id: 'result_welch_t', result: {
                                                                name: "Welch's t-검정",
                                                                english: "Welch's t-Test",
                                                                desc: '두 독립 집단의 평균 차이를 이분산 보정하여 검정합니다.\n예: 남녀 평균 연봉 차이 (분산이 다를 때)',
                                                                conditions: ['2개 독립 그룹', '종속변수: 연속형', '정규분포 가정 충족', '등분산 가정 불충족'],
                                                                code: `from scipy.stats import ttest_ind

# Welch's t-검정 (equal_var=False)
t_stat, p_value = ttest_ind(group1, group2, equal_var=False)
print(f"t = {t_stat:.4f}, p-value = {p_value:.4f}")
print("이분산 보정 적용 (Welch's)")`
                                                            }}
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                label: '아니오 (비정규)', icon: '🔀', desc: 'p ≤ 0.05',
                                                color: 'rose',
                                                next: { id: 'result_mannwhitney', result: {
                                                    name: 'Mann-Whitney U 검정',
                                                    english: 'Mann-Whitney U Test',
                                                    desc: '두 독립 그룹의 분포(위치) 차이를 비모수적으로 검정합니다.\n예: 두 지역 고객 만족도 순위 비교',
                                                    conditions: ['2개 독립 그룹', '종속변수: 연속형 또는 순서형', '정규분포 가정 불충족'],
                                                    code: `from scipy.stats import mannwhitneyu

# Mann-Whitney U 검정
u_stat, p_value = mannwhitneyu(group1, group2, alternative='two-sided')
print(f"U = {u_stat:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            }
                                        ]
                                    }
                                },
                                {
                                    label: '대응', icon: '🔗', desc: '같은 대상 반복 측정',
                                    color: 'purple',
                                    next: {
                                        id: 'group2_pair_norm',
                                        question: '차이값 정규성을 만족하나요?',
                                        description: '대응 차이(사후-사전)의 정규성을 확인하세요.',
                                        options: [
                                            {
                                                label: '예 (정규분포)', icon: '📐', desc: 'p > 0.05',
                                                color: 'emerald',
                                                next: { id: 'result_paired_t', result: {
                                                    name: '대응표본 t-검정',
                                                    english: 'Paired t-Test',
                                                    desc: '처리 전후 평균 차이를 검정합니다.\n예: 교육 전후 시험 점수 변화',
                                                    conditions: ['같은 대상의 2회 측정', '종속변수: 연속형', '차이값의 정규분포 가정 충족'],
                                                    code: `from scipy.stats import ttest_rel

# 대응표본 t-검정
t_stat, p_value = ttest_rel(before, after)
print(f"t = {t_stat:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            },
                                            {
                                                label: '아니오 (비정규)', icon: '🔀', desc: 'p ≤ 0.05',
                                                color: 'rose',
                                                next: { id: 'result_wilcoxon_paired', result: {
                                                    name: 'Wilcoxon 부호순위 검정',
                                                    english: 'Wilcoxon Signed-Rank Test',
                                                    desc: '처리 전후 분포 위치 차이를 비모수적으로 검정합니다.\n예: 약물 투여 전후 통증 점수 변화',
                                                    conditions: ['같은 대상의 2회 측정', '종속변수: 연속형 또는 순서형', '정규분포 가정 불충족'],
                                                    code: `from scipy.stats import wilcoxon

# Wilcoxon 부호순위 검정
w_stat, p_value = wilcoxon(before, after)
print(f"W = {w_stat:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        label: '3개 이상', icon: '3️⃣', desc: '예: A, B, C 그룹 비교',
                        color: 'purple',
                        next: {
                            id: 'group3_relation',
                            question: '독립/대응?',
                            description: '각 그룹이 서로 독립적인지, 반복 측정인지 선택하세요.',
                            options: [
                                {
                                    label: '독립', icon: '👥', desc: '서로 다른 대상',
                                    color: 'blue',
                                    next: {
                                        id: 'group3_ind_norm',
                                        question: '정규성을 만족하나요?',
                                        description: '각 그룹별 정규성을 확인하세요.',
                                        options: [
                                            {
                                                label: '예 (정규분포)', icon: '📐', desc: 'p > 0.05',
                                                color: 'emerald',
                                                next: {
                                                    id: 'group3_ind_var',
                                                    question: '등분산성을 만족하나요?',
                                                    description: 'Bartlett 또는 Levene 검정으로 등분산성을 확인하세요.',
                                                    options: [
                                                        {
                                                            label: '예 (등분산)', icon: '⚖️', desc: 'p > 0.05',
                                                            color: 'emerald',
                                                            next: { id: 'result_anova', result: {
                                                                name: '일원배치 분산분석',
                                                                english: 'One-Way ANOVA',
                                                                desc: '3개+ 집단 평균 차이를 검정합니다.\n예: 3개 배경별 월 매출 차이\n\n✅ 유의하면 → Tukey HSD 사후검정으로 어떤 집단 쌍이 다른지 확인',
                                                                conditions: ['3개 이상 독립 그룹', '종속변수: 연속형', '정규분포 가정', '등분산 가정'],
                                                                code: `from scipy.stats import f_oneway, levene
from statsmodels.stats.multicomp import pairwise_tukeyhsd

# 등분산 검정
stat, p_lev = levene(g1, g2, g3)
print(f"Levene p = {p_lev:.4f}")

# One-Way ANOVA
f_stat, p_value = f_oneway(g1, g2, g3)
print(f"F = {f_stat:.4f}, p-value = {p_value:.4f}")

# 사후검정: Tukey HSD
tukey = pairwise_tukeyhsd(df['value'], df['group'])
print(tukey)`
                                                            }}
                                                        },
                                                        {
                                                            label: '아니오 (이분산)', icon: '📊', desc: 'p ≤ 0.05',
                                                            color: 'rose',
                                                            next: { id: 'result_welch_anova', result: {
                                                                name: "Welch's ANOVA",
                                                                english: "Welch's ANOVA",
                                                                desc: "3개+ 집단 평균 차이를 이분산 보정하여 검정합니다.\n예: 학력별 연봉 차이\n\n✅ 유의하면 → Games-Howell 사후검정으로 어떤 집단 쌍이 다른지 확인",
                                                                conditions: ['3개 이상 독립 그룹', '종속변수: 연속형', '정규분포 가정', '등분산 가정 불충족'],
                                                                code: `import pingouin as pg

# Welch's ANOVA
aov = pg.welch_anova(dv='score', between='group', data=df)
print(aov)

# 사후검정: Games-Howell
posthoc = pg.pairwise_gameshowell(dv='score', between='group', data=df)
print(posthoc)`
                                                            }}
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                label: '아니오 (비정규)', icon: '🔀', desc: 'p ≤ 0.05',
                                                color: 'rose',
                                                next: { id: 'result_kruskal', result: {
                                                    name: 'Kruskal-Wallis 검정',
                                                    english: 'Kruskal-Wallis H Test',
                                                    desc: '3개+ 집단 분포 위치 차이를 비모수적으로 검정합니다.\n예: 3개 브랜드 만족도 순위 비교\n\n✅ 유의하면 → Dunn test 사후검정으로 어떤 집단 쌍이 다른지 확인',
                                                    conditions: ['3개 이상 독립 그룹', '종속변수: 연속형 또는 순서형', '정규분포 가정 불충족'],
                                                    code: `from scipy.stats import kruskal
import scikit_posthocs as sp

# Kruskal-Wallis 검정
h_stat, p_value = kruskal(g1, g2, g3)
print(f"H = {h_stat:.4f}, p-value = {p_value:.4f}")

# Dunn 사후검정
dunn = sp.posthoc_dunn([g1, g2, g3], p_adjust='bonferroni')
print(dunn)`
                                                }}
                                            }
                                        ]
                                    }
                                },
                                {
                                    label: '대응 (반복 측정)', icon: '🔗', desc: '같은 대상 3회+ 측정',
                                    color: 'purple',
                                    next: {
                                        id: 'group3_pair_norm',
                                        question: '정규성을 만족하나요?',
                                        description: '각 시점별 데이터의 정규성을 확인하세요.',
                                        options: [
                                            {
                                                label: '예 (정규분포)', icon: '📐', desc: 'p > 0.05',
                                                color: 'emerald',
                                                next: {
                                                    id: 'group3_pair_sphericity',
                                                    question: '구형성을 만족하나요?',
                                                    description: "Mauchly's 구형성 검정으로 확인하세요.",
                                                    options: [
                                                        {
                                                            label: '예 (구형성 충족)', icon: '🔵', desc: 'Mauchly p > 0.05',
                                                            color: 'emerald',
                                                            next: { id: 'result_rm_anova', result: {
                                                                name: '반복측정 분산분석',
                                                                english: 'Repeated Measures ANOVA',
                                                                desc: '반복측정 평균 차이를 검정합니다.\n예: 1·3·6개월 후 체중 변화 추적\n\n✅ 유의하면 → Bonferroni 쌍별 비교로 어떤 시점 쌍이 다른지 확인',
                                                                conditions: ['같은 대상의 3회 이상 측정', '종속변수: 연속형', '정규분포·구형성 가정 충족'],
                                                                code: `import pingouin as pg

# 반복측정 ANOVA
aov = pg.rm_anova(data=df, dv='score', within='time', subject='id')
print(aov)

# Bonferroni 사후검정
posthoc = pg.pairwise_tests(data=df, dv='score', within='time',
                             subject='id', padjust='bonf')
print(posthoc)`
                                                            }}
                                                        },
                                                        {
                                                            label: '아니오 (구형성 불충족)', icon: '🔴', desc: 'Mauchly p ≤ 0.05',
                                                            color: 'rose',
                                                            next: { id: 'result_rm_anova_gg', result: {
                                                                name: '반복측정 ANOVA + G-G 보정',
                                                                english: 'RM ANOVA with Greenhouse-Geisser Correction',
                                                                desc: '구형성 위반 시 Greenhouse-Geisser 보정을 적용한 반복측정 ANOVA입니다.\n예: 4주간 매주 측정한 혈압 변화\n\n✅ 유의하면 → Bonferroni 쌍별 비교',
                                                                conditions: ['같은 대상의 3회 이상 측정', '종속변수: 연속형', '정규분포 충족, 구형성 불충족'],
                                                                code: `import pingouin as pg

# 반복측정 ANOVA (G-G 보정 자동 적용)
aov = pg.rm_anova(data=df, dv='score', within='time',
                   subject='id', correction=True)
print(aov)
# eps 열의 Greenhouse-Geisser epsilon 값 확인

# Bonferroni 사후검정
posthoc = pg.pairwise_tests(data=df, dv='score', within='time',
                             subject='id', padjust='bonf')
print(posthoc)`
                                                            }}
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                label: '아니오 (비정규)', icon: '🔀', desc: 'p ≤ 0.05',
                                                color: 'rose',
                                                next: { id: 'result_friedman', result: {
                                                    name: 'Friedman 검정',
                                                    english: 'Friedman Test',
                                                    desc: '같은 대상에서 3회 이상 반복 측정한 값의 분포 차이를 비모수적으로 검정합니다.\n반복측정 ANOVA의 비모수 대안입니다.',
                                                    conditions: ['같은 대상의 3회 이상 측정', '종속변수: 연속형 또는 순서형', '정규분포 가정 불충족'],
                                                    code: `from scipy.stats import friedmanchisquare

# Friedman 검정
f_stat, p_value = friedmanchisquare(time1, time2, time3)
print(f"χ² = {f_stat:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        // ============================================
        // ③ 범주형 (Y: 범주형, X: 범주형)
        // ============================================
        {
            label: '범주형', icon: '🏷️', desc: '빈도·연관성',
            color: 'amber',
            next: {
                id: 'cat_relation',
                question: '독립/대응?',
                description: '두 변수가 독립적 관측인지, 대응(반복) 관측인지 선택하세요.',
                options: [
                    {
                        label: '독립', icon: '👥', desc: '서로 다른 대상',
                        color: 'blue',
                        next: {
                            id: 'cat_table_size',
                            question: '교차표 크기는?',
                            description: '교차표의 행과 열 수를 선택하세요.',
                            options: [
                                {
                                    label: '2×2', icon: '⬜', desc: '2행 × 2열',
                                    color: 'blue',
                                    next: {
                                        id: 'cat_2x2_expected',
                                        question: '기대빈도 조건은?',
                                        description: '모든 셀의 기대빈도가 5 이상인지 확인하세요.',
                                        options: [
                                            {
                                                label: '모든 셀 ≥ 5', icon: '✅', desc: '충분한 기대빈도',
                                                color: 'emerald',
                                                next: { id: 'result_chisq_2x2', result: {
                                                    name: 'Chi-square 독립성 검정',
                                                    english: 'Chi-Square Test of Independence',
                                                    desc: '두 범주형 변수 간의 연관성을 검정합니다.\n예: 성별과 구매 여부 연관성\n\n✅ 유의하면 → 조정된 잔차 분석으로 어떤 셀이 기대와 다른지 확인',
                                                    conditions: ['2×2 교차표', '독립 관측', '모든 셀 기대빈도 ≥ 5'],
                                                    code: `from scipy.stats import chi2_contingency
import pandas as pd

cross_tab = pd.crosstab(df['var1'], df['var2'])
chi2, p_value, dof, expected = chi2_contingency(cross_tab)
print(f"χ² = {chi2:.4f}, p-value = {p_value:.4f}")
print(f"기대빈도:\\n{expected}")

# 조정된 잔차
import numpy as np
residuals = (cross_tab.values - expected) / np.sqrt(expected)
print(f"조정된 잔차:\\n{residuals}")`
                                                }}
                                            },
                                            {
                                                label: '일부 셀 < 5', icon: '⚠️', desc: '소표본 또는 희소 셀',
                                                color: 'rose',
                                                next: { id: 'result_fisher', result: {
                                                    name: "Fisher's Exact 검정",
                                                    english: "Fisher's Exact Test",
                                                    desc: '소표본 정확 검정으로 2×2 교차표의 연관성을 검정합니다.\n예: 희귀질환 치료 반응 여부\n\n✅ 유의하면 → 조정된 잔차 분석',
                                                    conditions: ['2×2 교차표', '독립 관측', '기대빈도 < 5인 셀 존재'],
                                                    code: `from scipy.stats import fisher_exact
import numpy as np

table = np.array([[10, 2], [3, 15]])
odds_ratio, p_value = fisher_exact(table)
print(f"오즈비 = {odds_ratio:.4f}")
print(f"p-value = {p_value:.4f}")`
                                                }}
                                            }
                                        ]
                                    }
                                },
                                {
                                    label: 'R×C (3행 이상)', icon: '📋', desc: '3행 이상 교차표',
                                    color: 'purple',
                                    next: {
                                        id: 'cat_rxc_expected',
                                        question: '기대빈도 조건은?',
                                        description: '모든 셀의 기대빈도가 5 이상인지 확인하세요.',
                                        options: [
                                            {
                                                label: '모든 셀 ≥ 5', icon: '✅', desc: '충분한 기대빈도',
                                                color: 'emerald',
                                                next: { id: 'result_chisq_rxc', result: {
                                                    name: 'Chi-square 독립성 검정 (R×C)',
                                                    english: 'Chi-Square Test (R×C)',
                                                    desc: 'R×C 교차표에서 두 변수 간 연관성을 검정합니다.\n예: 연령대별 선호 브랜드 연관성\n\n✅ 유의하면 → 조정된 잔차 분석',
                                                    conditions: ['R×C 교차표', '독립 관측', '모든 셀 기대빈도 ≥ 5'],
                                                    code: `from scipy.stats import chi2_contingency
import pandas as pd

cross_tab = pd.crosstab(df['var1'], df['var2'])
chi2, p_value, dof, expected = chi2_contingency(cross_tab)
print(f"χ² = {chi2:.4f}, p-value = {p_value:.4f}")
print(f"자유도 = {dof}")`
                                                }}
                                            },
                                            {
                                                label: '일부 셀 < 5', icon: '⚠️', desc: '희소 셀 존재',
                                                color: 'rose',
                                                next: {
                                                    id: 'cat_rxc_ratio',
                                                    question: '기대빈도 < 5인 셀 비율은?',
                                                    description: '기대빈도가 5 미만인 셀의 비율을 확인하세요.',
                                                    options: [
                                                        {
                                                            label: '≤ 20%', icon: '📊', desc: '유사 범주 병합 가능',
                                                            color: 'amber',
                                                            next: { id: 'result_chisq_merge', result: {
                                                                name: '셀 병합 후 Chi-square',
                                                                english: 'Chi-Square after Cell Merging',
                                                                desc: '유사한 범주를 병합하여 기대빈도 조건을 충족시킨 후 카이제곱 검정을 수행합니다.\n예: 10대+20대를 청년층으로 병합\n\n✅ 유의하면 → 조정된 잔차 분석',
                                                                conditions: ['R×C 교차표', '기대빈도 < 5 셀이 20% 이하', '유사 범주 병합 가능'],
                                                                code: `import pandas as pd
from scipy.stats import chi2_contingency

# 범주 병합 예시
df['age_group'] = df['age_group'].replace(
    {'10대': '청년층', '20대': '청년층'})

cross_tab = pd.crosstab(df['age_group'], df['outcome'])
chi2, p_value, dof, expected = chi2_contingency(cross_tab)
print(f"χ² = {chi2:.4f}, p-value = {p_value:.4f}")`
                                                            }}
                                                        },
                                                        {
                                                            label: '> 20%', icon: '🚫', desc: '병합 시 의미 손실',
                                                            color: 'rose',
                                                            next: { id: 'result_ffh', result: {
                                                                name: 'Fisher-Freeman-Halton 검정',
                                                                english: 'Fisher-Freeman-Halton Test',
                                                                desc: 'R×C 교차표의 정확검정입니다. Fisher 검정의 확장판으로 소표본에서 사용합니다.\n예: 소규모 병원 3개 치료법별 부작용 유형 비교',
                                                                conditions: ['R×C 교차표', '기대빈도 < 5 셀이 20% 초과', '소표본'],
                                                                code: `from scipy.stats import fisher_exact
# R×C의 경우 scipy는 2×2만 지원
# R 또는 Monte Carlo 시뮬레이션 사용 권장

# statsmodels 방식 (Monte Carlo)
from scipy.stats import chi2_contingency
chi2, p_value, dof, expected = chi2_contingency(
    table, lambda_="log-likelihood")
print(f"G² = {chi2:.4f}, p-value = {p_value:.4f}")
print("※ 정확검정은 R의 fisher.test() 권장")`
                                                            }}
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        label: '대응', icon: '🔗', desc: '같은 대상 반복 측정',
                        color: 'purple',
                        next: {
                            id: 'cat_paired_cond',
                            question: '측정 조건은?',
                            description: '시점 수와 범주 유형을 선택하세요.',
                            options: [
                                {
                                    label: '2시점 이분형', icon: '🔄', desc: '예: 캠페인 전후 인지도 변화',
                                    color: 'blue',
                                    next: { id: 'result_mcnemar', result: {
                                        name: 'McNemar 검정',
                                        english: 'McNemar Test',
                                        desc: '처리 전후 비율 변화를 검정합니다. 대응 2×2 교차표에서 사용합니다.\n예: 캠페인 전후 인지도 변화',
                                        conditions: ['같은 대상의 2회 측정', '종속변수: 이분형', '대응 2×2 교차표'],
                                        code: `from statsmodels.stats.contingency_tables import mcnemar
import numpy as np

# 대응 2×2 교차표
# [[전후 모두 Yes, 전 Yes→후 No],
#  [전 No→후 Yes, 전후 모두 No]]
table = np.array([[40, 10], [15, 35]])
result = mcnemar(table, exact=True)
print(f"McNemar statistic = {result.statistic:.4f}")
print(f"p-value = {result.pvalue:.4f}")`
                                    }}
                                },
                                {
                                    label: '2시점 다범주', icon: '📋🔄', desc: '예: 교육 전후 선호도 분포 변화',
                                    color: 'amber',
                                    next: { id: 'result_bowker', result: {
                                        name: 'McNemar-Bowker 검정',
                                        english: 'McNemar-Bowker Test',
                                        desc: '처리 전후 분포 변화를 다범주에서 검정합니다. McNemar 검정의 확장판입니다.\n예: 교육 전후 선호도 분포 변화\n\n✅ 유의하면 → 쌍별 McNemar로 어떤 범주 쌍이 변화했는지 확인',
                                        conditions: ['같은 대상의 2회 측정', '종속변수: 다범주(3개 이상)', '대응 k×k 교차표'],
                                        code: `from statsmodels.stats.contingency_tables import SquareTable
import numpy as np

# 대응 k×k 교차표
table = np.array([[30, 5, 2],
                  [8, 25, 3],
                  [1, 4, 22]])
sq = SquareTable(table)
result = sq.symmetry()
print(f"χ² = {result.statistic:.4f}")
print(f"p-value = {result.pvalue:.4f}")`
                                    }}
                                },
                                {
                                    label: '3시점+ 이분형', icon: '🔄🔄🔄', desc: '예: 1·3·6개월 후 구독 유지 여부',
                                    color: 'purple',
                                    next: { id: 'result_cochran_q', result: {
                                        name: "Cochran's Q 검정",
                                        english: "Cochran's Q Test",
                                        desc: '반복측정 비율 변화를 3시점 이상에서 검정합니다.\n예: 동일 고객의 1·3·6개월 후 구독 유지 여부 변화\n\n✅ 유의하면 → 쌍별 McNemar + Bonferroni 보정',
                                        conditions: ['같은 대상의 3회 이상 측정', '종속변수: 이분형 (0/1)', '대응 표본'],
                                        code: `from statsmodels.stats.contingency_tables import cochrans_q
import numpy as np

# 각 시점별 이분형 결과 (행: 대상, 열: 시점)
data = np.array([[1,1,0], [1,0,0], [0,0,0],
                 [1,1,1], [0,1,0]])
result = cochrans_q(data)
print(f"Q = {result.statistic:.4f}")
print(f"p-value = {result.pvalue:.4f}")`
                                    }}
                                }
                            ]
                        }
                    }
                ]
            }
        },
        // ============================================
        // ④ 관계형 (Y: 연속형, X: 연속형)
        // ============================================
        {
            label: '관계형', icon: '🔗', desc: '상관·예측',
            color: 'purple',
            next: {
                id: 'rel_purpose',
                question: '분석 목적은?',
                description: '상관관계를 파악하려는지, 예측·설명 모델을 만들려는지 선택하세요.',
                options: [
                    {
                        label: '상관관계', icon: '📊', desc: '방향·강도 파악',
                        color: 'blue',
                        next: {
                            id: 'corr_norm_linear',
                            question: '정규성 & 선형성을 만족하나요?',
                            description: '두 변수의 정규성과 산점도의 선형성을 확인하세요.',
                            options: [
                                {
                                    label: '예 (정규·선형)', icon: '📐', desc: '정규분포 + 선형 관계',
                                    color: 'emerald',
                                    next: { id: 'result_pearson', result: {
                                        name: 'Pearson 상관분석',
                                        english: "Pearson's r",
                                        desc: '선형 상관의 방향과 강도를 측정합니다.\n예: 광고비와 매출 간 선형 상관',
                                        conditions: ['두 변수 모두 연속형', '정규분포 가정', '선형 관계', '이상치 없음'],
                                        code: `from scipy.stats import pearsonr

r, p_value = pearsonr(df['x'], df['y'])
print(f"Pearson r = {r:.4f}, p-value = {p_value:.4f}")`
                                    }}
                                },
                                {
                                    label: '아니오', icon: '🔀', desc: '비정규 또는 비선형',
                                    color: 'rose',
                                    next: {
                                        id: 'corr_data_type',
                                        question: '데이터 특성은?',
                                        description: '데이터의 특성에 따라 적절한 상관 방법을 선택하세요.',
                                        options: [
                                            {
                                                label: '순서형/비선형 단조', icon: '📈', desc: '예: 학력 순위와 소득',
                                                color: 'blue',
                                                next: { id: 'result_spearman', result: {
                                                    name: 'Spearman 상관분석',
                                                    english: "Spearman's ρ",
                                                    desc: '단조 관계의 방향과 강도를 순위 기반으로 측정합니다.\n예: 학력 순위와 소득 순위 상관',
                                                    conditions: ['순서형 또는 연속형', '단조(monotonic) 관계', '정규분포 불필요'],
                                                    code: `from scipy.stats import spearmanr

rho, p_value = spearmanr(df['x'], df['y'])
print(f"Spearman ρ = {rho:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            },
                                            {
                                                label: '동점 많음/소표본', icon: '🔢', desc: '예: 두 심사위원 순위 평가',
                                                color: 'amber',
                                                next: { id: 'result_kendall', result: {
                                                    name: 'Kendall 순위 상관',
                                                    english: "Kendall's τ",
                                                    desc: '순위 상관을 동점에 강건하게 측정합니다. 소표본에서 Spearman보다 정확합니다.\n예: 두 심사위원의 순위 평가 간 상관',
                                                    conditions: ['순서형 또는 연속형', '동점이 많거나 소표본', '정규분포 불필요'],
                                                    code: `from scipy.stats import kendalltau

tau, p_value = kendalltau(df['x'], df['y'])
print(f"Kendall τ = {tau:.4f}, p-value = {p_value:.4f}")`
                                                }}
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        label: '예측/설명', icon: '🎯', desc: 'Y 예측',
                        color: 'purple',
                        next: {
                            id: 'reg_type',
                            question: '관계 유형은?',
                            description: '변수 간 관계가 선형인지 비선형인지 선택하세요.',
                            options: [
                                {
                                    label: '선형', icon: '📈', desc: '직선적 관계',
                                    color: 'blue',
                                    next: {
                                        id: 'reg_vif',
                                        question: '다중공선성 VIF < 10?',
                                        description: '독립변수 간 다중공선성(VIF)을 확인하세요. 독립변수가 1개면 "예"를 선택하세요.',
                                        options: [
                                            {
                                                label: '예 (VIF < 10)', icon: '✅', desc: '다중공선성 없음',
                                                color: 'emerald',
                                                next: { id: 'result_linear_reg', result: {
                                                    name: '선형 회귀분석',
                                                    english: 'Linear/Multiple Regression',
                                                    desc: 'X로 Y를 예측·설명합니다.\n예: 면적으로 부동산 가격 예측\n\n✅ 모델 적합 후 → 잔차 진단 (정규성, 등분산성, 독립성)',
                                                    conditions: ['종속변수: 연속형', '선형 관계', 'VIF < 10', '독립성, 정규성, 등분산성'],
                                                    code: `import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

X = sm.add_constant(df[['x1', 'x2']])
model = sm.OLS(df['y'], X).fit()
print(model.summary())

# VIF 확인
for i, col in enumerate(X.columns[1:]):
    vif = variance_inflation_factor(X.values, i+1)
    print(f"{col}: VIF = {vif:.2f}")`
                                                }}
                                            },
                                            {
                                                label: '아니오 (VIF ≥ 10)', icon: '⚠️', desc: '다중공선성 존재',
                                                color: 'rose',
                                                next: { id: 'result_ridge_lasso', result: {
                                                    name: '변수 제거 또는 Ridge/Lasso',
                                                    english: 'Variable Removal or Ridge/Lasso Regression',
                                                    desc: '다중공선성이 높을 때 변수를 제거하거나 정규화 회귀를 사용합니다.\n• Ridge: L2 정규화 (계수 축소)\n• Lasso: L1 정규화 (변수 선택)',
                                                    conditions: ['종속변수: 연속형', '독립변수 간 다중공선성 존재 (VIF ≥ 10)'],
                                                    code: `from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[['x1', 'x2', 'x3']])

# Ridge 회귀
ridge = Ridge(alpha=1.0).fit(X_scaled, df['y'])
print(f"Ridge 계수: {ridge.coef_}")

# Lasso 회귀
lasso = Lasso(alpha=0.1).fit(X_scaled, df['y'])
print(f"Lasso 계수: {lasso.coef_}")
print(f"선택된 변수: {(lasso.coef_ != 0).sum()}개")`
                                                }}
                                            }
                                        ]
                                    }
                                },
                                {
                                    label: '비선형', icon: '🌊', desc: '곡선적 관계',
                                    color: 'amber',
                                    next: { id: 'result_poly_reg', result: {
                                        name: '다항 회귀분석',
                                        english: 'Polynomial Regression',
                                        desc: '비선형 관계로 Y를 예측합니다.\n예: 온도와 수율의 비선형 관계 예측\n\n✅ 모델 적합 후 → 잔차 진단 (정규성, 등분산성, 독립성)',
                                        conditions: ['종속변수: 연속형', '비선형(곡선) 관계', '과적합 주의'],
                                        code: `from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
import numpy as np

# 다항 특성 생성 (2차)
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(df[['x']])

model = LinearRegression().fit(X_poly, df['y'])
print(f"R² = {model.score(X_poly, df['y']):.4f}")
print(f"계수: {model.coef_}")`
                                    }}
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
};


// ============================================
// App State
// ============================================
let currentNode = decisionTree;
let history = [];
let selections = [];

// ============================================
// DOM Elements
// ============================================
const mainContent = document.getElementById('mainContent');
const progressFill = document.getElementById('progressFill');
const progressStepText = document.getElementById('progressStepText');
const breadcrumbContainer = document.getElementById('breadcrumbContainer');

// ============================================
// Render Functions
// ============================================
function getMaxDepth(node) {
    if (!node || node.result) return 0;
    if (!node.options) return 0;
    let max = 0;
    for (const opt of node.options) {
        if (opt.next) {
            const d = getMaxDepth(opt.next);
            if (d > max) max = d;
        }
    }
    return 1 + max;
}

function updateProgress() {
    const totalEstimate = Math.max(getMaxDepth(decisionTree), 1);
    const current = history.length;
    const pct = Math.min((current / totalEstimate) * 100, 100);
    progressFill.style.width = pct + '%';
    progressStepText.textContent = current === 0 ? '시작' : `${current}단계 진행 중`;
}

function updateBreadcrumb() {
    breadcrumbContainer.innerHTML = '';
    selections.forEach((sel, i) => {
        if (i > 0) {
            const arrow = document.createElement('span');
            arrow.className = 'breadcrumb-separator';
            arrow.textContent = '→';
            breadcrumbContainer.appendChild(arrow);
        }
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        item.textContent = sel;
        breadcrumbContainer.appendChild(item);
    });
}

function getColsClass(count) {
    if (count === 2) return 'options-grid--cols-2';
    if (count >= 3) return 'options-grid--cols-3';
    return '';
}

function renderQuestion(node) {
    updateProgress();
    updateBreadcrumb();

    const colsClass = getColsClass(node.options.length);
    const optionsHTML = node.options.map((opt, i) => `
        <div class="option-card option-card--${opt.color || 'blue'}" onclick="selectOption(${i})" role="button" tabindex="0">
            <span class="option-card__icon">${opt.icon}</span>
            <div class="option-card__title">${opt.label}</div>
            <div class="option-card__desc">${opt.desc}</div>
        </div>
    `).join('');

    mainContent.innerHTML = `
        <div class="step-card">
            <div class="step-card__question-label">
                <span>📋</span> STEP ${history.length + 1}
            </div>
            <h2 class="step-card__question">${node.question}</h2>
            <p class="step-card__description">${node.description}</p>
            <div class="options-grid ${colsClass}">
                ${optionsHTML}
            </div>
            ${history.length > 0 ? `
            <div class="nav-buttons">
                <button class="btn btn--secondary" onclick="goBack()">← 이전 단계</button>
                <button class="btn btn--secondary" onclick="resetAll()">🔄 처음부터</button>
            </div>
            ` : ''}
        </div>
    `;
}

function renderResult(result) {
    updateProgress();
    progressStepText.textContent = '✅ 완료!';
    progressFill.style.width = '100%';
    updateBreadcrumb();

    const conditionsHTML = result.conditions.map(c => `<li>${c}</li>`).join('');
    const pathHTML = selections.map((sel, i) => {
        let html = `<span class="path-summary__item">${sel}</span>`;
        if (i < selections.length - 1) {
            html += `<span class="path-summary__arrow">→</span>`;
        }
        return html;
    }).join('');

    mainContent.innerHTML = `
        <div class="result-card">
            <div class="result-card__badge">
                <span>🎯</span> 추천 검정 방법
            </div>
            <h2 class="result-card__title">${result.name}</h2>
            <p class="result-card__english">${result.english}</p>
            
            <div class="path-summary">${pathHTML}</div>

            <div class="result-card__section">
                <h3 class="result-card__section-title"><span>📖</span> 설명</h3>
                <div class="result-card__section-content">${result.desc}</div>
            </div>

            <div class="result-card__section">
                <h3 class="result-card__section-title"><span>✅</span> 사용 조건</h3>
                <div class="result-card__section-content">
                    <ul>${conditionsHTML}</ul>
                </div>
            </div>

            <div class="result-card__section">
                <h3 class="result-card__section-title"><span>🐍</span> Python 예시 코드</h3>
                <div class="code-block">
                    <div class="code-block__header">
                        <span class="code-block__lang">Python</span>
                        <button class="code-block__copy" onclick="copyCode()">📋 복사</button>
                    </div>
                    <div class="code-block__content">
                        <pre id="codeContent">${escapeHtml(result.code)}</pre>
                    </div>
                </div>
            </div>

            <div class="nav-buttons">
                <button class="btn btn--secondary" onclick="goBack()">← 이전 단계</button>
                <button class="btn btn--primary" onclick="resetAll()">🔄 새 검정 방법 찾기</button>
            </div>
        </div>
    `;
}

// ============================================
// Navigation Functions
// ============================================
function selectOption(index) {
    const option = currentNode.options[index];
    history.push(currentNode);
    selections.push(option.label);
    currentNode = option.next;

    if (currentNode.result) {
        renderResult(currentNode.result);
    } else {
        renderQuestion(currentNode);
    }
}

function goBack() {
    if (history.length === 0) return;
    currentNode = history.pop();
    selections.pop();
    renderQuestion(currentNode);
}

function resetAll() {
    currentNode = decisionTree;
    history = [];
    selections = [];
    renderQuestion(currentNode);
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode() {
    const code = document.getElementById('codeContent').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.code-block__copy');
        btn.textContent = '✅ 복사됨!';
        setTimeout(() => { btn.textContent = '📋 복사'; }, 2000);
    });
}

// Keyboard accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('option-card')) {
        e.target.click();
    }
});

// ============================================
// Initialize
// ============================================
renderQuestion(decisionTree);
