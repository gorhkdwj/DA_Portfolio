import json

notebook_path = (
    r"c:\Users\gorhk\DA_Portfolio\10_test\실전 프로젝트 데이터 확인\education.ipynb"
)

with open(notebook_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Modify 4th Cell (Index 3) to load Courses.csv instead of stock_details
nb["cells"][3]["source"] = [
    "# ── 데이터 로드 ──\n",
    "df = pd.read_csv('Courses.csv')\n",
    "display(df.head(3))",
]

# Add a cell for general data exploration
cell_explore = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# 데이터 정보 및 결측치 확인\n",
        "print('--- 데이터 정보 ---')\n",
        "df.info()\n",
        "print('\\n--- 결측치 확인 ---')\n",
        "display(df.isnull().sum())",
    ],
}

# Add a cell for data preprocessing logic
cell_preprocess = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# ── 1. 불필요하거나 결측치가 과하게 많은 컬럼 제거 ──\n",
        "drop_cols = ['roles', 'incomplete_flag', 'nplay_video']\n",
        "df.drop(columns=drop_cols, inplace=True, errors='ignore')\n",
        "\n",
        "# ── 2. 날짜 데이터 형변환 및 기간 파생변수 생성 ──\n",
        "df['start_time_DI'] = pd.to_datetime(df['start_time_DI'], errors='coerce')\n",
        "df['last_event_DI'] = pd.to_datetime(df['last_event_DI'], errors='coerce')\n",
        "df['duration_days'] = (df['last_event_DI'] - df['start_time_DI']).dt.days\n",
        "\n",
        "# ── 3. 결측치 대치 ──\n",
        "# 범주형 변수 -> 'Unknown'\n",
        "cat_cols = ['LoE_DI', 'gender']\n",
        "for col in cat_cols:\n",
        "    if col in df.columns:\n",
        "        df[col] = df[col].fillna('Unknown')\n",
        "\n",
        "# 수치형 변수 -> grade는 점수형태로 변환 후 0으로 채우고 나머지는 중앙값\n",
        "if 'grade' in df.columns:\n",
        "    df['grade'] = pd.to_numeric(df['grade'], errors='coerce').fillna(0)\n",
        "\n",
        "num_cols = ['YoB', 'nchapters', 'nevents', 'ndays_act', 'duration_days']\n",
        "for col in num_cols:\n",
        "    if col in df.columns:\n",
        "        df[col] = df[col].fillna(df[col].median())\n",
        "\n",
        "# ── 4. 나이 파생변수 생성 ──\n",
        "if 'start_time_DI' in df.columns and 'YoB' in df.columns:\n",
        "    df['Age'] = df['start_time_DI'].dt.year - df['YoB']\n",
        "\n",
        "print('--- 처리 후 결측치 확인 ---')\n",
        "display(df.isnull().sum())",
    ],
}

nb["cells"].extend([cell_explore, cell_preprocess])

with open(notebook_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print("Notebook successfully updated.")
