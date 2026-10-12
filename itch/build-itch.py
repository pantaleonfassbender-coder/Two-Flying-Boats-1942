"""Build the itch.io upload: itch/two-flying-boats-1942-itch.zip.

Packs the study (index.html, app.js, model.js, style.css, data/, assets/). The legal page stays out (its
privacy notice describes the copy on Netlify; on itch.io the platform's terms apply), the footer links to it
and to the itch page itself are removed, and the page gets window.TF_ITCH = true, which shows the donation
notice on the start page and in the accounting.  Run from the repository root:  python itch/build-itch.py
"""
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "itch" / "two-flying-boats-1942-itch.zip"


def page():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html, n = re.subn(r' · <a href="legal\.html#notice">Legal notice</a> · <a href="legal\.html#privacy">Privacy</a>', "", html)
    assert n == 1, "legal links not found"
    html = re.sub(r' · <a href="https://leofassb\.itch\.io/dragons-lair-194445"[^>]*>On itch\.io</a>', "", html)
    html, k = re.subn(r'<script src="model\.js"></script>', '<script>window.TF_ITCH = true;</script>\n<script src="model.js"></script>', html)
    assert k == 1
    return html


FILES = ["app.js", "model.js", "style.css"]
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("index.html", page())
    for f in FILES:
        z.write(ROOT / f, f)
    for d in ("data", "assets"):
        for p in sorted((ROOT / d).rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(ROOT).as_posix())

with zipfile.ZipFile(OUT) as z:
    names = z.namelist()
    assert "legal.html" not in z.read("index.html").decode("utf-8")
print(f"{OUT.name}: {len(names)} files, {OUT.stat().st_size // 1024} KB")
