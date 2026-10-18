"""Extract a bounded OSM pilot subset, without changing the source GeoPackage.
Python standard library only. GeoPackage coordinates verified as OGC CRS84.
Usage: python3 extract_tuguegarao.py /path/to/philippines.gpkg
"""
from pathlib import Path
import collections
import csv
import json
import sqlite3
import struct
import sys

out=Path(__file__).parent/'tuguegarao_osm'
out.mkdir(parents=True,exist_ok=True)
src=Path(sys.argv[1])
con=sqlite3.connect(src.resolve().as_uri()+'?mode=ro',uri=True)
con.row_factory=sqlite3.Row

def geometry(blob):
    if blob[:2]!=b'GP':raise ValueError('Not GeoPackage geometry')
    flags=blob[3]
    offset=8+{0:0,1:32,2:48,3:48,4:64}[(flags>>1)&7]
    def read(pos):
        endian='<' if blob[pos]==1 else '>'
        typ=struct.unpack_from(endian+'I',blob,pos+1)[0];pos+=5
        def integer(p):return struct.unpack_from(endian+'I',blob,p)[0],p+4
        def point(p):return list(struct.unpack_from(endian+'dd',blob,p)),p+16
        def ring(p):
            n,p=integer(p);points=[]
            for _ in range(n):v,p=point(p);points.append(v)
            return points,p
        if typ==1:v,pos=point(pos);return {'type':'Point','coordinates':v},pos
        if typ==2:v,pos=ring(pos);return {'type':'LineString','coordinates':v},pos
        if typ==3:
            n,pos=integer(pos);rings=[]
            for _ in range(n):v,pos=ring(pos);rings.append(v)
            return {'type':'Polygon','coordinates':rings},pos
        if typ in [4,5,6]:
            n,pos=integer(pos);parts=[]
            for _ in range(n):v,pos=read(pos);parts.append(v['coordinates'])
            return {'type':{4:'MultiPoint',5:'MultiLineString',6:'MultiPolygon'}[typ],'coordinates':parts},pos
        raise ValueError(f'Unexpected WKB type {typ}')
    return read(offset)[0]

def points(coords):
    if len(coords)==2 and isinstance(coords[0],(int,float)):
        yield coords
    else:
        for c in coords:yield from points(c)

def bounds(g):
    ps=list(points(g['coordinates']))
    return [min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]

def envelope(blob):
    flags=blob[3];kind=(flags>>1)&7
    if kind:
        e='<' if flags&1 else '>'
        lo,hi,bottom,top=struct.unpack_from(e+'dddd',blob,8)
        return [lo,bottom,hi,top]
    return bounds(geometry(blob))

def intersects(a,b):return a[0]<=b[2] and a[2]>=b[0] and a[1]<=b[3] and a[3]>=b[1]

admin=con.execute("select * from gis_osm_adminareas_a_free where name='Tuguegarao'").fetchall()
assert len(admin)==1
boundary=geometry(admin[0]['geom']);city=bounds(boundary)
box=[city[0]-.02,city[1]-.02,city[2]+.02,city[3]+.02]

def feature(row,g):
    return {'type':'Feature','geometry':g,'properties':{k:row[k] for k in row.keys() if k!='geom'}}

def save(name,features):
    p=out/(name+'.geojson');p.write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':'))+'\n')
    return {'features':len(features),'bytes':p.stat().st_size}

summary={'source_file':src.name,'source_bytes':src.stat().st_size,
 'source_folder':src.parent.name,'extraction_date':'2026-10-18',
 'coordinate_reference':'OGC CRS84 longitude latitude',
 'city_boundary_bbox':city,'extract_bbox':box,
 'selection':'Bounding box of OSM Tuguegarao boundary plus 0.02 degrees on each side. Not clipped to official city limits; adjacent municipalities may be included.',
 'layers':{}}
summary['layers']['city_boundary']=save('city_boundary',[feature(admin[0],boundary)])
health={'hospital','clinic','doctors','dentist','pharmacy','nursing_home','veterinary'}
candidates=[]
for table,name in [('gis_osm_roads_free','roads'),('gis_osm_places_free','places'),('gis_osm_pois_free','health_points'),('gis_osm_pois_a_free','health_areas')]:
    sql='select * from '+table
    if name.startswith('health'):
        sql+=' where fclass in ('+','.join('?' for _ in health)+')'
        rows=con.execute(sql,sorted(health))
    else:rows=con.execute(sql)
    fs=[]
    for row in rows:
        blob=row['geom']
        if blob is None or not intersects(envelope(blob),box):continue
        g=geometry(blob);fs.append(feature(row,g))
        if name.startswith('health'):
            b=bounds(g)
            candidates.append({'source_layer':table,'osm_id':row['osm_id'],'name':row['name'] or '',
                 'fclass':row['fclass'],'reference_lon':(b[0]+b[2])/2,'reference_lat':(b[1]+b[3])/2,
                 'reference_method':'mapped point' if g['type']=='Point' else 'geometry bounding-box midpoint',
                 'verification_status':'OSM candidate only; not verified by DOH; may be outside city'})
    summary['layers'][name]=save(name,fs)
    summary['layers'][name]['classes']=dict(collections.Counter(f['properties']['fclass'] for f in fs))
    if name=='roads':
        summary['road_quality']={'maxspeed_zero_or_blank':sum(not f['properties']['maxspeed'] for f in fs),
           'oneway_values':dict(collections.Counter(str(f['properties']['oneway']) for f in fs)),
           'note':'Line geometry does not guarantee a connected routable graph. Preserve bridge/layer/oneway tags; do not connect every crossing.'}
    print(name,len(fs),flush=True)
with (out/'health_candidates.csv').open('w',newline='') as f:
    cols=['source_layer','osm_id','name','fclass','reference_lon','reference_lat','reference_method','verification_status']
    w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows(candidates)
(out/'extraction_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(out/'sources.txt').write_text('Publisher: OpenStreetMap contributors; extract distributed by Geofabrik GmbH\nSource URL: https://download.geofabrik.de/asia/philippines.html\nSource folder supplied: '+src.parent.name+'\nPublication date: Snapshot date appears in folder name; exact OSM cutoff not independently verified\nDate downloaded: Not supplied by user\nDate extracted: October 18, 2026\nLicense: Open Database License 1.0 (ODbL)\nLicense URL: https://www.openstreetmap.org/copyright\nAttribution: OpenStreetMap contributors, distributed by Geofabrik GmbH\nChanges: Geographic and thematic filtering to the documented bbox; GeoJSON export; candidate-location summary. No PSA population substitution.\n')
(out/'README.md').write_text('''# Tuguegarao OSM candidate subset

Extracted read-only from the supplied Geofabrik GeoPackage. See extraction_summary.json for counts and bounds, sources.txt for provenance, and the adjacent extraction script for reproduction.

## Interpretation

- The area is an OSM city-boundary bounding box with a small halo, not an official administrative clip. Neighboring areas may appear.
- city_boundary.geojson is an OSM boundary, not a PSA-certified boundary. places.geojson is a reference-point layer, not a confirmed one-to-one barangay list. Join to PSA codes only after checking names and coordinates.
- Health features include pharmacies, dentists and veterinary features where present. They are not all eligible postnatal facilities or BHSs. Points and areas may duplicate a facility. Do not assign clinical destinations until verified.
- health_candidates.csv polygon reference points are bbox midpoints, not validated entrances or population-weighted centroids.
- roads.geojson contains mapped road segments. It is not yet a validated routing graph. Missing/zero maxspeed does not mean zero travel speed. Travel times require explicit assumptions and network checks.
- Features retain source IDs, geometry, and source attributes. No restricted DHS records are used. Keep PSA census population authoritative rather than OSM place-population tags.
- Preserve OpenStreetMap attribution and applicable ODbL requirements for redistribution. No app or simulation has been implemented by this extraction.
''')
print(json.dumps(summary,indent=2))
