# Floating ingredient sprites for the Flavour Wheel: square crops of the black studio sheets, keyed to transparency
# (near-black → clear, like S_FRAG in Stage.jsx) with a soft round edge so no neighbour on the sheet shows.
from PIL import Image, ImageChops, ImageDraw, ImageFilter
P = "public/plates/"
CROPS = {  # name: (sheet, x, y, size) in sheet pixels
    "chicken-1": ("chicken", 90, 55, 210), "chicken-2": ("chicken", 753, 55, 210), "cashew": ("chicken", 112, 315, 140),
    "mutton-1": ("meat-cuts", 0, 0, 400), "mutton-2": ("ingredients", 120, 80, 190), "mutton-3": ("ingredients", 438, 78, 190),
    "beef-1": ("meat-cuts", 400, 0, 400), "beef-2": ("ingredients", 750, 78, 190), "beef-3": ("ingredients", 1065, 78, 190),
    "fish-1": ("seafood", 15, 40, 360), "fish-2": ("seafood", 670, 40, 360),
    "prawn-1": ("seafood", 45, 430, 300), "prawn-2": ("seafood", 705, 430, 300),
    "onion": ("ingredients", 1113, 508, 170),
}
for name, (sheet, x, y, s) in CROPS.items():
    im = Image.open(f"{P}{sheet}.jpg").convert("RGB").crop((x, y, x + s, y + s)).resize((256, 256), Image.LANCZOS)
    r, g, b = im.split()
    peak = ImageChops.lighter(ImageChops.lighter(r, g), b)
    key = peak.point(lambda v: max(0, min(255, int((v / 255 - 0.05) / 0.11 * 255))))
    edge = Image.new("L", (256, 256), 0)
    ImageDraw.Draw(edge).ellipse((10, 10, 246, 246), fill=255)
    alpha = ImageChops.multiply(key, edge.filter(ImageFilter.GaussianBlur(8)))
    im.putalpha(alpha)
    im.save(f"{P}float/{name}.webp", quality=82, method=6)
