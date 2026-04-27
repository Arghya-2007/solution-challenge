from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

def format_audit_response(target: str, llm_results: dict, profiles: dict, rule_results: dict) -> dict:
    final = {}
    for col in profiles:
        llm_col = llm_results["columns"].get(col, {})
        risk = llm_col.get("risk_level", "low")
        rule_flag = rule_results[col]["flag"]

        if rule_flag or risk in ["medium", "high"]:
            final[col] = {
                "rule": rule_results[col],
                "llm": llm_col
            }

    return {
        "target_column": target,
        "use_case": llm_results.get("use_case"),
        "flagged_features": final
    }

def generate_pdf_report(audit_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Bias + SHAP Audit Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 80, f"Target Column: {audit_data.get('target_column')}")
    c.drawString(100, height - 100, f"Use Case: {audit_data.get('use_case')}")

    y_position = height - 140
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, y_position, "Flagged Features:")
    y_position -= 20

    c.setFont("Helvetica", 10)
    for col, data in audit_data.get("flagged_features", {}).items():
        if y_position < 50:
            c.showPage()
            y_position = height - 50
        
        c.drawString(120, y_position, f"Feature: {col}")
        y_position -= 15
        c.drawString(140, y_position, f"Risk: {data['llm'].get('risk_level')}")
        y_position -= 15
        c.drawString(140, y_position, f"Reason: {data['rule'].get('reason')}")
        y_position -= 15
        c.drawString(140, y_position, f"Explanation: {data['llm'].get('explanation')}")
        y_position -= 25

    c.save()
    buffer.seek(0)
    return buffer
