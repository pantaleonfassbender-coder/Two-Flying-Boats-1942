"""Plates of the study: downloads the originals once into tools/plates_src and writes
assets/plates/<id>.jpg (at most 1600 px wide) and <id>_t.jpg (640 px). All public domain;
licences checked on the Wikimedia Commons file pages and at archive.org.
Run from the repository root:  python tools/make-plates.py"""
import time
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "plates_src"
OUT = ROOT / "assets" / "plates"
UA = {"User-Agent": "TwoFlyingBoatsStudy/1.0 (historical study)"}
COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/{}?width=2000"

PLATES = {
    "poster": ("archive", "https://archive.org/download/ARP-097/ARP-097.jpg"),
    "trondheim": ("commons", "Captured German Blohm & Voss BV 222 seaplane at Trondheim, Norway, 27 August 1945 (PTR 29305).jpg"),
    "hamburg": ("commons", "Incomplete Blohm & Voss BV 222 C at Hamburger Flugzeugbau, Hamburg, Germany, in July 1945 (342-FH-3A19982-58351AC).jpg"),
    "u505": ("commons", "A U.S. Navy boarding party working to secure a tow line to the bow of the captured German submarine U-505, 4 June 1944 (80-G-49172).jpg"),
    "dimout": ("commons", "Times Square during the wartime dimout at night8d22787v.jpg"),
    "warden": ("commons", "Italian-American shoemaker on duty as an air raid warden 8d23887v.jpg"),
    "lowereast": ("commons", "Jewish boys sitting on the synagogue steps at night8d21967v.jpg"),
    "shopwindow": ("commons", "New York, New York. Window of a Jewish religious shop 8d21921v.jpg"),
    "fcdavis": ("commons", "DE-136 Frederick C Davis.jpg"),
    "u546": ("commons", "U-546 survivors.jpg"),
}


def fetch(pid, kind, ref):
    p = SRC / f"{pid}.jpg"
    if p.exists():
        return p
    SRC.mkdir(parents=True, exist_ok=True)
    url = ref if kind == "archive" else COMMONS.format(urllib.parse.quote(ref.replace(" ", "_")))
    local = ROOT.parent / "quellen" / "plates_raw" / "ARP-097.jpg"
    if pid == "poster" and local.exists():
        p.write_bytes(local.read_bytes())
        return p
    for k in range(5):
        try:
            p.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read())
            return p
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(20 * (k + 1))
    raise RuntimeError(pid)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for pid, (kind, ref) in PLATES.items():
        im = Image.open(fetch(pid, kind, ref))
        im = ImageOps.exif_transpose(im).convert("RGB")
        for suffix, w, q in (("", 1600, 84), ("_t", 640, 80)):
            j = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            j.save(OUT / f"{pid}{suffix}.jpg", quality=q, optimize=True)
        print(pid, im.size)
        time.sleep(2)


if __name__ == "__main__":
    main()
