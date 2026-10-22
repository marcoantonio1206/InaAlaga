"""Export a compact planning slice of the v1 results for the web coordinator view.
python3 -m simulation.export_planning
Reads simulation/results/v1/results.json; writes web/src/data/planning_v1.json.
No values are recomputed: means and replication ranges are copied as stored.
"""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'simulation/results/v1/results.json'
TARGET = ROOT / 'web/src/data/planning_v1.json'
POLICY_METRICS = ['on_time_rate', 'unserved_rate', 'utilization', 'start_within_48h_rate',
                  'median_nonnegative_lateness_minutes_completed']
COMPARISONS = ['B_minus_A', 'C_minus_B', 'C_minus_A', 'D_minus_A', 'C_minus_D']
VARIANTS = {
    'base': 'Base assumptions', 'service_15': 'Service 15 min', 'service_60': 'Service 60 min',
    'travel_half': 'Travel time ×0.5', 'travel_double': 'Travel time ×2',
    'reference_delay_6_24': 'Reference handoff 6–24 h', 'reference_delay_24_72': 'Reference handoff 24–72 h',
    'backlog_one_day': 'One day of starting backlog', 'uniform_due_48h': 'Every target 48 h',
    'combined_stress': 'Combined stress: 60-min service, travel ×2',
}
CONTROLS = {'control_zero_workers': 'Control: no workers (12 cases/day)',
            'control_abundant_workers': 'Control: 10 workers per station (12 cases/day)'}


def num(value):
    return None if value is None else round(value, 6)


def describe(sid):
    if sid in CONTROLS:
        return 'Stress and controls', CONTROLS[sid]
    _, demand, variant = sid.split('_', 2)
    group = 'Base' if variant == 'base' else (
        'Stress and controls' if variant == 'combined_stress' else 'One assumption changed')
    return group, f'{demand} cases/day · {VARIANTS[variant]}'


def build(results, replications):
    scenarios = []
    for s in results['scenarios']:
        group, label = describe(s['scenario_id'])
        policies = {}
        for p, metrics in s['policy_metrics'].items():
            policies[p] = {}
            for key in POLICY_METRICS:
                m = metrics[key]
                lo, hi = m['central_95_simulation_interval']
                policies[p][key] = {'mean': num(m['mean']), 'lo': num(lo), 'hi': num(hi)}
        comparisons = {}
        for key in COMPARISONS:
            d = s['paired_comparisons_percentage_points'][key]
            lo, hi = d['central_95_simulation_interval']
            comparisons[key] = {'mean': num(d['mean']), 'lo': num(lo), 'hi': num(hi),
                                'worse': num(d['fraction_negative']), 'tied': num(d['fraction_tied']),
                                'better': num(d['fraction_positive'])}
        scenarios.append({'id': s['scenario_id'], 'group': group, 'label': label,
                          'config': s['config'], 'config_sha256': s['config_sha256'],
                          'policies': policies, 'comparisons': comparisons})
    return {'schema_version': '1.0', 'source': 'simulation/results/v1/results.json',
            'model_version': results['model_version'],
            'experiment_design_sha256': results['experiment_design_sha256'],
            'replications_per_scenario': replications, 'kind': results['kind'],
            'interval_definition': results['interval_definition'],
            'primary_denominator': results['primary_denominator'],
            'limitations': results['limitations'],
            'regenerate': ['python3 -m simulation.run --suite full --replications 100',
                           'python3 -m simulation.export_planning'],
            'scenarios': scenarios}


def load():
    results = json.loads(SOURCE.read_text(encoding='utf-8'))
    design = json.loads((SOURCE.parent / 'experiment_design.json').read_text(encoding='utf-8'))
    return build(results, design['replications_per_scenario'])


if __name__ == '__main__':
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with TARGET.open('w', encoding='utf-8', newline='\n') as f:
        json.dump(load(), f, ensure_ascii=False, indent=1, allow_nan=False)
        f.write('\n')
    print(f'Wrote {TARGET.relative_to(ROOT)}')
