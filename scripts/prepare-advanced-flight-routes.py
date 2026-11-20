"""Build the two long-haul relief charts from GSI elevation tiles and OurAirports runways."""
import csv
import io
import json
import math
import runpy
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from PIL import Image

base = runpy.run_path(str(Path(__file__).with_name("prepare-flight-routes.py")))
with urlopen("https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/runways.csv") as stream:
    runways = list(csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig")))

atlas = []
for pair in (("HND", "MMJ"), ("HND", "KIX")):
    ports = []
    for code in pair:
        airport, threshold = base["PORTS"][code]
        row = next(r for r in runways if r["airport_ident"] == airport and r["le_ident"] == threshold and r["closed"] == "0")
        ends = [base["mercator"](float(row[end+"_latitude_deg"]), float(row[end+"_longitude_deg"])) for end in ("le","he")]
        ports.append(dict(code=code, ends=ends, width=round(float(row["width_ft"])*0.3048),
                          elevation=round(sum(float(row[k+"_elevation_ft"]) for k in ("le","he"))*.1524)))
    origin = np.mean([p for port in ports for p in port["ends"]], axis=0)
    scale = base["WORLD"] / math.cosh((.5-origin[1])*2*math.pi)
    for port in ports:
        port["ends"] = ((np.array(port["ends"])-origin)*scale).round(1).tolist()
    width, height = (np.ceil((np.abs([p for port in ports for p in port["ends"]]).max(axis=0)+16000)/1000)*2000).astype(int).tolist()
    def sample(cols, rows):
        dx, dy = np.array([width*cols/(cols-1),height*rows/(rows-1)])/(2*scale)
        box = [origin[0]-dx,origin[1]-dy,origin[0]+dx,origin[1]+dy]
        return np.asarray(base["sample"]("dem_png",8,box,(cols,rows))).clip(0)
    cols, rows = math.ceil(width/1800)+1, math.ceil(height/1800)+1
    grid = sample(cols,rows).round().astype(int)
    key = "-".join(pair).lower()
    atlas.append(dict(key=key,width=width,height=height,cols=cols,rows=rows,ports=ports,grid=grid.flatten().tolist()))
    dem = sample(1100,max(64,round(1100*height/width)))
    dy,dx = np.gradient(dem)
    palette = [(0,[52,113,139]),(2,[138,174,123]),(400,[96,141,95]),(1200,[131,134,92]),(2100,[156,137,115]),(3200,[230,233,224])]
    rgb=np.stack([np.interp(dem,[p[0] for p in palette],[p[1][i] for p in palette]) for i in range(3)],axis=-1)
    light=np.clip(1+(dx+dy)*.002,.64,1.31)
    Image.fromarray(np.uint8(np.clip(rgb*light[:,:,None],0,255))).save(base["OUT"]/(key+".webp"),quality=86)
    print(key, width, height, grid.max(),flush=True)
base["DATA"].with_name("advanced-route-atlas.json").write_text(json.dumps(atlas,separators=(",",":"))+"\n")
