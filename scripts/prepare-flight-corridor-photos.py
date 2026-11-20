"""Package GSI aerial imagery in overlapping 12 km tiles along the long flights."""
import csv
import io
import json
import math
import runpy
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

import numpy as np

base = runpy.run_path(str(Path(__file__).with_name('prepare-flight-routes.py')))
atlas = json.loads(base['DATA'].with_name('advanced-route-atlas.json').read_text())
with urlopen('https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/runways.csv', timeout=30) as stream:
    runways = list(csv.DictReader(io.TextIOWrapper(stream, encoding='utf-8-sig')))

out = base['OUT'] / 'corridors'
out.mkdir(exist_ok=True)
manifest = {}
jobs = []
for region in atlas:
    ends = []
    for port in region['ports']:
        airport, threshold = base['PORTS'][port['code']]
        row = next(r for r in runways if r['airport_ident'] == airport and r['le_ident'] == threshold and r['closed'] == '0')
        ends.extend(base['mercator'](float(row[e+'_latitude_deg']), float(row[e+'_longitude_deg'])) for e in ('le','he'))
    origin = np.mean(ends, axis=0)
    scale = base['WORLD'] / math.cosh((.5-origin[1])*2*math.pi)
    start, end = (np.mean(p['ends'], axis=0) for p in region['ports'])
    # Follow the same outbound and final approach as the flight plan.
    a, b = (np.array(p['ends']) for p in region['ports'])
    for strip in (a, b):
        if np.dot(strip[1]-strip[0], end-start) < 0:
            strip[:] = strip[::-1].copy()
    direction = lambda strip: (strip[1]-strip[0])/np.linalg.norm(strip[1]-strip[0])
    outbound = a[1]+direction(a)*800
    approach = b[0]-direction(b)*3200
    count = math.ceil(np.linalg.norm(approach-outbound)/7500)
    centers = np.linspace(outbound, approach, count+1)
    manifest[region['key']] = centers.round(1).tolist()
    for i, point in enumerate(centers):
        uv = origin + point/scale
        delta = 6000/scale
        box = [uv[0]-delta,uv[1]-delta,uv[0]+delta,uv[1]+delta]
        jobs.append((region['key'],i,box))

def build(job):
    key, index, box = job
    image = base['sample']('seamlessphoto', 14, box, (960,960))
    image.save(out / f'{key}-{index}.webp', quality=54, method=4)
    print(key, index, flush=True)

with ThreadPoolExecutor(4) as pool:
    list(pool.map(build,jobs))
base['DATA'].with_name('corridor-photos.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
