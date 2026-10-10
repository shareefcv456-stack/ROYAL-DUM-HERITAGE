# Per-flavour biriyani surfaces: the inside of each shop photo's handi (top-down), squashed into the
# assembly's handi fill and the reveal's banana-leaf heap.
import sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
root = sys.argv[1]
P = root + "/public/plates/"
# interior centre and safe radius (rice + protein only), shop photo px
DISC = {"mutton": (434, 505, 200), "beef": (452, 490, 170), "fish": (428, 488, 205), "prawn": (420, 505, 185)}

def disc(f, k=1):
    x, y, r = DISC[f]
    r = int(r * k)
    im = Image.open(f"{P}shop/{f}.jpg").convert("RGB").crop((x - r, y - r, x + r, y + r))
    # daylight studio → the plates' warm, low firelight
    im = ImageEnhance.Contrast(ImageEnhance.Brightness(im).enhance(0.8)).enhance(1.12)
    return Image.merge("RGB", [c.point(lambda v, k=k: min(255, int(v * k))) for c, k in zip(im.split(), (1.04, 0.97, 0.86))])

def paste(base, src, cx, cy, rx, ry, feather):
    src = src.resize((2 * rx, 2 * ry), Image.LANCZOS)
    m = Image.new("L", src.size, 0)
    f = feather
    ImageDraw.Draw(m).ellipse((f, f, 2 * rx - f, 2 * ry - f), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(f / 2))
    base.paste(src, (cx - rx, cy - ry), m)
    return base

for f in DISC:
    d = disc(f)
    # handi fill: a band through the middle of the disc, like handi-fill.jpg
    s = d.size[0]
    d.crop((0, int(s * 0.18), s, int(s * 0.82))).resize((1024, 412), Image.LANCZOS).save(f"{P}handi-fill-{f}.jpg", quality=86)
    # wider crop so the pieces sit at the heap's scale; tall enough to cover the chicken leg's tip
    rv = paste(Image.open(P + "reveal.jpg").convert("RGB"), disc(f, 1.15), 995, 535, 362, 200, 50)
    rv.save(f"{P}reveal-{f}.jpg", quality=86)
    rv.resize((64, 36), Image.LANCZOS).save(f"{P}reveal-{f}-tiny.jpg", quality=60)
