# Hero dish visuals: each shop photo's round handi, seen from above, cut out on transparency (WebP with alpha) so
# the hero can rotate it on any background. Cut from the full-resolution masters (art-src/shop-*.png) with a light
# unsharp mask. Centre and radius (rim included) per photo, in 814-wide shop-photo pixels (scaled to the master).
from PIL import Image, ImageDraw, ImageFilter
P = "public/plates/"
HANDI = {"chicken": (424, 490, 224), "mutton": (434, 505, 238), "beef": (452, 490, 208), "fish": (428, 488, 248), "prawn": (420, 505, 222)}
for f, (x, y, r) in HANDI.items():
    src = Image.open(f"art-src/shop-{f}.png").convert("RGB")
    k = src.width / 814
    x, y, r = x * k, y * k, r * k
    im = src.crop((round(x - r), round(y - r), round(x + r), round(y + r))).resize((720, 720), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    m = Image.new("L", (720 * 4, 720 * 4), 0)
    ImageDraw.Draw(m).ellipse((8, 8, 720 * 4 - 8, 720 * 4 - 8), fill=255)
    m = m.resize((720, 720), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(m)
    im.save(f"{P}dish/{f}.webp", quality=82, method=6)
