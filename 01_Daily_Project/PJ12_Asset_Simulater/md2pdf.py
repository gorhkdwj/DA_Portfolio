"""report.md → report.pdf 변환 (fpdf2 + markdown, 한국어 폰트 임베딩)"""

import markdown, re, os
from fpdf import FPDF
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(BASE_DIR, "malgun.ttf")
FONT_BOLD = "C:/Windows/Fonts/malgunbd.ttf"

# ── Markdown → 구조화된 블록 파싱 ──────────────────────
with open(os.path.join(BASE_DIR, "report.md"), "r", encoding="utf-8") as f:
    md_text = f.read()


class ReportPDF(FPDF):
    def __init__(self):
        super().__init__("P", "mm", "A4")
        self.add_font("MG", "", FONT_PATH)
        self.add_font("MG", "B", FONT_BOLD)
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 20, 20)

    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font("MG", "", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"- {self.page_no()} -", align="C")

    def write_heading(self, level, text):
        sizes = {1: 20, 2: 15, 3: 12}
        self.ln(4 if level > 1 else 8)
        self.set_font("MG", "B", sizes.get(level, 11))
        self.set_text_color(22, 26, 46)
        self.multi_cell(0, sizes.get(level, 11) * 0.55, text)
        if level <= 2:
            self.set_draw_color(22, 33, 62)
            self.set_line_width(0.6 if level == 1 else 0.3)
            self.line(20, self.get_y() + 1, 190, self.get_y() + 1)
            self.ln(3)
        else:
            self.ln(2)

    def write_paragraph(self, text):
        self.set_font("MG", "", 10)
        self.set_text_color(34, 34, 34)
        # Handle inline bold
        parts = re.split(r'\*\*(.+?)\*\*', text)
        for i, part in enumerate(parts):
            if i % 2 == 1:  # bold
                self.set_font("MG", "B", 10)
                self.write(6, part)
                self.set_font("MG", "", 10)
            else:
                self.write(6, part)
        self.ln(7)

    def write_blockquote(self, text):
        x = self.get_x()
        self.set_fill_color(255, 251, 230)
        self.set_draw_color(230, 180, 34)
        w = 170
        # Compute height
        self.set_font("MG", "", 9)
        self.set_text_color(60, 60, 60)
        # Draw background
        y_start = self.get_y()
        self.set_x(25)
        # Use rect + multi_cell
        lines = text.replace("**", "")
        self.multi_cell(w - 5, 5.5, lines, border=0, fill=False)
        y_end = self.get_y()
        # Draw left border
        self.set_line_width(1)
        self.line(22, y_start - 1, 22, y_end + 1)
        self.ln(4)

    def write_table(self, header, rows):
        self.set_font("MG", "", 8)
        n_cols = len(header)
        avail_w = 170
        col_widths = [avail_w / n_cols] * n_cols

        # Measure content to adjust widths
        max_lens = []
        for i in range(n_cols):
            col_texts = [header[i]] + [r[i] if i < len(r) else "" for r in rows]
            max_lens.append(max(len(t) for t in col_texts))
        total_len = sum(max_lens) or 1
        col_widths = [avail_w * (ml / total_len) for ml in max_lens]
        # Enforce min width
        col_widths = [max(w, 15) for w in col_widths]
        scale = avail_w / sum(col_widths)
        col_widths = [w * scale for w in col_widths]

        # Header
        self.set_font("MG", "B", 8)
        self.set_fill_color(22, 33, 62)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(header):
            self.cell(col_widths[i], 7, h.strip(), border=1, fill=True, align="C")
        self.ln()

        # Rows
        self.set_font("MG", "", 8)
        self.set_text_color(34, 34, 34)
        for ri, row in enumerate(rows):
            if ri % 2 == 0:
                self.set_fill_color(248, 249, 250)
            else:
                self.set_fill_color(255, 255, 255)
            for i in range(n_cols):
                val = row[i].strip() if i < len(row) else ""
                self.cell(col_widths[i], 6.5, val, border=1, fill=True)
            self.ln()
        self.ln(4)

    def write_code_block(self, code):
        self.set_fill_color(45, 45, 45)
        self.set_text_color(224, 224, 224)
        self.set_font("MG", "", 8)
        self.rect(20, self.get_y(), 170, 0)  # placeholder
        y0 = self.get_y()
        self.set_x(23)
        for line in code.split("\n"):
            if self.get_y() > 270:
                self.add_page()
            self.set_x(23)
            self.cell(164, 5, line, fill=True)
            self.ln()
        y1 = self.get_y()
        self.ln(4)

    def write_image(self, img_path):
        if not os.path.exists(img_path):
            self.write_paragraph(f"[Image not found: {img_path}]")
            return
        # Fit to page width
        img_w = 170
        try:
            with Image.open(img_path) as im:
                w_px, h_px = im.size
            img_h = img_w * (h_px / w_px)
            if self.get_y() + img_h > 270:
                self.add_page()
            self.image(img_path, x=20, w=img_w)
            self.ln(6)
        except Exception as e:
            self.write_paragraph(f"[Image error: {e}]")

    def write_list_item(self, text, indent=0):
        self.set_font("MG", "", 10)
        self.set_text_color(34, 34, 34)
        x = 22 + indent * 5
        self.set_x(x)
        self.write(6, "  •  ")
        # Handle inline bold
        parts = re.split(r'\*\*(.+?)\*\*', text)
        for i, part in enumerate(parts):
            if i % 2 == 1:
                self.set_font("MG", "B", 10)
                self.write(6, part)
                self.set_font("MG", "", 10)
            else:
                self.write(6, part)
        self.ln(7)


# ── 파싱 & PDF 생성 ──────────────────────────────────
pdf = ReportPDF()
pdf.add_page()

lines = md_text.split("\n")
i = 0
in_code_block = False
code_buffer = []
in_table = False
table_header = []
table_rows = []

while i < len(lines):
    line = lines[i]

    # Code block
    if line.strip().startswith("```"):
        if in_code_block:
            pdf.write_code_block("\n".join(code_buffer))
            code_buffer = []
            in_code_block = False
        else:
            # Flush table if pending
            if in_table:
                pdf.write_table(table_header, table_rows)
                in_table = False
                table_header = []
                table_rows = []
            in_code_block = True
        i += 1
        continue

    if in_code_block:
        code_buffer.append(line)
        i += 1
        continue

    # Table
    if "|" in line and line.strip().startswith("|"):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not in_table:
            table_header = cells
            in_table = True
        elif all(c.replace("-", "").replace(":", "").strip() == "" for c in cells):
            pass  # separator row
        else:
            table_rows.append(cells)
        i += 1
        continue
    else:
        if in_table:
            pdf.write_table(table_header, table_rows)
            in_table = False
            table_header = []
            table_rows = []

    stripped = line.strip()

    # Empty line
    if stripped == "":
        i += 1
        continue

    # HR
    if stripped == "---":
        pdf.set_draw_color(22, 33, 62)
        pdf.set_line_width(0.5)
        pdf.line(20, pdf.get_y() + 3, 190, pdf.get_y() + 3)
        pdf.ln(8)
        i += 1
        continue

    # Heading
    m = re.match(r'^(#{1,3})\s+(.*)', line)
    if m:
        level = len(m.group(1))
        text = m.group(2).strip()
        pdf.write_heading(level, text)
        i += 1
        continue

    # Image
    m = re.match(r'!\[([^\]]*)\]\(([^)]+)\)', stripped)
    if m:
        img_path = os.path.join(BASE_DIR, m.group(2))
        pdf.write_image(img_path)
        i += 1
        continue

    # Blockquote
    if stripped.startswith(">"):
        bq_lines = []
        while i < len(lines) and lines[i].strip().startswith(">"):
            bq_lines.append(lines[i].strip().lstrip("> ").strip())
            i += 1
        pdf.write_blockquote("\n".join(bq_lines))
        continue

    # List item
    if stripped.startswith("- ") or stripped.startswith("* "):
        text = stripped[2:].strip()
        pdf.write_list_item(text)
        i += 1
        continue

    # Numbered list
    m2 = re.match(r'^(\d+)\.\s+(.*)', stripped)
    if m2:
        text = m2.group(2).strip()
        pdf.write_list_item(text)
        i += 1
        continue

    # Paragraph (also handle $$ math as plain text)
    pdf.write_paragraph(stripped.replace("$$", ""))
    i += 1

# Flush remaining table
if in_table:
    pdf.write_table(table_header, table_rows)

output_path = os.path.join(BASE_DIR, "report.pdf")
pdf.output(output_path)
size_kb = os.path.getsize(output_path) / 1024
print(f"PDF saved: report.pdf ({size_kb:.0f} KB)")
