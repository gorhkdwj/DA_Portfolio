import json

path = "01_Daily_Project/PJ14_Sungnam_News_Crawling/PJ14_AI_Analysis.ipynb"
nb = json.load(open(path, encoding="utf-8"))

# 셀 4 = 6-2 (인덱스 4)
src = "".join(nb["cells"][4]["source"])
src = src.replace(
    "agent = Agent(ai_model, result_type=ArticleAnalysis, system_prompt=_SYSTEM_PROMPT)",
    "agent = Agent(ai_model, output_type=ArticleAnalysis, system_prompt=_SYSTEM_PROMPT)",
)
nb["cells"][4]["source"] = src

with open(path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)
print("수정 완료")
