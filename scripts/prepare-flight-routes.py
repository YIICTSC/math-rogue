"""Rebuild the four packaged flight corridors from GSI tiles and OurAirports runways.
Requires Python 3, Pillow and numpy. Set FLIGHT_TILE_CACHE to reuse downloaded tiles.
"""
import csv
import io
import json
import math
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from time import sleep
from urllib.error import HTTPError
from urllib.request import urlopen

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/sprites/flight-school/routes'
DATA = ROOT / 'src/mini-games/flight-school/route-atlas.json'
CACHE = Path(os.getenv('FLIGHT_TILE_CACHE', tempfile.gettempdir() + '/flight-route-tiles'))
RADIUS = 6378137
WORLD = 2 * math.pi * RADIUS
PORTS = {'KIX': ('RJBB', '06R'), 'UKB': ('RJBE', '09'), 'HND': ('RJTT', '16L'),
         'NRT': ('RJAA', '16R'), 'MMJ': ('RJAF', '18'), 'TOY': ('RJNT', '02'),
         'OKA': ('ROAH', '18L'), 'UEO': ('ROKJ', '03')}
PAIRS = [('KIX', 'UKB'), ('HND', 'NRT'), ('MMJ', 'TOY'), ('OKA', 'UEO')]


def mercator(lat, lon):
    return [(lon + 180) / 360, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2]


def tile(args):
    layer, z, x, y = args
    dem = layer == 'dem_png'
    ext = 'png' if dem else 'jpg'
    path = CACHE / f'{layer}/{z}/{x}/{y}.{ext}'
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f'https://cyberjapandata.gsi.go.jp/xyz/{layer}/{z}/{x}/{y}.{ext}'
        for attempt in range(4):
            try:
                with urlopen(url, timeout=18) as res:
                    raw = res.read()
                break
            except HTTPError as err:
                if err.code == 404 and not dem and z > 9:
                    # High-resolution orthophotos may end at the coast.
                    _, _, parent = tile((layer,z-1,x//2,y//2))
                    dx,dy=(x%2)*128,(y%2)*128
                    return (x,y,parent.crop((dx,dy,dx+128,dy+128)).resize((256,256),Image.Resampling.BILINEAR))
                if err.code == 404 and dem:
                    raw = b''  # The DEM has no tile over open water.
                    break
                if attempt == 3 or err.code < 500:
                    raise
            except OSError:
                if attempt == 3:
                    raise
            sleep(1 + attempt)
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as fp:
            fp.write(raw)
        os.replace(fp.name, path)
    return (x, y, Image.open(io.BytesIO(path.read_bytes())).convert('RGB') if path.stat().st_size else None)


def sample(layer, zoom, box, size):
    n = 2 ** zoom
    x0, y0, x1, y1 = [v*n for v in box]
    ix, iy = math.floor(x0), math.floor(y0)
    ex, ey = math.ceil(x1), math.ceil(y1)
    mosaic = Image.new('RGB', ((ex-ix)*256, (ey-iy)*256), (128, 0, 0))
    with ThreadPoolExecutor(6) as pool:
        for x, y, img in pool.map(tile, [(layer,zoom,x,y) for x in range(ix,ex) for y in range(iy,ey)]):
            if img:
                mosaic.paste(img, ((x-ix)*256, (y-iy)*256))
    rect = ((x0-ix)*256, (y0-iy)*256, (x1-ix)*256, (y1-iy)*256)
    if layer == 'dem_png':
        rgb = np.array(mosaic).astype('int32')
        val = (rgb[:,:,0]*65536 + rgb[:,:,1]*256 + rgb[:,:,2])
        val = np.where(val == 8388608, 0, np.where(val > 8388608, val-16777216, val))
        return Image.fromarray((val / 100).astype('float32')).resize(size, Image.Resampling.BILINEAR, rect)
    return mosaic.resize(size, Image.Resampling.LANCZOS, rect)


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    with urlopen('https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/runways.csv') as res:
        rows = list(csv.DictReader(io.TextIOWrapper(res, encoding='utf-8-sig')))
    atlas = []
    for a, b in PAIRS:
        ports = []
        for code in (a,b):
            ident, end = PORTS[code]
            row = next(r for r in rows if r['airport_ident'] == ident and r['le_ident'] == end and r['closed']=='0')
            ends = [mercator(float(row[k+'_latitude_deg']),float(row[k+'_longitude_deg'])) for k in ('le','he')]
            ports.append(dict(code=code, ends=ends, width=round(float(row['width_ft'])*.3048),
                              elevation=round(sum(float(row[k+'_elevation_ft']) for k in ('le','he'))*.1524)))
        ends = [p for port in ports for p in port['ends']]
        cx, cy = np.mean(ends,axis=0)
        scale = WORLD / math.cosh((.5-cy)*2*math.pi)
        coords = [[(x-cx)*scale,(y-cy)*scale] for x,y in ends]
        half = [math.ceil((max(abs(p[i]) for p in coords)+11000)/1000)*1000 for i in (0,1)]
        def bounds(x,z,w,h):
            return (cx+(x-w/2)/scale,cy+(z-h/2)/scale,cx+(x+w/2)/scale,cy+(z+h/2)/scale)
        w,h = [v*2 for v in half]
        key = a.lower()+'-'+b.lower()
        shape = (round(2048*w/max(w,h)),round(2048*h/max(w,h)))
        box=bounds(0,0,w,h)
        wide=sample('seamlessphoto',11,box,shape)
        wide.save(OUT/(key+'.webp'),quality=87)
        cols, rows_count = (math.ceil(v/480)+1 for v in (w,h))
        # Grid samples include both edges. PIL resamples at pixel centres.
        grid_box=bounds(0,0,w*cols/(cols-1),h*rows_count/(rows_count-1))
        grid=np.array(sample('dem_png',9,grid_box,(cols,rows_count))).round().astype(int)
        for i,port in enumerate(ports):
            port['ends']=[[round(n,1) for n in p] for p in coords[2*i:2*i+2]]
            x,z=np.mean(port['ends'],axis=0)
            detail=sample('seamlessphoto',15,bounds(x,z,5200,5200),(1280,1280))
            # Some coastal photo tiles return JPEGs with black nodata margins.
            rect=((.5+(x-2600)/w)*shape[0],(.5+(z-2600)/h)*shape[1],
                  (.5+(x+2600)/w)*shape[0],(.5+(z+2600)/h)*shape[1])
            fallback=wide.resize(detail.size,Image.Resampling.BILINEAR,rect)
            missing=Image.fromarray((np.max(np.asarray(detail),axis=2)<10).astype('uint8')*255)
            detail.paste(fallback,mask=missing.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1)))
            detail.save(OUT/(port['code'].lower()+'.webp'),quality=87)
        atlas.append(dict(key=key,width=w,height=h,cols=cols,rows=rows_count,ports=ports,grid=grid.flatten().tolist()))
        print(key,shape,grid.min(),grid.max(),flush=True)
    DATA.write_text(json.dumps(atlas,separators=(',',':'))+'\n')

if __name__ == '__main__':
    build()
