"""Summarize the whole factorial grid; optionally render Matplotlib heatmaps.
python3 -m simulation.factorial_report [--plots]
"""
from pathlib import Path
import argparse
import collections
import csv
import hashlib
import json
import statistics
from .run import distribution
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'simulation/results/factorial_v1'
OUT=ROOT/'simulation/reports/factorial_v1'


def write_csv(path,rows):
    with path.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)


def report(plots=False):
    OUT.mkdir(parents=True,exist_ok=True)
    results=json.loads((RAW/'results.json').read_text()); scenarios=results['scenarios']
    with (RAW/'replications.csv').open(newline='') as f:raw=list(csv.DictReader(f))
    groups=collections.defaultdict(list)
    for r in raw:groups[(r['scenario_id'],r['policy'])].append(r)
    byconfig={}
    for s in scenarios:
        c=s['config'];key=(c['demand_per_day'],c['workers_per_station'],c['service_minutes'],c['travel_multiplier'],tuple(c['reference_delay_hours']))
        byconfig[key]=s
    # Verify B/C repeat identically over the reference-delay axis, then collapse it for their chart/counts.
    unique_edf=[]
    for demand in [4,8,12]:
        for workers in [1,2]:
            for service in [15,30,60]:
                for travel in [.5,1,2]:
                    variants=[byconfig[(demand,workers,service,travel,d)] for d in [(6,24),(12,48),(24,72)]]
                    for p in ['B','C']:
                        assert all(v['policy_metrics'][p]==variants[0]['policy_metrics'][p] for v in variants)
                    unique_edf.append(variants[1])
    assert len(unique_edf)==54
    staffing=[];interactions=[]
    for key,s in sorted(byconfig.items()):
        demand,workers,service,travel,delay=key
        if workers!=1:continue
        two=byconfig[(demand,2,service,travel,delay)]
        for p in ['A','B','C','D']:
            a=sorted(groups[(s['scenario_id'],p)],key=lambda r:int(r['seed']))
            b=sorted(groups[(two['scenario_id'],p)],key=lambda r:int(r['seed']))
            assert all(x['seed']==y['seed'] and x['case_sha256']==y['case_sha256'] for x,y in zip(a,b))
            ds=[100*(float(y['on_time_rate'])-float(x['on_time_rate'])) for x,y in zip(a,b)]
            d=distribution(ds)
            staffing.append({'demand_per_day':demand,'service_minutes':service,'travel_multiplier':travel,
                'reference_delay_hours':f'{delay[0]}-{delay[1]}','policy':p,
                'comparison':'two_minus_one_worker_per_station; extra resources, not scheduling gain',
                'mean_difference_pp':d['mean'],'p025_pp':d['central_95_simulation_interval'][0],
                'p975_pp':d['central_95_simulation_interval'][1]})
        if delay==(12,48):
            def deltas(v):
                bs=sorted(groups[(v['scenario_id'],'B')],key=lambda r:int(r['seed']))
                cs=sorted(groups[(v['scenario_id'],'C')],key=lambda r:int(r['seed']))
                return [100*(float(c['on_time_rate'])-float(b['on_time_rate'])) for b,c in zip(bs,cs)]
            ds=[b-a for a,b in zip(deltas(s),deltas(two))];d=distribution(ds)
            interactions.append({'demand_per_day':demand,'service_minutes':service,'travel_multiplier':travel,
                'comparison':'(C-B with two workers) minus (C-B with one worker)',
                'mean_interaction_pp':d['mean'],'p025_pp':d['central_95_simulation_interval'][0],
                'p975_pp':d['central_95_simulation_interval'][1]})
    write_csv(OUT/'staffing_comparisons.csv',staffing);write_csv(OUT/'capacity_scheduling_interactions.csv',interactions)
    def sign_counts(ss,label):
        vs=[s['paired_comparisons_percentage_points'][label]['mean'] for s in ss]
        return {'positive_mean':sum(v>1e-9 for v in vs),'zero_mean':sum(abs(v)<=1e-9 for v in vs),'negative_mean':sum(v< -1e-9 for v in vs),'minimum_mean_pp':min(vs),'maximum_mean_pp':max(vs)}
    counts={'B_minus_A_full_grid':sign_counts(scenarios,'B_minus_A'),
            'C_minus_B_unique_grid':sign_counts(unique_edf,'C_minus_B')}
    lines=['# Full-factorial uncertainty findings','',
        '162 configurations × 100 matched replications × four policies = **64,800 policy runs**. The design was saved before these runs. Model v1.0.0 is unchanged; the original 30-configuration results remain separate in `../../results/v1/`. This is an exploration of assumed conditions, not a forecast for Tuguegarao.','',
        '## Design and interpretation','',
        'Demand 4/8/12 per day; 1/2 workers per station; service 15/30/60 minutes; travel 0.5x/1x/2x; reference handoff 6–24/12–48/24–72 hours. Faster handoff remains 0–6 hours. All other parameters remain fixed: 14 arrival days, 7 drain days, 09:00–13:00 shifts, 24/48/72-hour administrative deadlines, zero initial backlog, successful served contacts, pilot v2 and its 60/40 expected station demand split.','',
        'A/B compare handoff delay at fixed FIFO scheduling. B/C compare scheduling at the same faster handoff and same resources. D uses reference handoff plus EDF. Worker counts are separate resource scenarios; staffing gains must not be attributed to scheduling. The complete raw design and all 162 scenario summaries are linked below.','',
        'The reference-delay axis does not affect B or C. Therefore their 162 grid entries contain **54 distinct B/C parameter settings**, each repeated three times across the reference-delay axis with identical outputs. Their repeated appearances are not independent evidence. Seed draws are paired across scenarios as well as policies, so scenario outcomes are correlated.','',
        '## Results across the stated grid','',
        f"B−A means: {counts['B_minus_A_full_grid']['positive_mean']} positive, {counts['B_minus_A_full_grid']['zero_mean']} zero, {counts['B_minus_A_full_grid']['negative_mean']} negative across 162 configurations; range {counts['B_minus_A_full_grid']['minimum_mean_pp']:.2f} to {counts['B_minus_A_full_grid']['maximum_mean_pp']:.2f} percentage points.", '',
        f"C−B means: {counts['C_minus_B_unique_grid']['positive_mean']} positive, {counts['C_minus_B_unique_grid']['zero_mean']} zero, {counts['C_minus_B_unique_grid']['negative_mean']} negative across the 54 distinct settings; range {counts['C_minus_B_unique_grid']['minimum_mean_pp']:.2f} to {counts['C_minus_B_unique_grid']['maximum_mean_pp']:.2f} percentage points.", '',
        'These signs classify the mean differences numerically, not statistical significance, practical importance, or the chance a policy helps in the real city. All intervals are the central 95% range of seed-level differences, not confidence intervals for the mean or local effectiveness. Counts across equally spaced grid settings do not estimate how frequently those conditions occur locally.','',
        '## Complete scheduling comparison (B/C; reference-delay duplicates collapsed)','',
        '| Demand/day | Workers/station | Service min | Travel multiplier | C−B mean pp | Central 95% simulation range | Replications C worse |',
        '| --- | --- | --- | --- | ---: | --- | ---: |']
    for s in unique_edf:
        c=s['config'];d=s['paired_comparisons_percentage_points']['C_minus_B'];lo,hi=d['central_95_simulation_interval']
        lines.append(f"| {c['demand_per_day']} | {c['workers_per_station']} | {c['service_minutes']} | {c['travel_multiplier']} | {d['mean']:.2f} | [{lo:.2f}, {hi:.2f}] | {100*d['fraction_negative']:.0f}% |")
    lines += ['', '## How to use these results','',
        'Read conditional cells and their intervals rather than selecting one headline percentage. Faster handoff gains depend on the assumed reference-delay ranges and short administrative deadlines; none of those delay ranges has been measured locally. EDF is not an optimal scheduler for maximizing on-time completions: it can spend capacity on already-overdue jobs, and the shared head-of-line rule can leave end-of-shift time unused. A ranking reversal is a model finding, not a reason to remove a scenario.','',
        '`staffing_comparisons.csv` separately reports paired two-worker-minus-one-worker gains for each unchanged policy. `capacity_scheduling_interactions.csv` shows how the C−B scheduling difference changes with worker capacity. Those are additional-resource comparisons/conditional interactions, not proof that the software creates capacity.','',
        'No local workflow review, operational timestamp calibration, service-eligibility confirmation, or clinical validation has been added by this experiment. Demand, hours, service, delay and travel remain assumptions. Initial backlog, alternate deadline distributions, unsuccessful attempts and station-location/assignment uncertainty are not varied here; see the original sensitivities and limitations. The original geographic caveats persist.','',
        '## Reproduction and artifacts','',
        'From project root: `python3 -m simulation.factorial --replications 100`. See `../../README.md` for model rules and `../../factorial_report.py` for this report builder. Tables and raw inputs/results: [full scenario table](../../results/factorial_v1/scenario_summary.csv), [frozen design](../../results/factorial_v1/experiment_design.json), [results JSON](../../results/factorial_v1/results.json), [all seed-level policy metrics](../../results/factorial_v1/replications.csv), [paired differences](../../results/factorial_v1/paired_differences.csv).', '',
        'Heatmaps show mean paired percentage-point differences, with consistent color scales within each comparison. White is zero; warm negative colors indicate the alternative has a lower mean on-time rate, cool positive colors indicate higher. Every cell is annotated; uncertainty remains in the full table. C−B panels collapse the redundant reference-delay axis.']
    if plots:
        render_heatmaps(scenarios,unique_edf)
        lines += ['','![Handoff comparison with one worker](handoff_workers_1.png)',
                  '','![Handoff comparison with two workers](handoff_workers_2.png)',
                  '','![Scheduling comparison across capacities](scheduling_by_capacity.png)']
    (OUT/'FINDINGS.md').write_text('\n'.join(lines)+'\n')
    (OUT/'grid_counts.json').write_text(json.dumps(counts,indent=2)+'\n')
    manifest={'source_results_sha256':hashlib.sha256((RAW/'results.json').read_bytes()).hexdigest(),
        'source_replications_sha256':hashlib.sha256((RAW/'replications.csv').read_bytes()).hexdigest(),
        'report_builder_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'outputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.iterdir()) if p.is_file() and p.name!='manifest.json'}}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(counts,indent=2))


def render_heatmaps(scenarios,unique_edf):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.colors import TwoSlopeNorm
    import numpy as np
    plt.rcParams.update({'font.size':10,'font.family':'DejaVu Sans','svg.hashsalt':'inaalaga-factorial-v1'})
    def draw(axes,subset,label,limit):
        a=np.zeros((3,3))
        for i,d in enumerate([4,8,12]):
            for j,t in enumerate([.5,1,2]):
                s=next(s for s in subset if s['config']['demand_per_day']==d and s['config']['travel_multiplier']==t)
                a[i,j]=s['paired_comparisons_percentage_points'][label]['mean']
        im=axes.imshow(a,cmap='RdBu',norm=TwoSlopeNorm(vmin=-limit,vcenter=0,vmax=limit),aspect='auto')
        axes.set_xticks([0,1,2],['0.5x','1x','2x']);axes.set_yticks([0,1,2],['4','8','12'])
        axes.set_xlabel('Travel duration');axes.set_ylabel('Cases per day')
        for (i,j),v in np.ndenumerate(a):axes.text(j,i,f'{v:+.1f}',ha='center',va='center',color='white' if abs(v)>limit*.6 else '#111111',fontsize=12,fontweight='bold')
        return im
    limits={label:max(1,max(abs(s['paired_comparisons_percentage_points'][label]['mean']) for s in scenarios)) for label in ['B_minus_A','C_minus_B']}
    for workers in [1,2]:
        fig,axs=plt.subplots(3,3,figsize=(12,10),layout='constrained')
        for i,service in enumerate([15,30,60]):
            for j,delay in enumerate([(6,24),(12,48),(24,72)]):
                ss=[s for s in scenarios if s['config']['workers_per_station']==workers and s['config']['service_minutes']==service and tuple(s['config']['reference_delay_hours'])==delay]
                im=draw(axs[i,j],ss,'B_minus_A',limits['B_minus_A']);axs[i,j].set_title(f'Service {service} min\nReference delay {delay[0]}–{delay[1]}h',fontsize=10)
        fig.suptitle(f'Faster handoff: B minus A | {workers} worker(s) per station\nMean paired on-time difference (percentage points); hypothetical inputs\n100 paired replications per cell; uncertainty ranges in scenario_summary.csv',fontsize=13)
        fig.colorbar(im,ax=axs.ravel().tolist(),shrink=.65,label='Mean paired difference (pp)')
        fig.savefig(OUT/f'handoff_workers_{workers}.png',dpi=160);plt.close(fig)
    fig,axs=plt.subplots(3,2,figsize=(10,10),layout='constrained')
    for i,service in enumerate([15,30,60]):
        for j,workers in enumerate([1,2]):
            ss=[s for s in unique_edf if s['config']['workers_per_station']==workers and s['config']['service_minutes']==service]
            im=draw(axs[i,j],ss,'C_minus_B',limits['C_minus_B']);axs[i,j].set_title(f'{workers} worker(s)/station | service {service} min')
    fig.suptitle('Deadline scheduling: C minus B\nMean paired difference (pp); 54 unique settings; hypothetical inputs\n100 paired replications per cell; uncertainty ranges in scenario_summary.csv',fontsize=13)
    fig.colorbar(im,ax=axs.ravel().tolist(),shrink=.65,label='Mean paired difference (pp)')
    fig.savefig(OUT/'scheduling_by_capacity.png',dpi=160);plt.close(fig)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--plots',action='store_true');a=p.parse_args();report(a.plots)
