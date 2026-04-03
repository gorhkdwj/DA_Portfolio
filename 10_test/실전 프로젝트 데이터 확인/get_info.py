import pandas as pd
import io

data_files = {
    "profile.csv": "profile.csv",
    "Courses.csv": "Courses.csv",
    "stock_details_5_years.csv": "stock_details_5_years.csv",
}

with open("clean_data_info.txt", "w", encoding="utf-8") as f:
    for name, path in data_files.items():
        try:
            df = pd.read_csv(path)
            f.write(f"\n{'='*40}\n>>> {name}\n")

            buf = io.StringIO()
            df.info(buf=buf)
            f.write(buf.getvalue() + "\n")

            f.write("--- FIRST 3 ROWS ---\n")
            f.write(df.head(3).to_markdown() + "\n")

            f.write("--- MISSING VALUES ---\n")
            f.write(df.isnull().sum().to_string() + "\n")
        except Exception as e:
            f.write(f"\nFailed to load {name}: {e}\n")
