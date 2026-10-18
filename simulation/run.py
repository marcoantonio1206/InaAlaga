"""CLI: python3 -m simulation.run --suite full --replications 100"""
from dataclasses import asdict, replace
from pathlib import Path
import argparse
import csv
import hashlib
import json
import platform
import statistics
from .model import (VERSION, POLICIES, Config, digest, generate, load_pilot,
                    quantile, simulate, summarize_cases, verify_run)
ROOT = Path(__file__).resolve().parents[1]


def plan(suite):
    scenarios = []
    for demand in [4, 8, 12]:
        base = Config(demand_per_day=demand)
        variants = [('base', base)]
        if suite == 'full':
            variants += [('service_15', replace(base, service_minutes=15)),
                         ('service_60', replace(base, service_minutes=60)),
                         ('travel_half', replace(base, travel_multiplier=.5)),
                         ('travel_double', replace(base, travel_multiplier=2)),
                         ('reference_delay_6_24', replace(base, reference_delay_hours=(6, 24))),
                         ('reference_delay_24_72', replace(base, reference_delay_hours=(24, 72))),
                         ('backlog_one_day', replace(base, backlog_days=1)),
                         ('uniform_due_48h', replace(base, due_windows_hours=(48,)))]
        scenarios += [(f'demand_{demand}_{name}', config) for name, config in variants]
    if suite == 'full':
        scenarios += [('demand_12_combined_stress', Config(demand_per_day=12, service_minutes=60, travel_multiplier=2)),
                      ('control_zero_workers', Config(demand_per_day=12, workers_per_station=0)),
                      ('control_abundant_workers', Config(demand_per_day=12, workers_per_station=10))]
    return scenarios


def distribution(values):
    xs = [x for x in values if x is not None]
    return {'mean': statistics.fmean(xs) if xs else None,
            'central_95_simulation_interval': [quantile(xs, .025), quantile(xs, .975)],
            'valid_replications': len(xs), 'missing_replications': len(values) - len(xs)}


def dump_csv(path, rows):
    with path.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n')
        w.writeheader(); w.writerows(rows)


def run(suite, replications, first_seed, output, policies):
    if replications < 1 or first_seed < 0:
        raise ValueError('Positive replication count and nonnegative first seed required')
    pilot = load_pilot(ROOT); scenarios = plan(suite)
    output.mkdir(parents=True, exist_ok=True)
    # Freeze the whole experiment design before generating any policy outcomes.
    design = {'schema_version': '1.0', 'model_version': VERSION, 'suite': suite,
              'replications_per_scenario': replications, 'first_seed': first_seed,
              'policies': policies, 'scenario_count': len(scenarios),
              'scenarios': [{'scenario_id': sid, 'config': asdict(c), 'config_sha256': digest(asdict(c))}
                            for sid, c in scenarios],
              'pilot_input_sha256': pilot['input_sha256'],
              'source_sha256': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
                               for p in [Path(__file__), ROOT / 'simulation/model.py']}}
    design_hash = digest(design)
    previous = output / 'experiment_design.json'
    if previous.exists() and digest(json.loads(previous.read_text())) != design_hash:
        raise ValueError('Output folder has a different design/source version; choose a new --output folder')
    (output / 'experiment_design.json').write_text(json.dumps(design, indent=2, allow_nan=False) + '\n')
    records = []; summaries = []; paired_records = []
    for sid, config in scenarios:
        by_policy = {p: [] for p in policies}; subgroup = {p: {} for p in policies}
        for replication in range(replications):
            seed = first_seed + replication
            cases = generate(config, seed, pilot)
            case_hash = digest([asdict(c) for c in cases]); cohort_hash = digest([asdict(c) for c in cases if not c.is_backlog])
            rep_results = {}
            # Cases, uniform handoff draws, service and geography generated ONCE, shared as immutable dataclasses.
            for policy in policies:
                result = simulate(cases, config, policy, pilot['stations']); verify_run(cases, result, config)
                assert digest([asdict(c) for c in cases]) == case_hash
                m = result['metrics']; by_policy[policy].append(m); rep_results[policy] = m
                records.append({'scenario_id': sid, 'policy': policy, 'replication': replication,
                                'seed': seed, 'config_sha256': digest(asdict(config)),
                                'case_sha256': case_hash, 'new_cohort_sha256': cohort_hash,
                                **m, 'backlog_introduced': result['backlog']['introduced'],
                                'backlog_unserved': result['backlog']['unserved']})
                outs = {o['case_id']: o for o in result['outcomes']}
                cohorts = {f'barangay:{code}': [c for c in cases if not c.is_backlog and c.barangay_psgc == code]
                           for code in pilot['assigned']}
                cohorts.update({f'station:{s}': [c for c in cases if not c.is_backlog and c.station_id == s]
                                for s in pilot['stations']})
                # Near/middle/far are the preselected reference roles, not clinical/fairness classes.
                cohorts.update({f'distance_role:{role}': [c for c in cases if not c.is_backlog and
                    pilot['assigned'][c.barangay_psgc]['selection_role'] == role] for role in ['near', 'middle', 'far']})
                for name, cohort in cohorts.items():
                    subgroup[policy].setdefault(name, []).append(summarize_cases(cohort, outs))
                if sid == 'demand_8_base' and replication == 0:
                    if policy == policies[0]:
                        dump_csv(output / 'synthetic_cases_example.csv', [asdict(c) for c in cases])
                    dump_csv(output / f'timeline_example_{policy}.csv', result['outcomes'])
            for baseline, alternative in [('A', 'B'), ('B', 'C'), ('A', 'C'), ('A', 'D'), ('D', 'C')]:
                if baseline not in rep_results or alternative not in rep_results:
                    continue
                a, b = rep_results[baseline]['on_time_rate'], rep_results[alternative]['on_time_rate']
                paired_records.append({'scenario_id': sid, 'replication': replication, 'seed': seed,
                    'comparison': f'{alternative}_minus_{baseline}',
                    'on_time_difference_percentage_points': 100 * (b - a) if a is not None and b is not None else None,
                    'case_sha256': case_hash})
        comparisons = {}
        for label in sorted({r['comparison'] for r in paired_records if r['scenario_id'] == sid}):
            ds = [r['on_time_difference_percentage_points'] for r in paired_records
                  if r['scenario_id'] == sid and r['comparison'] == label]
            valid = [x for x in ds if x is not None]
            comparisons[label] = {**distribution(ds),
                'fraction_positive': sum(x > 1e-9 for x in valid) / len(valid) if valid else None,
                'fraction_tied': sum(abs(x) <= 1e-9 for x in valid) / len(valid) if valid else None,
                'fraction_negative': sum(x < -1e-9 for x in valid) / len(valid) if valid else None}
        summaries.append({'scenario_id': sid, 'config': asdict(config), 'config_sha256': digest(asdict(config)),
            'policy_metrics': {p: {key: distribution([m[key] for m in by_policy[p]])
                                  for key in by_policy[p][0]} for p in policies},
            'paired_comparisons_percentage_points': comparisons,
            'descriptive_subgroups': {p: {name: {key: distribution([m[key] for m in ms])
                for key in ['introduced', 'on_time_rate', 'unserved_rate']}
                for name, ms in subgroup[p].items()} for p in policies}})
        print(f'{sid}: {replications} paired replications verified', flush=True)
    # Whole-grid pairing audit: no policy receives a different cohort or seed.
    groups = {}
    for r in records:
        groups.setdefault((r['scenario_id'], r['replication']), []).append(r)
    assert len(groups) == len(scenarios) * replications
    assert all(len(rs) == len(policies) and len({r['case_sha256'] for r in rs}) == 1 for rs in groups.values())
    results = {'schema_version': '1.0', 'model_version': VERSION, 'experiment_design_sha256': design_hash,
        'kind': 'Hypothetical synthetic simulation; not operational demo counts or observed city outcomes',
        'interval_definition': '2.5th–97.5th percentiles of replication values; not a confidence interval for real-city effectiveness or the simulation mean',
        'primary_denominator': 'All new cases introduced during 14 arrival days, including late and unserved; preexisting backlog consumes capacity but is reported separately',
        'metric_units': {'rates': 'fraction 0–1', 'paired_differences': 'percentage points', 'times': 'minutes'},
        'limitations': ['All inputs are assumptions; no real workflow or clinical validation',
            'Contact succeeds once served; no no-shows, refusals or clinical outcomes',
            'Administrative due windows are post-discharge assumptions, not WHO birth-based contact guidance',
            'Approximate straight-line travel, same outbound/return; no road/access validation',
            'Linao station approximate; Libag Sur topology unresolved; Pallua Sur assignment sensitive',
            'Equal barangay probabilities imply expected 60/40 station demand, not equal workload',
            'Empty-start terminating experiment; uniform 48h deadlines can still differ under heterogeneous handoff delays'],
        'pairing_audit': {'passed': True, 'paired_groups': len(groups), 'policies_per_group': len(policies)},
        'scenarios': summaries}
    (output / 'results.json').write_text(json.dumps(results, indent=2, allow_nan=False) + '\n')
    dump_csv(output / 'replications.csv', records); dump_csv(output / 'paired_differences.csv', paired_records)
    manifest = {'model_version': VERSION, 'python_version': platform.python_version(),
        'experiment_design_sha256': design_hash, 'source_and_inputs': {**pilot['input_sha256'], **design['source_sha256']},
        'outputs': {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in sorted(output.iterdir()) if p.is_file() and p.name != 'manifest.json'}}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', choices=['smoke', 'full'], default='full')
    parser.add_argument('--replications', type=int, default=100)
    parser.add_argument('--first-seed', type=int, default=20261018)
    parser.add_argument('--output', type=Path, default=ROOT / 'simulation/results/v1')
    parser.add_argument('--policies', nargs='+', choices=list(POLICIES), default=list(POLICIES))
    args = parser.parse_args()
    if len(set(args.policies)) != len(args.policies) or not {'A', 'B', 'C'} <= set(args.policies):
        parser.error('Include distinct policies A, B and C; D is optional')
    run(args.suite, args.replications, args.first_seed, args.output, args.policies)

if __name__ == '__main__':
    main()
