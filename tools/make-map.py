"""The North Atlantic map: Natural Earth 1:50m land (public domain), clipped and projected
(equirectangular, scaled at 41 N). Writes data/map.json.
Run from the repository root:  python tools/make-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, box
ROOT = Path(__file__).resolve().parent.parent
LON0, LON1, LAT0, LAT1 = -80.0, 4.0, 28.0, 54.0
W = 1100
COS = math.cos(math.radians(41))
K = W / ((LON1 - LON0) * COS)
H = round((LAT1 - LAT0) * K)
clip = box(LON0 - 1, LAT0 - 1, LON1 + 1, LAT1 + 1)
P = lambda lon, lat: ((lon - LON0) * COS * K, (LAT1 - lat) * K)
parts = []
for f in json.load(open(ROOT / "tools/src/ne_50m_land.geojson", encoding="utf-8"))["features"]:
    g = shape(f["geometry"]).intersection(clip)
    if g.is_empty: continue
    polys = [g] if g.geom_type == "Polygon" else [p for p in getattr(g, "geoms", []) if p.geom_type == "Polygon"]
    for p in polys:
        p = p.simplify(0.03)
        if p.area < 0.02: continue
        for ring in [p.exterior, *p.interiors]:
            pts = [P(x, y) for x, y in ring.coords]
            parts.append("M" + "L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + "Z")
out = {"w": W, "h": H, "lon0": LON0, "lat1": LAT1, "k": K, "cos": COS, "land": "".join(parts),
       "source": "Natural Earth 1:50m land (public domain)"}
(ROOT / "data/map.json").write_text(json.dumps(out), encoding="utf-8")
print(W, H, len(out["land"]))
