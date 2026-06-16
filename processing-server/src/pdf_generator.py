import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus.flowables import Flowable

class MetricCard(Flowable):
    def __init__(self, title, value, width=1.6*inch, height=1.2*inch, color=colors.HexColor("#4285F4")):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.title = title
        self.value = str(value)
        self.color = color

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        self.canv.saveState()
        # Card shadow
        self.canv.setFillColor(colors.HexColor("#CBD5E1"))
        self.canv.roundRect(3, -3, self.width, self.height, 8, fill=1, stroke=0)
        
        # Card background
        self.canv.setFillColor(colors.white)
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(1.5)
        self.canv.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=1)
        
        # Header area
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, self.height - 25, self.width, 25, 8, fill=1, stroke=0)
        self.canv.rect(0, self.height - 25, self.width, 10, fill=1, stroke=0) # flatten bottom
        
        # Title text
        self.canv.setFillColor(colors.white)
        self.canv.setFont("Helvetica-Bold", 10)
        self.canv.drawCentredString(self.width / 2.0, self.height - 17, self.title)
        
        # Value text
        self.canv.setFillColor(colors.HexColor("#1E293B"))
        font_size = 22 if len(self.value) < 8 else 14
        self.canv.setFont("Helvetica-Bold", font_size)
        self.canv.drawCentredString(self.width / 2.0, self.height / 2.0 - max(font_size/2 - 5, 0) - 5, self.value)
        
        self.canv.restoreState()

class StatusBadge(Flowable):
    def __init__(self, text):
        Flowable.__init__(self)
        self.text = str(text).upper()
        if self.text == 'PASS':
            self.bg_color = colors.HexColor("#D1FAE5")
            self.fg_color = colors.HexColor("#065F46")
        elif self.text == 'FAIL':
            self.bg_color = colors.HexColor("#FEE2E2")
            self.fg_color = colors.HexColor("#991B1B")
        elif self.text == 'WARNING':
            self.bg_color = colors.HexColor("#FEF3C7")
            self.fg_color = colors.HexColor("#92400E")
        else:
            self.bg_color = colors.HexColor("#F1F5F9")
            self.fg_color = colors.HexColor("#334155")
            
        self.width = 65
        self.height = 20

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(self.bg_color)
        self.canv.roundRect(0, 0, self.width, self.height, 10, fill=1, stroke=0)
        self.canv.setFillColor(self.fg_color)
        self.canv.setFont("Helvetica-Bold", 9)
        self.canv.drawCentredString(self.width / 2.0, 6, self.text)
        self.canv.restoreState()

class SectionHeader(Flowable):
    def __init__(self, title, width=7.5*inch, bg_color="#1E293B", text_color="#FFFFFF"):
        Flowable.__init__(self)
        self.title = title
        self.width = width
        self.bg_color = colors.HexColor(bg_color)
        self.text_color = colors.HexColor(text_color)
        self.height = 25

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(self.bg_color)
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        self.canv.setFillColor(self.text_color)
        self.canv.setFont("Helvetica-Bold", 12)
        self.canv.drawString(10, 8, self.title)
        self.canv.restoreState()

def add_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#F8FAFC"))
    canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1, stroke=0)
    canvas.restoreState()

def generate_pdf_report(report_data: dict, markdown_text: str) -> io.BytesIO:
    buffer = io.BytesIO()
    # Margins: 0.5 inch all around -> 7.5 inch width
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=0.5*inch, leftMargin=0.5*inch,
                            topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='DashboardTitle', fontSize=26, leading=32, fontName='Helvetica-Bold', textColor=colors.white))
    styles.add(ParagraphStyle(name='DashboardSubTitle', fontSize=12, leading=16, fontName='Helvetica', textColor=colors.HexColor("#94A3B8")))
    styles.add(ParagraphStyle(name='SectionTitle', fontSize=16, leading=20, fontName='Helvetica-Bold', textColor=colors.HexColor("#0F172A"), spaceBefore=15, spaceAfter=10))
    styles.add(ParagraphStyle(name='ReportText', fontSize=10, fontName='Helvetica', textColor=colors.HexColor("#334155"), spaceBefore=3, spaceAfter=3, leading=14))
    styles.add(ParagraphStyle(name='ReportTextBold', fontSize=10, fontName='Helvetica-Bold', textColor=colors.HexColor("#0F172A"), spaceBefore=3, spaceAfter=3, leading=14))

    Story = []
    
    # 1. Header Area
    header_data = [
        [Paragraph("BIAS AUDIT DASHBOARD", styles['DashboardTitle']),
         Paragraph("Generated Audit Report<br/>System Integrity Analysis", styles['DashboardSubTitle'])]
    ]
    header_table = Table(header_data, colWidths=[4.5*inch, 3.0*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0F172A")),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
    ]))
    Story.append(header_table)
    Story.append(Spacer(1, 0.2 * inch))

    # 2. KPI Grid
    global_stats = report_data.get('global_stats', {})
    risk_score = global_stats.get('overall_risk_score', 'N/A')
    severity = str(global_stats.get('severity', 'N/A')).upper()
    total_records = global_stats.get('total_records', 'N/A')
    target_type = global_stats.get('target_type', 'N/A')

    if severity == 'HIGH':
        sev_color = colors.HexColor("#EF4444")
    elif severity == 'MEDIUM':
        sev_color = colors.HexColor("#F59E0B")
    elif severity == 'LOW':
        sev_color = colors.HexColor("#10B981")
    else:
        sev_color = colors.HexColor("#64748B")

    card_width = 1.7 * inch
    c1 = MetricCard("RISK SCORE", risk_score, card_width, 1.2*inch, colors.HexColor("#8B5CF6"))
    c2 = MetricCard("SEVERITY", severity, card_width, 1.2*inch, sev_color)
    c3 = MetricCard("TOTAL RECORDS", total_records, card_width, 1.2*inch, colors.HexColor("#3B82F6"))
    c4 = MetricCard("TARGET TYPE", target_type, card_width, 1.2*inch, colors.HexColor("#14B8A6"))

    kpi_data = [[c1, c2, c3, c4]]
    kpi_table = Table(kpi_data, colWidths=[1.875*inch]*4)
    kpi_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    Story.append(SectionHeader("GLOBAL INTEGRITY METRICS", bg_color="#334155"))
    Story.append(Spacer(1, 0.1 * inch))
    Story.append(kpi_table)
    Story.append(Spacer(1, 0.2 * inch))

    # 3. Attribute Analysis Grid
    Story.append(SectionHeader("ATTRIBUTE DISPARITY ANALYSIS", bg_color="#334155"))
    Story.append(Spacer(1, 0.1 * inch))

    attr_data = [
        [Paragraph("<b>PROTECTED ATTRIBUTE</b>", styles['ReportTextBold']), 
         Paragraph("<b>STATUS</b>", styles['ReportTextBold']), 
         Paragraph("<b>RECOMMENDATION / ACTION ITEM</b>", styles['ReportTextBold'])]
    ]

    attr_analysis = report_data.get('attribute_analysis', {})
    if not attr_analysis:
        attr_data.append(["No protected attributes analyzed.", "", ""])
    else:
        for attr, metrics in attr_analysis.items():
            status = metrics.get('status', 'UNKNOWN').upper()
            badge = StatusBadge(status)
            rec = metrics.get('recommendation', 'No recommendation provided.')
            
            attr_data.append([
                Paragraph(attr, styles['ReportTextBold']),
                badge,
                Paragraph(rec, styles['ReportText'])
            ])

    attr_table = Table(attr_data, colWidths=[1.8*inch, 1.2*inch, 4.5*inch])
    attr_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor("#94A3B8")),
        ('INNERGRID', (0, 1), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94A3B8")),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    Story.append(attr_table)
    Story.append(Spacer(1, 0.2 * inch))

    # 4. AI Executive Brief
    Story.append(SectionHeader("AI EXECUTIVE BRIEF", bg_color="#8B5CF6"))
    Story.append(Spacer(1, 0.1 * inch))

    insight_data = []
    for line in markdown_text.split('\n'):
        line = line.strip()
        if not line:
            insight_data.append([Spacer(1, 0.05 * inch)])
            continue
        
        if line.startswith('### '):
            insight_data.append([Paragraph(line.replace('### ', ''), styles['SectionTitle'])])
        elif line.startswith('**') and line.endswith('**'):
            insight_data.append([Paragraph(line.replace('**', ''), styles['ReportTextBold'])])
        else:
            line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            insight_data.append([Paragraph(line, styles['ReportText'])])

    if not insight_data:
        insight_data.append([Paragraph("No AI insights provided.", styles['ReportText'])])

    insight_table = Table(insight_data, colWidths=[7.4*inch])
    insight_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('LINEBEFORE', (0, 0), (-1, -1), 4, colors.HexColor("#8B5CF6")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
    ]))
    Story.append(insight_table)

    doc.build(Story, onFirstPage=add_background, onLaterPages=add_background)
    buffer.seek(0)
    return buffer
