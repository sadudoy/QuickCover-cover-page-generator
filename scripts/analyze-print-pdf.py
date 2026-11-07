import sys
import os
import json
import fitz # PyMuPDF

PT_TO_MM = 25.4 / 72.0

def analyze_pdf(pdf_path, expected_strings=None, forbidden_strings=None, render_png_path=None):
    if not os.path.exists(pdf_path):
        return {"error": f"File not found: {pdf_path}"}
    
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    if page_count == 0:
        return {"error": "Empty PDF"}
    
    page = doc[0]
    rect = page.rect
    width_pt, height_pt = rect.width, rect.height
    width_mm = width_pt * PT_TO_MM
    height_mm = height_pt * PT_TO_MM
    
    # Standard A4 is 210 x 297 mm = 595.276 x 841.890 pt
    is_a4 = abs(width_mm - 210.0) < 1.0 and abs(height_mm - 297.0) < 1.0
    
    # Extract text
    text = page.get_text()
    
    # Check expected strings
    missing_strings = []
    if expected_strings:
        for s in expected_strings:
            if s not in text:
                missing_strings.append(s)
                
    # Check forbidden strings (chrome)
    leaked_chrome = []
    if forbidden_strings:
        for s in forbidden_strings:
            if s in text:
                leaked_chrome.append(s)
                
    # Fonts analysis
    fonts = page.get_fonts()
    font_names = [f[3] for f in fonts if len(f) > 3]
    has_times = any('Times' in name for name in font_names) or len(fonts) > 0
    
    # Render PNG if requested
    if render_png_path:
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)
        pix.save(render_png_path)
    
    return {
        "page_count": page_count,
        "width_pt": round(width_pt, 2),
        "height_pt": round(height_pt, 2),
        "width_mm": round(width_mm, 2),
        "height_mm": round(height_mm, 2),
        "is_a4": is_a4,
        "missing_strings": missing_strings,
        "leaked_chrome": leaked_chrome,
        "fonts": font_names,
        "has_vector_fonts": len(font_names) > 0,
        "text_length": len(text)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze-print-pdf.py <pdf_path> [config_json]")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    expected = []
    forbidden = []
    render_png = None
    
    cfg_raw = ""
    if len(sys.argv) > 2 and sys.argv[2] != "-":
        cfg_raw = sys.argv[2]
    elif not sys.stdin.isatty():
        cfg_raw = sys.stdin.read()
        
    if cfg_raw.strip():
        try:
            cfg = json.loads(cfg_raw)
            expected = cfg.get("expected", [])
            forbidden = cfg.get("forbidden", [])
            render_png = cfg.get("render_png")
        except Exception as e:
            print(json.dumps({"error": f"Invalid JSON config: {e}"}))
            sys.exit(1)
        
    res = analyze_pdf(pdf_path, expected, forbidden, render_png)
    print(json.dumps(res))
