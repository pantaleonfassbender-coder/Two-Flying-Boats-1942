"""Facsimiles of the New York file.

- War Diary of the German Naval Staff (Kriegstagebuch der Seekriegsleitung), Part A, vol. 35, July 1942,
  in the translation of the US Office of Naval Intelligence, 1948 (archive.org wardiarygermann351942germ;
  image leaf = page + 5).
- Nazi Conspiracy and Aggression (US Government Printing Office, 1946): R-140 (vol. VIII, p. 235),
  1517-PS (vol. IV, pp. 55-56), 001-PS (vol. III, p. 1), 2663-PS (vol. V, p. 367).

Both are works of the US Government and in the public domain. The page images are fetched from
archive.org once into ../quellen/scans (https://archive.org/download/<id>/page/n<leaf>_w1100.jpg is a
smaller variant). Writes assets/file/<id>.jpg (pages) and assets/file/<id>-<name>.jpg (details).
Run from the repository root:  python tools/make-facsimiles.py
"""
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "quellen" / "scans"
OUT = ROOT / "assets" / "file"

# id, archive.org item, leaf, local file
PAGES = [
    ("k224", "wardiarygermann351942germ", 229, "skl1942-07_leaf229.jpg"),
    ("k225", "wardiarygermann351942germ", 230, "skl1942-07_leaf230.jpg"),
    ("k240", "wardiarygermann351942germ", 245, "skl1942-07_leaf245.jpg"),
    ("k241", "wardiarygermann351942germ", 246, "skl1942-07_leaf246.jpg"),
    ("k350", "wardiarygermann351942germ", 355, "skl1942-07_leaf355.jpg"),
    ("k351", "wardiarygermann351942germ", 356, "skl1942-07_leaf356.jpg"),
    ("g235", "naziconspiracyag08unit", 242, "naziconspiracyag08unit_242.jpg"),
    ("r55", "naziconspiracyag04unit", 62, "naziconspiracyag04unit_62.jpg"),
    ("r56", "naziconspiracyag04unit", 63, "naziconspiracyag04unit_63.jpg"),
    ("a1", "naziconspiracyag03unit", 8, "naziconspiracyag03unit_8.jpg"),
    ("p367", "naziconspiracyag05unit", 374, "naziconspiracyag05unit_374.jpg"),
]
# detail passages: page id, name, crop as fractions of the page image
DETAILS = [
    ("k224", "request", (0.0, 0.69, 1.0, 0.875)),
    ("k240", "procedure", (0.0, 0.592, 1.0, 0.905)),
    ("k351", "declined", (0.0, 0.03, 1.0, 0.145)),
    ("g235", "newyork", (0.0, 0.676, 1.0, 0.843)),
    ("r55", "newyorkjews", (0.0, 0.866, 1.0, 0.962)),
    ("a1", "london", (0.0, 0.391, 1.0, 0.688)),
    ("p367", "prophecy", (0.0, 0.0, 1.0, 0.276)),
]


def page(pid):
    _, item, leaf, name = next(p for p in PAGES if p[0] == pid)
    p = SRC / name
    if not p.exists():
        SRC.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(f"https://archive.org/download/{item}/page/n{leaf}.jpg", p)
    im = ImageOps.autocontrast(Image.open(p).convert("L"), cutoff=0.5)
    if im.width > 1300:
        im = im.resize((1300, round(im.height * 1300 / im.width)), Image.LANCZOS)
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for pid, *_ in PAGES:
        page(pid).save(OUT / f"{pid}.jpg", quality=82, optimize=True)
    for pid, name, (x0, y0, x1, y1) in DETAILS:
        im = page(pid)
        w, h = im.size
        im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h))).save(OUT / f"{pid}-{name}.jpg", quality=85, optimize=True)
    print("ok", len(PAGES), "pages,", len(DETAILS), "details")


if __name__ == "__main__":
    main()
