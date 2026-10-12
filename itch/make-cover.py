"""Cover for itch.io (630 x 500): title type, the US Navy's photograph of the captured BV 222 at Trondheim,
1945 (public domain), and a strip of the Naval Staff's war diary of 16 July 1942.
Run from the repository root:  python itch/make-cover.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "itch" / "cover-630x500.png"
W, H = 630, 500
PAPER, INK, RED, GREY = (238, 235, 227), (31, 31, 28), (122, 43, 31), (93, 91, 85)


def font(names, size):
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default()


SERIF = ["C:/Windows/Fonts/pala.ttf", "C:/Windows/Fonts/georgia.ttf"]
SERIF_B = ["C:/Windows/Fonts/palab.ttf", "C:/Windows/Fonts/georgiab.ttf"]
SERIF_I = ["C:/Windows/Fonts/palai.ttf", "C:/Windows/Fonts/georgiai.ttf"]
MONO = ["C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/cour.ttf"]


def main():
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    # the flying boat (crop away the caption strip at the foot of the print)
    ph = Image.open(ROOT / "assets" / "plates" / "trondheim.jpg").convert("L")
    ph = ph.crop((0, 0, ph.width, int(ph.height * 0.86)))
    ph = ImageOps.autocontrast(ImageOps.fit(ph, (300, 250), centering=(0.55, 0.5)), cutoff=1)
    im.paste(Image.merge("RGB", (ph, ph, ph)), (W - 326, 104))
    d.rectangle([W - 326, 104, W - 27, 353], outline=INK)
    d.text((W - 176, 366), "A BV 222 in US Navy hands, Trondheim, 1945", font=font(SERIF_I, 12), fill=GREY, anchor="mm")
    # the file: the entry of 16 July 1942 as a strip
    strip = Image.open(ROOT / "assets" / "file" / "k224-request.jpg").convert("L")
    strip = strip.crop((int(strip.width * 0.06), int(strip.height * 0.30), int(strip.width * 0.97), int(strip.height * 0.62)))
    strip = strip.resize((W, round(W * strip.height / strip.width)))
    strip = ImageOps.autocontrast(strip).point(lambda v: 150 + v * 105 // 255)
    sh = min(strip.height, 72)
    im.paste(Image.merge("RGB", (strip, strip, strip)).crop((0, 0, W, sh)), (0, H - sh - 40))
    d.rectangle([0, 0, W, 6], fill=RED)
    d.text((28, 40), "TWO FLYING", font=font(SERIF_B, 38), fill=INK)
    d.text((28, 84), "BOATS, 1942", font=font(SERIF_B, 38), fill=RED)
    d.text((28, 146), "A hypothetical study from", font=font(SERIF_I, 18), fill=INK)
    d.text((28, 170), "the German Naval Staff's", font=font(SERIF_I, 18), fill=INK)
    d.text((28, 194), "own war diary", font=font(SERIF_I, 18), fill=INK)
    d.text((28, 240), "A raid on New York,", font=font(SERIF, 17), fill=GREY)
    d.text((28, 262), "U-boats as tankers.", font=font(SERIF, 17), fill=GREY)
    d.text((28, 296), "Read the dossier,", font=font(SERIF, 17), fill=GREY)
    d.text((28, 318), "or take the staff's seat.", font=font(SERIF, 17), fill=GREY)
    d.rectangle([0, H - 40, W, H], fill=INK)
    d.text((W / 2, H - 20), "\u201cAt the Fuehrer's request \u2026\u201d  Naval Staff war diary, 16 July 1942",
           font=font(MONO, 14), fill=PAPER, anchor="mm")
    im.save(OUT)
    print(OUT.name, im.size)


if __name__ == "__main__":
    main()
