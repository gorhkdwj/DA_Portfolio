import json

filename = "01_preprocessing_v2.ipynb"
target_line = 'visualize_quarterly_price_heatmap("아파트", 2018, 1, 26)'
fix_lines = [
    "if 'AMOUNT_PER_PYEONG' not in df2.columns:\n",
    "    df2['AMOUNT_PER_PYEONG'] = df2['THING_AMT'] / df2['ARCH_AREA'] * 3.3058\n",
    "\n",
]

with open(filename, "r", encoding="utf-8") as f:
    nb = json.load(f)

found = False
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        source = cell["source"]
        for i, line in enumerate(source):
            if target_line in line:
                # Prepend fix lines
                # Check if already fixed to avoid duplicates
                if i > 0 and "AMOUNT_PER_PYEONG" in source[i - 1]:
                    print("Already fixed?")
                else:
                    new_source = source[:i] + fix_lines + source[i:]
                    cell["source"] = new_source
                    found = True
                break
    if found:
        break

if found:
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(
            nb, f, indent=1, ensure_ascii=False
        )  # indent=1 to match usual ipynb style? or just default. usually 1 or 2.
    print("Successfully patched notebook.")
else:
    print("Target line not found.")
