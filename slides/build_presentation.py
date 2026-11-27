"""Generate high-DPI charts and build the 12-slide SmartRetail Presentation (.pptx)."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt


ROOT_DIR = Path(__file__).resolve().parent.parent
CLEANED_DIR = ROOT_DIR / "data" / "cleaned"
SLIDES_DIR = ROOT_DIR / "slides"
CHARTS_DIR = SLIDES_DIR / "charts"
SUMMARY_PATH = ROOT_DIR / "web" / "src" / "data" / "summary.json"

# Palette (Bright Green & White Modern SaaS)
C_BG = RGBColor(0xF5, 0xFB, 0xF7)
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_DARK_GREEN = RGBColor(0x06, 0x5F, 0x46)
C_MED_GREEN = RGBColor(0x04, 0x78, 0x57)
C_BRIGHT_GREEN = RGBColor(0x10, 0xB9, 0x81)
C_MINT_BG = RGBColor(0xEC, 0xFD, 0xF5)
C_BORDER = RGBColor(0xCE, 0xE5, 0xD7)
C_TEXT = RGBColor(0x0F, 0x17, 0x2A)
C_MUTED = RGBColor(0x47, 0x55, 0x69)

FONT_TH = "Leelawadee UI"


def generate_charts(merged: pd.DataFrame, summary: dict) -> dict[str, Path]:
    """Render 4 clean 300-DPI charts directly from verified cleaned data."""
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    plt.rcParams["font.sans-serif"] = ["Leelawadee UI", "Tahoma", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False

    paths: dict[str, Path] = {}

    # 1. Monthly Clean vs Raw
    m_df = pd.DataFrame(summary["monthlySeries"])
    fig, ax = plt.subplots(figsize=(8.2, 4.2), dpi=300)
    x = range(len(m_df))
    ax.plot(x, m_df["rawRevenue"] / 1e6, "--", color="#94A3B8", linewidth=2.0, label="Raw (with 50 Outliers)")
    ax.plot(x, m_df["cleanRevenue"] / 1e6, "-o", color="#047857", linewidth=2.8, markersize=5, label="Cleaned (49,200 Txns)")
    ax.fill_between(x, m_df["cleanRevenue"] / 1e6, color="#10B981", alpha=0.14)
    ax.set_xticks(list(x))
    ax.set_xticklabels([m[5:] for m in m_df["month"]], fontsize=10)
    ax.set_ylabel("Revenue (Million THB)", fontsize=10, color="#065F46", fontweight="bold")
    ax.set_title("2025 Monthly Revenue: Clean vs Raw Comparison", fontsize=12, fontweight="bold", color="#065F46", pad=10)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.legend(frameon=False, fontsize=9)
    p1 = CHARTS_DIR / "monthly_trend.png"
    fig.tight_layout()
    fig.savefig(p1, transparent=False, facecolor="white")
    plt.close(fig)
    paths["monthly"] = p1

    # 2. Category Pareto
    cat_rev = merged.groupby("Category")["Total_Amount"].sum().sort_values(ascending=True)
    fig, ax = plt.subplots(figsize=(7.6, 4.2), dpi=300)
    colors = ["#6EE7B7", "#34D399", "#10B981", "#059669", "#065F46"]
    bars = ax.barh(cat_rev.index, cat_rev.values / 1e6, color=colors, height=0.58)
    total = cat_rev.sum()
    for bar, val in zip(bars, cat_rev.values):
        ax.text(val / 1e6 + 1.2, bar.get_y() + bar.get_height() / 2, f"{val/1e6:.2f}M ({val/total*100:.1f}%)", va="center", fontsize=9.5, fontweight="bold", color="#0F172A")
    ax.set_xlim(0, max(cat_rev.values / 1e6) * 1.26)
    ax.set_xlabel("Clean Revenue (Million THB)", fontsize=10, color="#065F46", fontweight="bold")
    ax.set_title("Revenue Concentration by Product Category", fontsize=12, fontweight="bold", color="#065F46", pad=10)
    ax.grid(axis="x", linestyle="--", alpha=0.35)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    p2 = CHARTS_DIR / "category_pareto.png"
    fig.tight_layout()
    fig.savefig(p2, facecolor="white")
    plt.close(fig)
    paths["category"] = p2

    # 3. Region Breakdown
    reg_rev = merged.groupby("Region")["Total_Amount"].sum().sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(7.4, 4.0), dpi=300)
    r_colors = ["#065F46", "#047857", "#059669", "#10B981", "#34D399"]
    bars = ax.bar(reg_rev.index, reg_rev.values / 1e6, color=r_colors, width=0.55)
    for bar, val in zip(bars, reg_rev.values):
        ax.text(bar.get_x() + bar.get_width() / 2, val / 1e6 + 0.8, f"{val/1e6:.2f}M\n({val/total*100:.1f}%)", ha="center", va="bottom", fontsize=8.8, fontweight="bold", color="#0F172A")
    ax.set_ylim(0, max(reg_rev.values / 1e6) * 1.22)
    ax.set_ylabel("Clean Revenue (Million THB)", fontsize=10, color="#065F46", fontweight="bold")
    ax.set_title("Regional Sales Performance (Central = 3.36x West)", fontsize=12, fontweight="bold", color="#065F46", pad=10)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    p3 = CHARTS_DIR / "region_sales.png"
    fig.tight_layout()
    fig.savefig(p3, facecolor="white")
    plt.close(fig)
    paths["region"] = p3

    # 4. Channel & Payment Mix
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(8.2, 3.8), dpi=300)
    chan_rev = merged.groupby("Channel")["Total_Amount"].sum().sort_values(ascending=False)
    ax1.pie(chan_rev.values, labels=[f"{k}\n({v/total*100:.1f}%)" for k, v in chan_rev.items()], colors=["#047857", "#34D399"], wedgeprops={"width": 0.45, "edgecolor": "white"}, textprops={"fontsize": 9.5, "fontweight": "bold"})
    ax1.set_title("Channel Mix", fontsize=11, fontweight="bold", color="#065F46")

    pay_rev = merged.groupby("Payment_Method")["Total_Amount"].sum().sort_values(ascending=False)
    ax2.pie(pay_rev.values, labels=[f"{k}\n({v/total*100:.1f}%)" for k, v in pay_rev.items()], colors=["#065F46", "#10B981", "#A7F3D0"], wedgeprops={"width": 0.45, "edgecolor": "white"}, textprops={"fontsize": 9.0, "fontweight": "bold"})
    ax2.set_title("Payment Method Mix", fontsize=11, fontweight="bold", color="#065F46")
    p4 = CHARTS_DIR / "channel_payment.png"
    fig.tight_layout()
    fig.savefig(p4, facecolor="white")
    plt.close(fig)
    paths["mix"] = p4

    return paths


def set_slide_bg(slide, color: RGBColor = C_BG) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_header(slide, section_tag: str, title: str, slide_num: int) -> None:
    """Add consistent modern green-white slide header and slide number badge."""
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.4), Inches(2.5), Inches(0.36))
    pill.fill.solid()
    pill.fill.fore_color.rgb = C_MINT_BG
    pill.line.color.rgb = C_BRIGHT_GREEN
    tf = pill.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.text = section_tag
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_TH
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_DARK_GREEN

    title_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.84), Inches(11.4), Inches(0.65))
    tf2 = title_box.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = title
    p2.font.name = FONT_TH
    p2.font.size = Pt(24)
    p2.font.bold = True
    p2.font.color.rgb = C_DARK_GREEN

    num_box = slide.shapes.add_textbox(Inches(12.0), Inches(0.4), Inches(0.8), Inches(0.36))
    p3 = num_box.text_frame.paragraphs[0]
    p3.text = f"{slide_num} / 12"
    p3.alignment = PP_ALIGN.RIGHT
    p3.font.name = FONT_TH
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_MUTED


def add_card(slide, left: float, top: float, width: float, height: float, fill_color: RGBColor = C_WHITE):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.adjustments[0] = 0.04
    card.fill.solid()
    card.fill.fore_color.rgb = fill_color
    card.line.color.rgb = C_BORDER
    card.line.width = Pt(1)
    return card


def add_bullets(slide, left: float, top: float, width: float, height: float, items: list[tuple[str, str]], font_size: int = 14) -> None:
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    for idx, (lead, body) in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = f"• {lead}: "
        r1.font.name = FONT_TH
        r1.font.size = Pt(font_size)
        r1.font.bold = True
        r1.font.color.rgb = C_DARK_GREEN

        r2 = p.add_run()
        r2.text = body
        r2.font.name = FONT_TH
        r2.font.size = Pt(font_size)
        r2.font.color.rgb = C_TEXT


def add_what_so_now(slide, what: str, so_what: str, now_what: str) -> None:
    add_card(slide, 0.6, 5.55, 12.1, 1.5, C_MINT_BG)
    add_bullets(
        slide,
        0.8,
        5.68,
        11.7,
        1.3,
        [("What", what), ("So What", so_what), ("Now What", now_what)],
        font_size=12,
    )


def build_deck() -> Path:
    SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    merged = pd.read_parquet(CLEANED_DIR / "merged_cleaned.parquet")
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
    charts = generate_charts(merged, summary)

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # Slide 1: Cover
    s1 = prs.slides.add_slide(blank)
    set_slide_bg(s1, C_DARK_GREEN)
    pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.1), Inches(4.8), Inches(0.45))
    pill.fill.solid()
    pill.fill.fore_color.rgb = C_MED_GREEN
    pill.line.color.rgb = C_BRIGHT_GREEN
    p = pill.text_frame.paragraphs[0]
    p.text = "การแข่งขันทักษะการวิเคราะห์ข้อมูล (ปวช.) ระดับจังหวัด"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_TH
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    tb = s1.shapes.add_textbox(Inches(0.8), Inches(1.85), Inches(11.6), Inches(2.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "SmartRetail Thailand\nCustomer Behavior & Sales Intelligence"
    p1.font.name = FONT_TH
    p1.font.size = Pt(40)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE

    p2 = tf.add_paragraph()
    p2.space_before = Pt(14)
    p2.text = "Problem  →  Method  →  Findings  →  Recommendations"
    p2.font.name = FONT_TH
    p2.font.size = Pt(18)
    p2.font.color.rgb = RGBColor(0xA7, 0xF3, 0xD0)

    kpis = [
        ("50,000 → 49,200", "Cleaned Transactions"),
        ("100.0%", "FK Match Rate"),
        ("฿142.16M", "Clean Revenue (2025)"),
        ("5 Insights", "Actionable Strategy"),
    ]
    for idx, (val, lbl) in enumerate(kpis):
        x = 0.8 + idx * 3.0
        box = add_card(s1, x, 5.1, 2.75, 1.35, C_MED_GREEN)
        box.line.color.rgb = C_BRIGHT_GREEN
        t = s1.shapes.add_textbox(Inches(x + 0.15), Inches(5.25), Inches(2.45), Inches(1.1))
        ptf = t.text_frame
        pa = ptf.paragraphs[0]
        pa.text = val
        pa.font.name = FONT_TH
        pa.font.size = Pt(22)
        pa.font.bold = True
        pa.font.color.rgb = C_WHITE
        pb = ptf.add_paragraph()
        pb.text = lbl
        pb.font.name = FONT_TH
        pb.font.size = Pt(12)
        pb.font.color.rgb = RGBColor(0xD1, 0xFA, 0xE5)

    # Slide 2: Problem
    s2 = prs.slides.add_slide(blank)
    set_slide_bg(s2)
    add_header(s2, "1. PROBLEM", "สถานการณ์ธุรกิจ: ยอดขายทั้งปีชะลอตัวและข้อมูลดิบมีสัญญาณรบกวน", 2)
    add_card(s2, 0.6, 1.7, 12.1, 3.6)
    add_bullets(
        s2,
        0.9,
        1.95,
        11.5,
        3.1,
        [
            ("โจทย์ทางธุรกิจ", "SmartRetail Thailand จำหน่ายสินค้าอุปโภคบริโภคทั้ง In-Store และ Online แต่ประสบปัญหาการเติบโตลดลง"),
            ("ภาพรวมชุดข้อมูลจริง", "ธุรกรรม 50,000 รายการ (ปี 2025) เชื่อมกับฐานลูกค้า 1,000 ราย (Basic 499, Silver 304, Gold 142, Platinum 55)"),
            ("หลักฐานการชะลอตัว", "ยอดขายสะอาดแกว่งตัวในกรอบแคบ ฿10.97M–12.53M/เดือน โดย Q4 เทียบ Q1 โตเพียง +0.41% และหดตัว -2.49% จาก Q3"),
            ("ความเสี่ยงในข้อมูลดิบ", "หากไม่คลีน Outlier 50 บิล (฿14.54M) และ Missing 750 แถว รายงานผู้บริหารจะคลาดเคลื่อนทันที"),
        ],
        font_size=15,
    )
    add_what_so_now(
        s2,
        "รายได้รายไตรมาสหยุดนิ่ง (Q1: 35.28M, Q2: 35.12M, Q3: 36.33M, Q4: 35.42M)",
        "บริษัทไม่สามารถเติบโตแบบ Organic ได้หากยังพึ่งพารูปแบบการขายเดิม",
        "สร้าง Pipeline คลีนข้อมูลและสกัด Insight เพื่อหาโอกาสเพิ่ม Basket Size และขยายช่องทาง/ภูมิภาค",
    )

    # Slide 3: Method (Data Prep & Integrity)
    s3 = prs.slides.add_slide(blank)
    set_slide_bg(s3)
    add_header(s3, "2. METHOD · DATA PIPELINE", "การตรวจสอบ Schema, Integrity และการจัดการ Missing / Outliers", 3)
    steps = [
        ("1. Raw Input", "50,000 บิล / 1,000 ลูกค้า\nFK Match = 100.0%"),
        ("2. Drop Dual-Missing", "-750 แถว (1.50%)\nขาด Units & Total พร้อมกัน"),
        ("3. Isolate Outliers", "-50 แถว (0.10%)\n999 / 1,200 / 1,500 ชิ้น"),
        ("4. Clean + DuckDB", "49,200 แถวสะอาด\n0 Nulls · Parity 100%"),
    ]
    for i, (st, desc) in enumerate(steps):
        x = 0.6 + i * 3.1
        add_card(s3, x, 1.75, 2.85, 1.9, C_WHITE)
        tb = s3.shapes.add_textbox(Inches(x + 0.15), Inches(1.9), Inches(2.55), Inches(1.6))
        tf = tb.text_frame
        tf.word_wrap = True
        pa = tf.paragraphs[0]
        pa.text = st
        pa.font.name = FONT_TH
        pa.font.size = Pt(15)
        pa.font.bold = True
        pa.font.color.rgb = C_DARK_GREEN
        pb = tf.add_paragraph()
        pb.space_before = Pt(8)
        pb.text = desc
        pb.font.name = FONT_TH
        pb.font.size = Pt(14)
        pb.font.color.rgb = C_TEXT

    add_card(s3, 0.6, 3.9, 12.1, 3.1, C_MINT_BG)
    add_bullets(
        s3,
        0.9,
        4.1,
        11.5,
        2.7,
        [
            ("IQR Method บน Units_Sold", "Q1=6, Median=13, Q3=19, IQR=13 → Upper Fence = 38.5 ชิ้น (จับได้ 50 แถว)"),
            ("Z-Score Cross-Check", "Mean=13.75, Std=40.57 → |Z| > 3 (> 135.45 ชิ้น) จับได้ตรงกันพอดี 50 แถว"),
            ("Audit Log (ไม่ลบทิ้งถาวร)", "แยก 50 แถวมูลค่า ฿14,541,495 ลง outliers_audit.csv เพื่อตรวจสอบ Error/B2B ย้อนหลัง"),
        ],
        font_size=14,
    )

    # Slide 4: Method (Before vs After)
    s4 = prs.slides.add_slide(blank)
    set_slide_bg(s4)
    add_header(s4, "2. METHOD · IMPACT", "ผลลัพธ์เชิงสถิติ Before vs After Cleaning: ลดความแปรปรวนเทียม -71.98%", 4)
    add_card(s4, 0.6, 1.7, 12.1, 3.55)
    tbl_shape = s4.shapes.add_table(5, 4, Inches(0.85), Inches(1.9), Inches(11.6), Inches(3.15))
    tbl = tbl_shape.table
    headers = ["ตัวชี้วัด (Total_Amount, บาท)", "ก่อน Clean (n = 49,250)", "หลัง Clean (n = 49,200)", "ความเปลี่ยนแปลง"]
    rows_data = [
        ["รวมยอดขาย (Total Revenue)", "฿156,698,000.00", "฿142,156,505.00", "แยก Outlier ออก -฿14,541,495 (-9.28%)"],
        ["ค่าเฉลี่ย (Mean)", "฿3,181.69", "฿2,889.36", "ลดค่าเฉลี่ยสูงเกินจริง (-9.19%)"],
        ["ส่วนเบี่ยงเบนมาตรฐาน (Std. Dev.)", "฿15,697.61", "฿4,399.19", "ลดความแปรปรวนเทียม -71.98%"],
        ["Min / Median / IQR / Max", "35 / 1,035 / 2,380 / 1,335,000", "35 / 1,035 / 2,380 / 21,360", "Quantile หลักคงที่ 100%, Max สมจริง"],
    ]
    for c_i, h in enumerate(headers):
        cell = tbl.cell(0, c_i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_DARK_GREEN
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_TH
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
    for r_i, r_vals in enumerate(rows_data, start=1):
        for c_i, val in enumerate(r_vals):
            cell = tbl.cell(r_i, c_i)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_WHITE if r_i % 2 else C_BG
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_TH
            p.font.size = Pt(12.5)
            p.font.bold = c_i in (0, 2)
            p.font.color.rgb = C_DARK_GREEN if c_i == 2 else C_TEXT
    add_what_so_now(
        s4,
        "Outliers เพียง 0.10% ของรายการ (50 บิล) ดึง Std สูงขึ้นกว่า 3.5 เท่า และบิดเบือนรายได้รวม 9.28%",
        "การวิเคราะห์พฤติกรรมค้าปลีกปกติต้องยึดฐาน Clean 49,200 แถวเท่านั้น",
        "ล็อกชุดข้อมูลสะอาดใน DuckDB/Parquet และใช้ test_clean_data.py ตรวจอัตโนมัติทุกครั้ง",
    )

    # Slide 5: Finding 1 - Category Pareto
    s5 = prs.slides.add_slide(blank)
    set_slide_bg(s5)
    add_header(s5, "3. FINDINGS · #1 PARETO", "Household และ Personal Care สร้างรายได้ถึง 79.78% (r = +0.8123)", 5)
    add_card(s5, 0.6, 1.65, 7.6, 3.7)
    s5.shapes.add_picture(str(charts["category"]), Inches(0.72), Inches(1.75), width=Inches(7.35))
    add_card(s5, 8.45, 1.65, 4.25, 3.7)
    add_bullets(
        s5,
        8.65,
        1.9,
        3.85,
        3.3,
        [
            ("Household ครองแชมป์", "฿82.49M (58.03%) จากราคาต่อหน่วย ฿890"),
            ("ปริมาณซื้อเท่ากันทุกหมวด", "เฉลี่ย ~12.50 ชิ้น/บิล, Corr(Price, Units) = -0.0065"),
            ("แรงขับเคลื่อนยอดต่อบิล", "Corr(Price_Per_Unit, Total_Amount) = +0.8123"),
        ],
        font_size=13,
    )
    add_what_so_now(
        s5,
        "Dry Food + Beverages + Snacks มีสัดส่วนบิล 64.64% แต่ทำเงินรวมกันเพียง 20.22%",
        "ลูกค้าเข้ามาซื้อของกินบ่อย แต่บิลมูลค่าต่ำหากไม่หยิบสินค้ากลุ่ม Household/Personal Care",
        "จัดชุด Bundle จับคู่สินค้าอุปโภคบริโภคขายดีเข้ากับ Household เพื่อยกระดับ Basket Size",
    )

    # Slide 6: Finding 2 - Monthly Trend
    s6 = prs.slides.add_slide(blank)
    set_slide_bg(s6)
    add_header(s6, "3. FINDINGS · #2 TIME SERIES", "ยอดขายจริงชะลอตัวคงที่ทั้งปี — ข้อมูลดิบสร้างภาพลวงตาเดือน มิ.ย. & ส.ค.", 6)
    add_card(s6, 0.6, 1.65, 8.1, 3.7)
    s6.shapes.add_picture(str(charts["monthly"]), Inches(0.72), Inches(1.75), width=Inches(7.85))
    add_card(s6, 8.95, 1.65, 3.75, 3.7)
    add_bullets(
        s6,
        9.15,
        1.9,
        3.35,
        3.3,
        [
            ("ภาพลวงตาใน Raw", "มิ.ย. (14.93M) และ ส.ค. (15.52M) พุ่งสูงเพราะมีบิล 999–1,500 ชิ้น"),
            ("ความจริงหลัง Clean", "ยอดจริงแกว่งตัวในกรอบ ฿10.97M–12.53M และ Q4 ลดลง -2.49%"),
            ("เดือนจุดอ่อน", "ก.พ. (10.97M), พ.ค. (11.18M), พ.ย. (11.39M)"),
        ],
        font_size=13,
    )
    add_what_so_now(
        s6,
        "ยอดขายสะอาดทั้งปี 2025 ไม่เติบโตตามเป้าหมาย (Q4 เทียบ Q1 เพียง +0.41%)",
        "การดูข้อมูลดิบอาจทำให้ทีมบริหารชะล่าใจว่ากลางปีเติบโตดี",
        "ตั้ง Alert เตือนบิลผิดปกติเกิน 38.5 ชิ้น และวางแคมเปญกระตุ้นช่วง Low Season ล่วงหน้า",
    )

    # Slide 7: Finding 3 - Channel & Payment
    s7 = prs.slides.add_slide(blank)
    set_slide_bg(s7)
    add_header(s7, "3. FINDINGS · #3 OMNICHANNEL", "Online นำหน้า 55.53% และการชำระเงินดิจิทัลครองตลาด 70.54%", 7)
    add_card(s7, 0.6, 1.65, 8.1, 3.7)
    s7.shapes.add_picture(str(charts["mix"]), Inches(0.72), Inches(1.8), width=Inches(7.85))
    add_card(s7, 8.95, 1.65, 3.75, 3.7)
    add_bullets(
        s7,
        9.15,
        1.9,
        3.35,
        3.3,
        [
            ("Online ฿78.95M", "สูงกว่า In-Store (฿63.21M) ทั้งจำนวนบิลและมูลค่า"),
            ("Digital Payment", "Credit Card (40.51%) + PromptPay (30.03%) = 70.54%"),
            ("โอกาส O2O", "หน้าร้านยังมีสัดส่วน Cash สูงกว่าและโตช้ากว่าออนไลน์"),
        ],
        font_size=13,
    )
    add_what_so_now(
        s7,
        "ลูกค้ากว่า 70% คุ้นเคยการจ่ายดิจิทัล และ 55.53% ซื้อผ่านออนไลน์",
        "หน้าร้าน In-Store ยังขาดแรงดึงดูดและไม่ได้เชื่อมโยงกับฐานลูกค้าออนไลน์",
        "เปิดบริการ Click & Collect และโปรโมชัน QR PromptPay Cashback ที่หน้าร้าน",
    )

    # Slide 8: Finding 4 - Region
    s8 = prs.slides.add_slide(blank)
    set_slide_bg(s8)
    add_header(s8, "3. FINDINGS · #4 REGIONAL GAP", "ช่องว่างภูมิภาค: ภาคกลางทำยอดสูงกว่าภาคตะวันตกถึง 3.36 เท่า", 8)
    add_card(s8, 0.6, 1.65, 7.6, 3.7)
    s8.shapes.add_picture(str(charts["region"]), Inches(0.72), Inches(1.75), width=Inches(7.35))
    add_card(s8, 8.45, 1.65, 4.25, 3.7)
    add_bullets(
        s8,
        8.65,
        1.9,
        3.85,
        3.3,
        [
            ("Central ฿50.18M", "ครองสัดส่วน 35.30% ของรายได้ทั้งประเทศ"),
            ("ตลาดรอง", "North 20.16% · Northeast 19.13% · South 14.90%"),
            ("ตลาดโอกาส (West)", "เพียง ฿14.94M (10.51%) ต่ำกว่าภาคกลาง 3.36 เท่า"),
        ],
        font_size=13,
    )
    add_what_so_now(
        s8,
        "รายได้บริษัทพึ่งพิงภาคกลางมากถึง 35.30% ขณะที่ West และ South ยังมีส่วนแบ่งต่ำ",
        "หากฐานภาคกลางอิ่มตัว ยอดรวมจะหยุดนิ่งทันที",
        "จัด Localized Campaign และลดเกณฑ์ส่งฟรีเฉพาะภาค West และ South เพื่อขยายฐาน",
    )

    # Slide 9: Finding 5 - Membership Tier
    s9 = prs.slides.add_slide(blank)
    set_slide_bg(s9)
    add_header(s9, "3. FINDINGS · #5 LOYALTY", "ระดับสมาชิกยังไม่สร้างความแตกต่างด้านยอดใช้จ่ายต่อคน (~฿142k/คน)", 9)
    tiers = summary["tierStats"]
    for idx, t in enumerate(tiers):
        x = 0.6 + idx * 3.1
        add_card(s9, x, 1.75, 2.85, 3.45, C_WHITE)
        tb = s9.shapes.add_textbox(Inches(x + 0.18), Inches(1.95), Inches(2.5), Inches(3.0))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = f"{t['tier']} ({t['customers']} คน)"
        p0.font.name = FONT_TH
        p0.font.size = Pt(16)
        p0.font.bold = True
        p0.font.color.rgb = C_DARK_GREEN
        for line in [
            f"ยอดรวม: ฿{t['revenue']/1e6:.2f}M",
            f"เฉลี่ย/คน: ฿{t['avgRevenuePerCustomer']:,.0f}",
            f"ความถี่: {t['avgTxnsPerCustomer']} บิล/คน",
        ]:
            pl = tf.add_paragraph()
            pl.space_before = Pt(12)
            pl.text = line
            pl.font.name = FONT_TH
            pl.font.size = Pt(14)
            pl.font.color.rgb = C_TEXT
    add_what_so_now(
        s9,
        "ยอดใช้จ่ายเฉลี่ย/คนของ Basic (฿140.5k) และ Platinum (฿144.2k) แทบไม่ต่างกัน",
        "โปรแกรมสมาชิกปัจจุบันยังไม่จูงใจให้กลุ่ม VIP ซื้อซ้ำมากขึ้น หรือดึง Basic (499 คน) อัปเกรด",
        "ออกแบบ Tiered Rewards ที่ให้ส่วนลดเฉพาะหมวด Household/ส่งฟรีสำหรับ Gold & Platinum",
    )

    # Slide 10: Web System & Live Demo
    s10 = prs.slides.add_slide(blank)
    set_slide_bg(s10)
    add_header(s10, "3. LIVE SYSTEM · WEB DASHBOARD", "ระบบ SmartRetail Web Dashboard: ทันสมัย เร็ว ครบเกณฑ์ UX/Performance", 10)
    add_card(s10, 0.6, 1.7, 12.1, 3.6)
    add_bullets(
        s10,
        0.9,
        1.95,
        11.5,
        3.1,
        [
            ("สถาปัตยกรรมความเร็วสูง", "Next.js + Pre-aggregated summary.json (38.7 KB) + Compact 49,200 rows กรองหลายมิติระดับมิลลิวินาที"),
            ("Overview → Detail ≤ 3 คลิก", "คลิกกราฟเพื่อ Filter, กดแถวลูกค้าเปิด Customer 360° Drawer, พร้อม Loading / Empty / Error States"),
            ("การใช้งานจริง & สำรองออฟไลน์", "Deploy บน Vercel Cloud พร้อม Test Login (judge@smartretail.th / SmartRetail2025) และ run_dashboard.bat ออฟไลน์"),
            ("การส่งออกและคู่มือ", "กด Export Filtered CSV ได้ทันที พร้อม Infographic User Manual และ Presentation Mode เต็มจอ"),
        ],
        font_size=14,
    )
    add_what_so_now(
        s10,
        "ผู้บริหารและทีมปฏิบัติการสามารถตรวจสอบ KPI, กราฟ, 50 Outliers และบิลรายตัวในหน้าเดียว",
        "ลดเวลาสรุปรายงานประจำเดือนและป้องกันการใช้ตัวเลขที่ยังไม่คลีน",
        "ใช้ Presentation Mode ในเว็บสาธิตการ Drill-down สดต่อคณะกรรมการ",
    )

    # Slide 11: Recommendations
    s11 = prs.slides.add_slide(blank)
    set_slide_bg(s11)
    add_header(s11, "4. RECOMMENDATIONS", "แผนปฏิบัติการเชิงธุรกิจ 5 ข้อ พร้อมผู้รับผิดชอบ กรอบเวลา และเป้าหมาย", 11)
    rec_shape = s11.shapes.add_table(6, 4, Inches(0.6), Inches(1.7), Inches(12.1), Inches(5.1))
    rt = rec_shape.table
    r_headers = ["ข้อเสนอแนะเชิงปฏิบัติ (Action)", "หลักฐานอ้างอิง", "ผู้รับผิดชอบ (Owner)", "กรอบเวลา (Timeline)"]
    r_rows = [
        ["1. จัด Cross-Sell Bundle (Dry Food/Beverages + Household)", "Household 58.03% · r = +0.8123", "Merchandising & Marketing", "เดือนที่ 1–2"],
        ["2. ตั้งมาตรฐาน Cleaned Pipeline + แคมเปญ Low Season", "ก.พ./พ.ค./พ.ย. ต่ำ + Outlier 50 บิล", "Data & Operations", "สัปดาห์ที่ 1–4"],
        ["3. ผลักดัน O2O Click & Collect + QR PromptPay Cashback", "Online 55.53% · Digital Pay 70.54%", "E-Commerce & Store Ops", "ไตรมาสที่ 1–2"],
        ["4. แคมเปญ Localized Promotion & ลดเกณฑ์ส่งฟรีภาค West/South", "Central สูงกว่า West 3.36 เท่า", "Regional Sales", "เดือนที่ 2–3"],
        ["5. ปรับ Loyalty Tiered Rewards ดึง Basic (499 คน) อัปเกรด", "ยอด/คนเท่ากันทุก Tier (~฿142k)", "CRM & Loyalty", "เดือนที่ 1–3"],
    ]
    for c_i, h in enumerate(r_headers):
        cell = rt.cell(0, c_i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_DARK_GREEN
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_TH
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
    for r_i, r_vals in enumerate(r_rows, start=1):
        for c_i, val in enumerate(r_vals):
            cell = rt.cell(r_i, c_i)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_WHITE if r_i % 2 else C_BG
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_TH
            p.font.size = Pt(12.5)
            p.font.bold = c_i == 0
            p.font.color.rgb = C_DARK_GREEN if c_i == 0 else C_TEXT

    # Slide 12: Q&A Appendix
    s12 = prs.slides.add_slide(blank)
    set_slide_bg(s12)
    add_header(s12, "APPENDIX · Q&A EVIDENCE", "สรุปหลักฐานเชิงเทคนิคสำหรับตอบคำถามคณะกรรมการ (Verified 100%)", 12)
    add_card(s12, 0.6, 1.7, 12.1, 5.2)
    add_bullets(
        s12,
        0.9,
        1.95,
        11.5,
        4.7,
        [
            ("เหตุผลที่ Drop Missing 750 แถว", "ขาดทั้ง Units_Sold และ Total_Amount พร้อมกัน (1.50%) — ไม่มีค่าอ้างอิงให้ Impute ได้แม่นยำ"),
            ("เหตุผลที่ตรวจ Outlier บน Units_Sold แทน Total_Amount", "IQR บน Total_Amount (฿6,450) จะตัดบิลปกติของ Household ออกผิดพลาด 5,250 แถว ส่วน Units_Sold ตรงกันทั้ง IQR (>38.5) และ |Z|>3 ที่ 50 แถวพอดี"),
            ("การตรวจสอบย้อนกลับอัตโนมัติ", "test_clean_data.py และ test_web_data.py ผ่าน 7/7 tests (0 mismatches across 49,200 rows) + DuckDB Parquet parity 100%"),
            ("ขอบคุณคณะกรรมการ", "พร้อมตอบคำถามเชิงเทคนิคและสาธิตระบบจริงครับ (Demo Login: judge@smartretail.th / SmartRetail2025)"),
        ],
        font_size=14,
    )

    out_path = SLIDES_DIR / "SmartRetail_Presentation.pptx"
    prs.save(out_path)
    return out_path


if __name__ == "__main__":
    pptx_path = build_deck()
    print(f"Generated presentation: {pptx_path} ({pptx_path.stat().st_size} bytes)")
