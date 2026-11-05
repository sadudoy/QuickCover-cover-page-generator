import os
import fitz # PyMuPDF

RENDER_DIR = os.path.join("reference", "rendered")
os.makedirs(RENDER_DIR, exist_ok=True)

# 1 pt = 1/72 inch = 25.4 / 72 mm = 0.352777... mm
PT_TO_MM = 25.4 / 72.0

pdf_targets = [
    ("lab-report", os.path.join("reference", "lab-report-demo.pdf")),
    ("assignment", os.path.join("reference", "assignment-demo.pdf"))
]

for label, pdf_path in pdf_targets:
    print(f"\n=======================================================")
    print(f"=== INSPECTING: {label.upper()} ({pdf_path}) ===")
    print(f"=======================================================")
    
    if not os.path.exists(pdf_path):
        print(f"FILE NOT FOUND: {pdf_path}")
        continue

    doc = fitz.open(pdf_path)
    page_count = len(doc)
    print(f"Page Count: {page_count}")
    
    for page_idx in range(page_count):
        page = doc[page_idx]
        rect = page.rect
        width_pt, height_pt = rect.width, rect.height
        width_mm, height_mm = width_pt * PT_TO_MM, height_pt * PT_TO_MM
        print(f"\n--- {label.upper()} Page {page_idx + 1} ---")
        print(f"Dimensions: {width_pt:.2f} x {height_pt:.2f} pt | {width_mm:.2f} x {height_mm:.2f} mm")
        is_a4 = abs(width_mm - 210) < 2 and abs(height_mm - 297) < 2
        print(f"Is standard A4: {is_a4}")
        
        # Render to PNG at 200 DPI (zoom = 200 / 72)
        zoom = 200 / 72
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        png_filename = f"{label}-page-{page_idx + 1}.png"
        png_path = os.path.join(RENDER_DIR, png_filename)
        pix.save(png_path)
        print(f"Rendered PNG: {png_path} ({pix.width}x{pix.height} px, 200 DPI)")
        
        # Drawings / vectors
        drawings = page.get_drawings()
        print(f"Drawings / Vector lines found: {len(drawings)}")
        for d_idx, d in enumerate(drawings):
            r = d['rect']
            r_mm = [round(x * PT_TO_MM, 2) for x in [r.x0, r.y0, r.x1, r.y1]]
            items_desc = [item[0] for item in d.get('items', [])]
            print(f"  Drawing #{d_idx + 1}: rect_mm={r_mm}, color={d.get('color')}, fill={d.get('fill')}, width={d.get('width')}, items={items_desc}")
            
        # Text Page
        text_page = page.get_text("dict")
        fonts_detected = set()
        
        print("\n--- Detailed Text Spans ---")
        for b in text_page.get("blocks", []):
            if b.get("type") == 0:
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        t = span.get("text", "").strip()
                        if t:
                            bbox = [round(x * PT_TO_MM, 2) for x in span["bbox"]]
                            font_name = span.get("font", "")
                            font_size = span.get("size", 0)
                            font_flags = span.get("flags", 0)
                            font_color = span.get("color", 0)
                            fonts_detected.add((font_name, round(font_size, 1), font_flags, font_color))
                            print(f"  bbox_mm={bbox} font={font_name} size={round(font_size, 2)}pt color=#{font_color:06x} text=\"{t}\"")
        
        print("\n--- Detected Fonts (Name, Size pt, Flags, Color hex) ---")
        for f in sorted(fonts_detected):
            color_hex = f"#{f[3]:06x}"
            print(f"  - Font: {f[0]}, Size: {f[1]}pt, Flags: {f[2]}, Color: {color_hex}")

        print("\n--- Extracted Blocks ---")
        for idx, b in enumerate(text_page.get("blocks", [])):
            b_bbox = [round(x * PT_TO_MM, 2) for x in b["bbox"]]
            if b.get("type") == 0:
                lines = []
                for line in b.get("lines", []):
                    line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                    if line_text.strip():
                        lines.append(line_text.strip())
                print(f"Block {idx + 1} (text): bbox_mm={b_bbox}")
                for l in lines:
                    print(f"  {l}")
            elif b.get("type") == 1:
                print(f"Block {idx + 1} (image): bbox_mm={b_bbox} [Image {b.get('width')}x{b.get('height')}]")

        images = page.get_images(full=True)
        print(f"\nImages on page: {len(images)}")
        for img_idx, img in enumerate(images):
            xref = img[0]
            base_img = doc.extract_image(xref)
            print(f"  Image #{img_idx + 1}: format={base_img['ext']}, size={base_img['width']}x{base_img['height']}")

    doc.close()
