"""Frozen full-factorial uncertainty experiment; uses the unchanged v1 simulation engine.
python3 -m simulation.factorial --replications 100
"""
from dataclasses import asdict
from pathlib import Path
from itertools import product
import argparse
import collections
import csv
import hashlib
import json
import platform
from .model import VERSION, Config, digest, generate, load_pilot, simulate, verify_run
from .run import distribution
ROOT = Path(__file__).resolve().parents[1]
AXES = {'demand_per_day': [4, 8, 12], 'workers_per_station': [1, 2],
        'service_minutes': [15, 30, 60], 'travel_multiplier': [.5, 1, 2],
        'reference_delay_hours': [(6, 24), (12, 48), (24, 72)]}
POLICIES = ['A', 'B', 'C', 'D']
COMPARISONS = [('A', 'B'), ('B', 'C'), ('A', 'C'), ('A', 'D'), ('D', 'C')]


def experiment_plan():
    rows = []
    for demand, workers, service, travel, delay in product(*AXES.values()):
        cfg = Config(demand_per_day=demand, workers_per_station=workers,
                     service_minutes=service, travel_multiplier=travel, reference_delay_hours=delay)
        cfg.validate()
        sid = f'd{demand}_w{workers}_s{service}_t{travel:g}_h{delay[0]}-{delay[1]}'
        rows.append((sid, cfg))
    assert len(rows) == 162 and len({sid for sid, _ in rows}) == 162
    return rows


def run(output, replications=100, first_seed=20261018):
    if replications < 1 or first_seed < 0:
        raise ValueError('Positive replication count and nonnegative first seed required')
    pilot = load_pilot(ROOT); plan = experiment_plan(); output.mkdir(parents=True, exist_ok=True)
    sources = [Path(__file__), ROOT/'simulation/model.py', ROOT/'simulation/run.py']
    design = {'schema_version': '1.0', 'experiment_version': 'factorial-v1', 'model_version': VERSION,
        'axes': AXES, 'scenario_count': len(plan), 'policies': POLICIES,
        'replications_per_scenario': replications, 'first_seed': first_seed,
        'fixed_parameters': {'arrival_days':14, 'drain_days':7, 'shift_minutes':[540,780],
            'fast_delay_hours':[0,6], 'due_windows_hours':[24,48,72], 'backlog_days':0,
            'barangay_allocation':'Uniform probability, five pilot_v2 reference points; expected station demand 60/40'},
        'comparison_rules': ['Same cases, resources and uniform handoff draws within every policy comparison',
            'Workers=1 and workers=2 are separate resource scenarios; never attribute staffing gains to scheduling',
            'Case draws also match across worker counts and reference-delay levels for each seed/demand/service/travel',
            'Report all 162 combinations; no selection based on outcomes; equal grid counts are not probability weights for real conditions',
            'Central 95% replication ranges reflect scenario randomness, not city-effect or mean confidence intervals'],
        'scenarios':[{'scenario_id':sid,'config':asdict(c),'config_sha256':digest(asdict(c))} for sid,c in plan],
        'source_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
        'pilot_input_sha256':pilot['input_sha256']}
    dhash = digest(design)
    old = output/'experiment_design.json'
    if old.exists() and digest(json.loads(old.read_text())) != dhash:
        raise ValueError('Existing output has another frozen design; use a fresh output directory')
    old.write_text(json.dumps(design,indent=2,allow_nan=False)+'\n')
    summaries=[]; flat=[]; cross_cohorts={}; paired_groups=0
    # Raw artifacts are streamed; the complete design above exists before any outcomes.
    with (output/'replications.csv').open('w',newline='') as rf, (output/'paired_differences.csv').open('w',newline='') as pf:
        rw=pw=None
        for index,(sid,cfg) in enumerate(plan,1):
            values={p:[] for p in POLICIES}; diffs={f'{b}_minus_{a}':[] for a,b in COMPARISONS}
            for replication in range(replications):
                seed=first_seed+replication; cases=generate(cfg,seed,pilot)
                chash=digest([asdict(c) for c in cases]); outputs={}
                ckey=(cfg.demand_per_day,cfg.service_minutes,cfg.travel_multiplier,seed)
                if ckey in cross_cohorts: assert cross_cohorts[ckey]==chash
                else: cross_cohorts[ckey]=chash
                for policy in POLICIES:
                    r=simulate(cases,cfg,policy,pilot['stations']);verify_run(cases,r,cfg)
                    assert digest([asdict(c) for c in cases])==chash
                    m=r['metrics'];values[policy].append(m);outputs[policy]=m
                    row={'scenario_id':sid,'policy':policy,'replication':replication,'seed':seed,
                         'config_sha256':digest(asdict(cfg)),'case_sha256':chash,**m}
                    if rw is None:
                        rw=csv.DictWriter(rf,fieldnames=list(row),lineterminator='\n');rw.writeheader()
                    rw.writerow(row)
                paired_groups+=1
                for a,b in COMPARISONS:
                    x,y=outputs[a]['on_time_rate'],outputs[b]['on_time_rate']
                    delta=100*(y-x) if x is not None and y is not None else None
                    label=f'{b}_minus_{a}';diffs[label].append(delta)
                    row={'scenario_id':sid,'replication':replication,'seed':seed,'comparison':label,
                         'difference_percentage_points':delta,'case_sha256':chash}
                    if pw is None:
                        pw=csv.DictWriter(pf,fieldnames=list(row),lineterminator='\n');pw.writeheader()
                    pw.writerow(row)
            comparisons={}
            for label,ds in diffs.items():
                xs=[x for x in ds if x is not None];n=len(xs)
                comparisons[label]={**distribution(ds),
                    'fraction_positive':sum(x>1e-9 for x in xs)/n if n else None,
                    'fraction_tied':sum(abs(x)<=1e-9 for x in xs)/n if n else None,
                    'fraction_negative':sum(x< -1e-9 for x in xs)/n if n else None}
            pm={p:{k:distribution([m[k] for m in values[p]]) for k in values[p][0]} for p in POLICIES}
            summaries.append({'scenario_id':sid,'config':asdict(cfg),'config_sha256':digest(asdict(cfg)),
                'policy_metrics':pm,'paired_comparisons_percentage_points':comparisons})
            row={'scenario_id':sid,'demand_per_day':cfg.demand_per_day,'workers_per_station':cfg.workers_per_station,
                 'service_minutes':cfg.service_minutes,'travel_multiplier':cfg.travel_multiplier,
                 'reference_delay_hours':f'{cfg.reference_delay_hours[0]}-{cfg.reference_delay_hours[1]}'}
            for p in POLICIES:
                for metric in ['on_time_rate','unserved_rate','utilization']:
                    row[f'{p}_{metric}_mean']=pm[p][metric]['mean']
            for label,v in comparisons.items():
                row[label+'_mean_pp']=v['mean'];row[label+'_p025_pp'],row[label+'_p975_pp']=v['central_95_simulation_interval']
                row[label+'_fraction_negative']=v['fraction_negative'];row[label+'_fraction_tied']=v['fraction_tied']
            flat.append(row)
            if index%9==0: print(f'{index}/162 configurations complete; {paired_groups*4} policy runs verified',flush=True)
    assert paired_groups==162*replications
    results={'schema_version':'1.0','experiment_version':'factorial-v1','model_version':VERSION,
        'experiment_design_sha256':dhash,'kind':'Hypothetical full-factorial synthetic simulation; not measured local effectiveness',
        'metric_units':{'rates':'fraction 0–1','paired_differences':'percentage points','times':'minutes'},
        'interval_definition':'2.5th–97.5th percentiles of seed-level outcomes/differences; not confidence intervals for city effects or the simulation mean',
        'primary_denominator':'All new 14-day cases, including late and never-served; 7 drain days; no initial backlog in this grid',
        'limitations':['All five varied inputs are assumptions, not measured Tuguegarao operating conditions',
            'No sampling of real-world scenario probabilities; counts across grid cells are descriptive, not a probability of effectiveness',
            'Fixed 09:00–13:00 shifts, successful served contacts and queue-head waiting rule remain simplifying assumptions',
            'No initial backlog or alternative deadline distribution in this grid; see original v1 sensitivities',
            'Approximate geography/travel, unverified services/catchments, expected 60/40 station demand',
            'Local workflow/clinical validation remains outstanding'],
        'pairing_audit':{'passed':True,'paired_groups':paired_groups,'policies_per_group':4,
            'worker_and_reference_delay_cross_scenario_cohort_checks':True},'scenarios':summaries}
    (output/'results.json').write_text(json.dumps(results,indent=2,allow_nan=False)+'\n')
    with (output/'scenario_summary.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(flat[0]),lineterminator='\n');w.writeheader();w.writerows(flat)
    manifest={'experiment_version':'factorial-v1','model_version':VERSION,'python_version':platform.python_version(),
        'experiment_design_sha256':dhash,'source_and_inputs':{**pilot['input_sha256'],**design['source_sha256']},
        'outputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.iterdir()) if p.is_file() and p.name!='manifest.json'}}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return results


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--replications',type=int,default=100);p.add_argument('--first-seed',type=int,default=20261018)
    p.add_argument('--output',type=Path,default=ROOT/'simulation/results/factorial_v1')
    a=p.parse_args();run(a.output,a.replications,a.first_seed)
if __name__=='__main__':main()
