import os
import fitz

PDF_PATH = os.path.join('reference', 'lab-report-demo.pdf')
PNG_PATH = os.path.join('reference', 'rendered', 'lab-report-page-1.png')

old_size = os.path.getsize(PNG_PATH) if os.path.exists(PNG_PATH) else 0

doc = fitz.open(PDF_PATH)
page = doc[0]

PT_TO_MM = 25.4 / 72.0
zoom = 200 / 72.0
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat)
pix.save(PNG_PATH)

new_size = os.path.getsize(PNG_PATH)
print(f"Old PNG size: {old_size} bytes")
print(f"New PNG size: {new_size} bytes")
print(f"File changed: {old_size != new_size}")
print(f"Dimensions: {pix.width}x{pix.height}")

# Detailed page inspection
rect = page.rect
w_mm, h_mm = rect.width * PT_TO_MM, rect.height * PT_TO_MM
print(f"\nPage Dimensions: {rect.width:.2f} x {rect.height:.2f} pt | {w_mm:.2f} x {h_mm:.2f} mm")

drawings = page.get_drawings()
print(f"Total drawings: {len(drawings)}")
for i, d in enumerate(drawings):
    r = [round(x * PT_TO_MM, 2) for x in d['rect']]
    print(f"  Drawing #{i+1}: rect={r} color={d.get('color')} fill={d.get('fill')} width={d.get('width')}")

text_page = page.get_text('dict')
print("\n--- Text Spans ---")
for b in text_page['blocks']:
    if b.get('type') == 0:
        for l in b['lines']:
            for s in l['spans']:
                t = s['text'].strip()
                if t:
                    bbox = [round(x * PT_TO_MM, 2) for x in s['bbox']]
                    print(f"  span: bbox={bbox} font={s['font']} sz={round(s['size'], 2)}pt text=\"{t}\"")

print("\n--- Text Blocks ---")
for idx, b in enumerate(text_page['blocks']):
    bbox = [round(x * PT_TO_MM, 2) for x in b['bbox']]
    if b.get('type') == 0:
        lines = [''.join(s['text'] for s in l['spans']).strip() for l in b['lines']]
        lines = [l for l in lines if l]
        print(f"Block {idx+1} (text): bbox={bbox}")
        for l in lines:
            print(f"   {l}")
    elif b.get('type') == 1:
        print(f"Block {idx+1} (image): bbox={bbox} [Image {b.get('width')}x{b.get('height')}]")

images = page.get_images(full=True)
print(f"\nImages on page: {len(images)}")
for img_idx, img in enumerate(images):
    xref = img[0]
    base_img = doc.extract_image(xref)
    print(f"  Image #{img_idx + 1}: format={base_img['ext']}, size={base_img['width']}x{base_img['height']}")

doc.close()
