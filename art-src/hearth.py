# The hero: a black handi over firewood embers. Regrades the red reference stills to charcoal-brown walls and
# warm amber wood, keeps the fire's own colour, and crops to the plates' 1376×768 frame.
# python3 art-src/hearth.py <ref.png> <out-name>
import sys
from PIL import Image, ImageChops as C, ImageFilter

src, name = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
r, g, b = im.split()
lum = Image.merge("RGB", (r, g, b)).convert("L")

# Gradient map by luminance: charcoal → dark walnut → amber wood → warm highlight.
STOPS = [(0, (9, 7, 6)), (0.12, (33, 22, 14)), (0.35, (107, 66, 33)), (0.7, (219, 153, 82)), (1, (255, 230, 189))]
def lut(c):
    out = []
    for v in range(256):
        x = min(v / 255 * 1.35, 1)
        for (a, ca), (bb, cb) in zip(STOPS, STOPS[1:]):
            if x <= bb:
                t = (x - a) / (bb - a)
                out.append(round(ca[c] + (cb[c] - ca[c]) * t))
                break
    return out
graded = Image.merge("RGB", [lum.point(lut(c)) for c in range(3)])

# Steam: bright and low-saturation → neutral warm grey instead of pink.
sat = C.subtract(C.lighter(C.lighter(r, g), b), C.darker(C.darker(r, g), b))
steam = C.multiply(lum.point(lambda v: max(0, min(255, (v - 64) * 4))), sat.point(lambda v: max(0, min(255, (90 - v) * 4))))
steam_col = Image.merge("RGB", [lum.point(lambda v, k=k: min(255, int(v * k))) for k in (1.05, 0.98, 0.9)])
out = Image.composite(steam_col, graded, steam)

# Fire, embers and flame (bright red with green well above blue) keep their real colour.
fire = C.multiply(r.point(lambda v: max(0, min(255, (v - 115) * 3))), C.subtract(g, b).point(lambda v: max(0, min(255, (v - 20) * 5))))
out = Image.composite(im, out, fire.filter(ImageFilter.GaussianBlur(6)))

# Extend the room to the left (a mirrored continuation, sunk in the copy's dark wash) so the handi sits right of
# centre and the left third stays free for the hero text; then 1376×768 from the bottom, embers in frame.
w, h = out.size
POT_AT = 0.6
E = round((POT_AT * w - w / 2) / (1 - POT_AT))  # pot is centred in the references
wide = Image.new("RGB", (w + E, h))
wide.paste(out.crop((0, 0, E, h)).transpose(Image.FLIP_LEFT_RIGHT), (0, 0))
wide.paste(out, (E, 0))
seam = Image.linear_gradient("L").rotate(90).resize((60, h))  # soften the mirror seam
wide.paste(out.crop((0, 0, 60, h)), (E, 0), seam)
w = wide.size[0]
ch = round(w * 768 / 1376)
out = wide.crop((0, h - ch, w, h)).resize((1376, 768), Image.LANCZOS)
P = "public/plates/"
out.save(f"{P}{name}.jpg", quality=88)
out.resize((64, 36), Image.LANCZOS).save(f"{P}{name}-tiny.jpg", quality=60)
