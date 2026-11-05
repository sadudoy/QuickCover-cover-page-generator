from PIL import Image

def find_features(img, dpi):
    px_per_mm = dpi / 25.4
    width, height = img.size
    gray = img.convert('L')
    row_counts = []
    for y in range(height):
        dark_pixels = sum(1 for x in range(width) if gray.getpixel((x, y)) < 150)
        row_counts.append(dark_pixels)
    return px_per_mm, row_counts

def get_bands(rows, scale, thresh=15):
    bands = []
    in_band = False
    start = 0
    for y, count in enumerate(rows):
        if count > thresh and not in_band:
            in_band = True
            start = y
        elif count <= thresh and in_band:
            in_band = False
            bands.append((round(start / scale, 1), round(y / scale, 1)))
    return bands

for variant, static_name in [('lab-report', 'cover-lab-static'), ('assignment', 'cover-assignment-static')]:
    print(f"\n==================================================")
    print(f"=== Visual Comparison: {variant.upper()} ===")
    print(f"==================================================")
    ref_img = Image.open(f'reference/rendered/{variant}-page-1.png')
    static_img = Image.open(f'reference/rendered/{static_name}.png')
    
    ref_scale, ref_rows = find_features(ref_img, 200.0)
    stat_scale, stat_rows = find_features(static_img, 96.0)
    
    ref_bands = get_bands(ref_rows, ref_scale)
    stat_bands = get_bands(stat_rows, stat_scale)
    
    print(f"Reference bands count: {len(ref_bands)}")
    for b in ref_bands:
        print(f"  Ref: {b[0]}mm -> {b[1]}mm (height: {round(b[1]-b[0], 1)}mm)")
        
    print(f"\nStatic HTML bands count: {len(stat_bands)}")
    for b in stat_bands:
        print(f"  Static: {b[0]}mm -> {b[1]}mm (height: {round(b[1]-b[0], 1)}mm)")
