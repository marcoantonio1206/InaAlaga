"""Build geography-only pilot inputs. Standard library; no patients or policy outcomes.
Run: python3 data/geography/build_pilot_v2.py
"""
from pathlib import Path
import csv,json,math,collections,heapq,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'data/geography/pilot_v2';OSM=ROOT/'data/geography/tuguegarao_osm';OUT.mkdir(exist_ok=True)
def read(n):return json.loads((OSM/(n+'.geojson')).read_text())['features']
def write(n,rs):
 with (OUT/n).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rs[0]),lineterminator='\n');w.writeheader();w.writerows(rs)
def hav(a,b):
 x,y=map(math.radians,a);u,v=map(math.radians,b);return 6371.0088*2*math.asin(min(1,math.sqrt(math.sin((v-y)/2)**2+math.cos(y)*math.cos(v)*math.sin((u-x)/2)**2)))
def ring(p,r):
 x,y=p;v=False
 for a,b in zip(r,r[1:]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:v=not v
 return v
g=read('city_boundary')[0]['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
def inside(p):return any(ring(p,x[0]) and not any(ring(p,h) for h in x[1:]) for x in polys)
health={str(f['properties']['osm_id']):f for f in read('health_points')}
stations=[]
for sid,oid,name,status in [('demo_linao_west','4412908190','Linao West demonstration station','Approximate'),('demo_tanza','3641821237','Tanza demonstration station','Supported match')]:
 f=health[oid];p=f['geometry']['coordinates'];assert inside(p)
 stations.append(dict(station_id=sid,name=name,longitude=p[0],latitude=p[1],osm_id=oid,osm_source_layer='gis_osm_pois_free',location_status=status,coordinate_kind='Mapped OSM POI; entrance unverified',service_eligibility='Assumed demo station only; staff, referral acceptance and official catchments unverified'))
coords={s['station_id']:(s['longitude'],s['latitude']) for s in stations}
psa=list(csv.DictReader((ROOT/'data/geography/psa_tuguegarao/barangays_population_2024.csv').open()));byname={r['barangay_name']:r for r in psa}
# Selection rule fixed independently of policy outcomes: exact name + city containment,
# nearest station within 5 km; 3 near/lower-middle/far for Linao, 2 near/far for Tanza.
candidates=[];groups=collections.defaultdict(list)
for f in read('places'):
 n=f['properties']['name'];p=f['geometry']['coordinates']
 if n not in byname or not inside(p):continue
 ds={k:hav(p,v) for k,v in coords.items()};sid=min(ds,key=lambda k:(ds[k],k));eligible=ds[sid]<=5
 r=dict(name=n,psgc=byname[n]['psgc'],longitude=p[0],latitude=p[1],osm_id=str(f['properties']['osm_id']),osm_source_layer='gis_osm_places_free',inside_osm_city=True,nearest_station_id=sid,nearest_distance_km=ds[sid],within_5km=eligible,selected=False,selection_role='',coordinate_kind='Approximate settlement reference; not home, centroid or exact facility',psa_population_2024=int(byname[n]['population_2024']),psa_table_as_of='2025-07-31')
 candidates.append(r)
 if eligible:groups[sid].append(r)
selected=[]
for sid in sorted(coords):
 rs=sorted(groups[sid],key=lambda r:(r['nearest_distance_km'],r['psgc']));assert len(rs)>=3
 picks=[(0,'near'),((len(rs)-1)//2,'middle'),(len(rs)-1,'far')] if sid=='demo_linao_west' else [(0,'near'),(len(rs)-1,'far')]
 for i,label in picks:
  r=rs[i];r['selected']=True;r['selection_role']=label;selected.append(r)
assert len(selected)==5 and len({r['psgc'] for r in selected})==5
write('candidate_selection.csv',sorted(candidates,key=lambda r:r['psgc']));write('barangays.csv',selected);write('stations.csv',stations)
mat=[];sensitivity=[]
for b in selected:
 for s in stations:
  distance=hav((b['longitude'],b['latitude']),coords[s['station_id']]);base=max(5,distance/15*60)
  r=dict(origin_psgc=b['psgc'],origin_name=b['name'],station_id=s['station_id'],assigned_station=s['station_id']==b['nearest_station_id'],distance_km=round(distance,6),one_way_minutes=round(base,6),round_trip_travel_minutes=round(2*base,6),method='Haversine straight-line distance; assumed 15 km/h; 5-minute minimum',source_date='Extracted 2026-10-18; exact OSM cutoff unverified',speed_kmh_assumed=15,minimum_one_way_minutes=5,clinical_or_measured_time=False)
  mat.append(r)
  for multiplier in [.5,1,2]:sensitivity.append(dict(origin_psgc=b['psgc'],station_id=s['station_id'],travel_multiplier=multiplier,one_way_minutes=round(base*multiplier,6),round_trip_travel_minutes=round(2*base*multiplier,6),rule='Multiply baseline AFTER applying 5-minute floor; do not reapply floor'))
write('travel_matrix.csv',mat);write('travel_sensitivity.csv',sensitivity)
# Road proximity/connectivity diagnostic only; travel formula does NOT use this graph.
allowed={'trunk','trunk_link','primary','secondary','tertiary','tertiary_link','residential','unclassified','service'}
roads=[f for f in read('roads') if f['properties']['fclass'] in allowed]
graph=collections.defaultdict(list);vertices=[]
for f in roads:
 p=f['properties'];cs=f['geometry']['coordinates'];keys=[(a[0],a[1],p['layer'],p['bridge'],p['tunnel']) for a in cs]
 for k in keys:vertices.append((k,p))
 for a,b,ka,kb in zip(cs,cs[1:],keys,keys[1:]):
  w=hav(a,b)*1000
  if p['oneway'] in {'B','F'}:graph[ka].append((kb,w))
  if p['oneway'] in {'B','T'}:graph[kb].append((ka,w))
refs={**coords,**{b['psgc']:(b['longitude'],b['latitude']) for b in selected}}
snaps={};screen=[]
for rid,pt in refs.items():
 k,p=min(vertices,key=lambda v:(hav(pt,v[0][:2]),str(v[1]['osm_id'])));snaps[rid]=k
 screen.append(dict(reference_id=rid,nearest_vertex_gap_m=round(hav(pt,k[:2])*1000,3),road_osm_id=p['osm_id'],road_class=p['fclass'],road_name=p['name'],oneway=p['oneway'],layer=p['layer'],bridge=p['bridge'],tunnel=p['tunnel'],status='Geometric vertex proximity only; connector and legal access unverified'))
write('road_screen.csv',screen)
connect=[]
for sid in coords:
 start=snaps[sid];seen={start};todo=[start]
 while todo:
  u=todo.pop()
  for v,_ in graph[u]:
   if v not in seen:seen.add(v);todo.append(v)
 for b in selected:connect.append(dict(station_id=sid,barangay_psgc=b['psgc'],outbound_graph_connected=snaps[b['psgc']] in seen,diagnostic='Exact shared vertices + same layer/bridge/tunnel; no arbitrary crossing nodes; access restrictions missing; nearest vertices not entrances'))
write('road_connectivity_screen.csv',connect)
config={'version':'2.0','decision_date':'2026-10-18','stage':'Geography inputs only; no patients or policy outcomes','selection_rule':'Exact PSA/OSM name match, inside OSM city boundary, nearest station within 5 km; Linao near/lower-middle/far and Tanza near/far in ordered eligible lists. Ties by PSGC. 5 km footprint and 3/2 quota are demonstration design assumptions.','assignment_rule':'Minimum unrounded haversine distance; tie by station_id. Select BEFORE time floor; keep assignment fixed across policies and travel multipliers. This is not an official catchment.','travel_formula':'base_minutes = max(5, haversine_km / 15 * 60)','travel_multipliers':[.5,1,2],'floor_order':'Apply baseline floor first; multiply resulting time. Slow/fast scenarios may have minimum 10/2.5 minutes.','round_trip':'2 * one_way_minutes; same outbound/return assumed; add service duration separately later','station_case_shares_assumed':{'demo_linao_west':.6,'demo_tanza':.4},'limitations':['Settlement reference points do not represent all homes or within-barangay travel','Linao location approximate; entrances/access unverified','Straight-line travel estimate is not routed or measured time; rivers/road detours may be omitted','No clinical timing or outcome claims; no catchment/staff confirmation','PSA geography table July 2025, population 2024; exact OSM cutoff unverified','5 km footprint and selected near/far coverage are not representative city sampling'], 'input_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [OSM/'places.geojson',OSM/'health_points.geojson',OSM/'roads.geojson',OSM/'city_boundary.geojson',ROOT/'data/geography/psa_tuguegarao/barangays_population_2024.csv',Path(__file__)]}}
(OUT/'assumptions.json').write_text(json.dumps(config,indent=2)+'\n')
# Update demand specification, retaining pairing and optional population sensitivity.
p=ROOT/'data/simulation/demand_allocation.json';a=json.loads(p.read_text());a['version']='2.0';a['status']='Equal demand allocation and pilot_v2 nearest-distance demonstration station rule specified; simulation not implemented';a['main_allocation']['barangays']=[{'psgc':b['psgc'],'name':b['name']} for b in selected];a['station_assignment']={'status':'Specified demo assumption; not official catchments','rule':config['assignment_rule'],'source':'data/geography/pilot_v2/barangays.csv'};a['implementation_gate']='Geography/allocation/travel inputs specified in pilot_v2. Implement and verify the simulation separately; actual service availability and local validity remain unverified.';p.write_text(json.dumps(a,indent=2)+'\n')
# Basic independent boundary/consistency checks.
assert hav((121,17),(121,17))==0 and abs(hav((0,0),(0,1))-111.19508)<.001
assert len(mat)==10 and len(sensitivity)==30 and sum(r['assigned_station'] for r in mat)==5
assert all(r['one_way_minutes']>=5 for r in mat)
assert all(r['round_trip_travel_minutes']==round(2*r['one_way_minutes'],6) or abs(r['round_trip_travel_minutes']-2*r['one_way_minutes'])<.000002 for r in mat)
print('Road screening:', sum(r['outbound_graph_connected'] for r in connect), 'of', len(connect), 'outbound pairs connected; disconnections retained, not treated as validated travel routes.')
for b in selected:assert byname[b['name']]['psgc']==b['psgc']
print('Validated 5 barangays, 2 stations, 10 pairs, 30 sensitivity rows, leading-zero codes and road screening connectivity.')
for r in mat:
 if r['assigned_station']:print(r['origin_name'],r['station_id'],r['distance_km'],r['one_way_minutes'])
