filename = "01_preprocessing_v2.ipynb"
with open(filename, "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "df2 =" in line or "df2 =" in line:  # simplistic check
            print(f"DF2_DEF at line {i+1}: {line.strip()[:100]}")
        if "df2['AMOUNT_PER_PYEONG'] =" in line:
            print(f"DF2_AMNT at line {i+1}: {line.strip()[:100]}")
        if "visualize_quarterly_price_heatmap" in line:
            print(f"FUNCTION at line {i+1}: {line.strip()[:100]}")
