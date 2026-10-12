"""Screenshots for itch.io (1280 x 800), with Chrome in headless mode.

Writes a temporary _shot.html next to index.html that sets a fixed state (seed 9001; U-boats given, Base 1
1,000 km from New York, two flying boats, September, the General Staff overruled) before the study loads,
then deletes it. Needs the local server on port 8973 (preview "two-flying-boats", or python -m http.server 8973).
Run from the repository root:  python itch/make-shots.py
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = "http://localhost:8973/_shot.html"

SHOTS = [
    ("screenshot-1-start.png", "read", ""),
    ("screenshot-2-request.png", "read", "#/ch/4"),
    ("screenshot-3-decision.png", "play", "#/ch/6"),
    ("screenshot-4-file.png", "read", "#/file/k240"),
    ("screenshot-5-raid.png", "play", "#/strike"),
    ("screenshot-6-accounting.png", "play", "#/result"),
    ("screenshot-7-city-in-their-minds.png", "read", "#/ch/3"),
    ("screenshot-8-newyork.png", "read", "#/ch/9"),
]

DRIVER = """
<script>
(function () {
  var m = new URLSearchParams(location.search).get("m");
  var st = { mode: m, seed: 9001, reached: 10,
    choices: m === "play" ? { naval: "support", base1: "ny1000", planes: "2", when: "sep", final: "press" } : {} };
  try { localStorage.setItem("twoflyingboats_state", JSON.stringify(st)); } catch (e) {}
})();
</script>
"""


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    shot = ROOT / "_shot.html"
    shot.write_text(html.replace("<head>", "<head>" + DRIVER, 1), encoding="utf-8")
    try:
        for name, mode, hashpart in SHOTS:
            out = ROOT / "itch" / name
            subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,800",
                            "--virtual-time-budget=8000", f"--screenshot={out}", f"{BASE}?m={mode}{hashpart}"], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(name, out.stat().st_size // 1024, "KB")
    finally:
        shot.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
