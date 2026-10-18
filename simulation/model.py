"""Seeded synthetic inputs and a terminating, station-based discrete-event model.
All clocks are minutes from a synthetic Day 1 midnight (Asia/Manila wall-clock).
No patient records, clinical attributes, microdata, or live service inputs.
"""
from dataclasses import dataclass
from pathlib import Path
import collections
import csv
import hashlib
import heapq
import json
import math
import random

VERSION = '1.0.0'
POLICIES = {'A': ('reference', 'fifo'), 'B': ('fast', 'fifo'),
            'C': ('fast', 'edf'), 'D': ('reference', 'edf')}

@dataclass(frozen=True)
class Config:
    demand_per_day: float = 8
    arrival_days: int = 14
    drain_days: int = 7
    workers_per_station: int = 1
    shift_start: float = 540
    shift_end: float = 780
    service_minutes: float = 30
    travel_multiplier: float = 1
    reference_delay_hours: tuple = (12, 48)
    fast_delay_hours: tuple = (0, 6)
    due_windows_hours: tuple = (24, 48, 72)
    backlog_days: int = 0

    def validate(self):
        nums = [self.demand_per_day, self.shift_start, self.shift_end,
                self.service_minutes, self.travel_multiplier,
                *self.reference_delay_hours, *self.fast_delay_hours, *self.due_windows_hours]
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in nums):
            raise ValueError('Parameters must be finite numbers')
        for v in [self.arrival_days, self.drain_days, self.workers_per_station, self.backlog_days]:
            if not isinstance(v, int) or isinstance(v, bool) or v < 0:
                raise ValueError('Days/workers must be nonnegative integers')
        if self.arrival_days < 1 or self.demand_per_day < 0:
            raise ValueError('Need at least one arrival day and nonnegative demand')
        if not 0 <= self.shift_start < self.shift_end <= 1440:
            raise ValueError('Require 0 <= shift start < shift end <= 1440')
        if self.service_minutes <= 0 or self.travel_multiplier < 0:
            raise ValueError('Positive service and nonnegative travel required')
        for interval in [self.reference_delay_hours, self.fast_delay_hours]:
            if len(interval) != 2 or not 0 <= interval[0] <= interval[1]:
                raise ValueError('Invalid handoff-delay interval')
        if not self.due_windows_hours or min(self.due_windows_hours) <= 0:
            raise ValueError('Positive due windows required')

    @property
    def horizon(self):
        return (self.arrival_days + self.drain_days) * 1440

@dataclass(frozen=True)
class Case:
    case_id: str
    barangay_psgc: str
    station_id: str
    discharge_minute: float
    due_minute: float
    travel_minutes: float
    service_minutes: float
    handoff_uniform: float
    is_backlog: bool = False


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'),
                                     allow_nan=False).encode()).hexdigest()


def stream(seed, label):
    # Separate streams keep geography/deadline/delay draws paired when another factor varies.
    return random.Random(int(hashlib.sha256(f'{seed}:{label}'.encode()).hexdigest(), 16))


def load_pilot(root):
    root = Path(root)
    base = root / 'data/geography/pilot_v2'
    def read_csv(path):
        with path.open(newline='') as f:
            return list(csv.DictReader(f))
    barangays = read_csv(base / 'barangays.csv')
    stations = read_csv(base / 'stations.csv')
    matrix = read_csv(base / 'travel_matrix.csv')
    allocation = json.loads((root / 'data/simulation/demand_allocation.json').read_text())
    if len(barangays) != 5 or len(stations) != 2:
        raise ValueError('This release expects five barangays and two stations')
    b_ids = {r['psgc'] for r in barangays}; s_ids = {r['station_id'] for r in stations}
    if len(b_ids) != 5 or len(s_ids) != 2:
        raise ValueError('Duplicate pilot identities')
    if any(len(b) != 10 or not b.startswith('0') for b in b_ids):
        raise ValueError('PSGC codes must retain leading zeros')
    if {r['psgc'] for r in allocation['main_allocation']['barangays']} != b_ids:
        raise ValueError('Demand and geography versions disagree')
    if allocation['main_allocation']['method'] != 'uniform_categorical' or not math.isclose(
            allocation['main_allocation']['probability_per_barangay'] * len(b_ids), 1):
        raise ValueError('Uniform allocation contract mismatch')
    pairs = {(r['origin_psgc'], r['station_id']) for r in matrix}
    if len(matrix) != 10 or len(pairs) != 10 or pairs != {(b, s) for b in b_ids for s in s_ids}:
        raise ValueError('Incomplete or duplicate travel matrix')
    assigned = {}
    for b in barangays:
        rs = [r for r in matrix if r['origin_psgc'] == b['psgc'] and r['assigned_station'] == 'True']
        if len(rs) != 1 or rs[0]['station_id'] != b['nearest_station_id']:
            raise ValueError('Assignment lookup mismatch')
        r = rs[0]; travel = float(r['one_way_minutes'])
        if not math.isfinite(travel) or travel < 0:
            raise ValueError('Invalid travel duration')
        assigned[b['psgc']] = {'station_id': r['station_id'], 'travel_minutes': travel,
                              'selection_role': b['selection_role'], 'name': b['name']}
    sources = [base / n for n in ['barangays.csv', 'stations.csv', 'travel_matrix.csv', 'assumptions.json']]
    sources.append(root / 'data/simulation/demand_allocation.json')
    return {'assigned': assigned, 'stations': sorted(s_ids),
            'input_sha256': {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
                             for p in sources}}


def poisson(rng, mean):
    # Exact Knuth sampler; experiment means are <=12 cases/day.
    if not 0 <= mean <= 100:
        raise ValueError('Poisson sampler supports means from 0 to 100')
    limit = math.exp(-mean); product = 1.0; count = 0
    while product > limit:
        product *= rng.random(); count += 1
    return max(0, count - 1)


def generate(config, seed, pilot):
    config.validate()
    counts, times, geography, deadlines, delays = [stream(seed, n) for n in
        ['counts', 'times', 'geography', 'deadlines', 'delays']]
    # Backlog draws are separate: adding a backlog cannot redraw new cohort demand.
    backlog_streams = [stream(seed, 'backlog-' + n) for n in
        ['counts', 'times', 'geography', 'deadlines', 'delays']]
    codes = sorted(pilot['assigned']); cases = []
    for backlog, days, rngs in [(False, range(config.arrival_days),
                                 [counts, times, geography, deadlines, delays]),
                                (True, range(-config.backlog_days, 0), backlog_streams)]:
        cr, tr, gr, dr, hr = rngs
        for day in days:
            for _ in range(poisson(cr, config.demand_per_day)):
                discharge = day * 1440 + tr.random() * 1440
                code = codes[min(int(gr.random() * len(codes)), len(codes) - 1)]
                due_h = config.due_windows_hours[min(int(dr.random() * len(config.due_windows_hours)),
                                                     len(config.due_windows_hours) - 1)]
                a = pilot['assigned'][code]
                cases.append(Case(f'SYN-{seed}-{"BACK" if backlog else "NEW"}-{len(cases)+1:05d}',
                    code, a['station_id'], discharge, discharge + due_h * 60,
                    a['travel_minutes'] * config.travel_multiplier, config.service_minutes,
                    hr.random(), backlog))
    return sorted(cases, key=lambda c: (c.discharge_minute, c.case_id))


def receipt(case, config, policy):
    if case.is_backlog:
        return 0.0  # Existing acknowledged stock at opening, identical across policies.
    lo, hi = config.reference_delay_hours if POLICIES[policy][0] == 'reference' else config.fast_delay_hours
    return case.discharge_minute + 60 * (lo + case.handoff_uniform * (hi - lo))


def quantile(values, q):
    if not values:
        return None
    v = sorted(values); pos = (len(v) - 1) * q; lo = int(pos); hi = math.ceil(pos)
    return v[lo] + (v[hi] - v[lo]) * (pos - lo)


def summarize_cases(cases, outcomes):
    completed = [c for c in cases if outcomes[c.case_id]['contact_completed_minute'] is not None]
    n = len(cases)
    def rate(count): return count / n if n else None
    on_time = sum(outcomes[c.case_id]['contact_completed_minute'] <= c.due_minute + 1e-9 for c in completed)
    start48 = sum(outcomes[c.case_id]['contact_started_minute'] <= c.discharge_minute + 2880 + 1e-9 for c in completed)
    complete72 = sum(outcomes[c.case_id]['contact_completed_minute'] <= c.discharge_minute + 4320 + 1e-9 for c in completed)
    late = [max(0.0, outcomes[c.case_id]['contact_completed_minute'] - c.due_minute) for c in completed]
    return {'introduced': n, 'completed': len(completed), 'on_time': on_time,
            'unserved': n - len(completed), 'on_time_rate': rate(on_time),
            'start_within_48h_rate': rate(start48), 'complete_within_72h_rate': rate(complete72),
            'unserved_rate': rate(n - len(completed)),
            'median_nonnegative_lateness_minutes_completed': quantile(late, .5),
            'p90_nonnegative_lateness_minutes_completed': quantile(late, .9)}


def simulate(cases, config, policy, station_ids):
    config.validate()
    if policy not in POLICIES:
        raise ValueError('Unknown policy')
    if len({c.case_id for c in cases}) != len(cases):
        raise ValueError('Duplicate case IDs')
    if len(set(station_ids)) != len(station_ids):
        raise ValueError('Duplicate stations')
    for c in cases:
        vals = [c.discharge_minute, c.due_minute, c.travel_minutes, c.service_minutes, c.handoff_uniform]
        if not all(math.isfinite(v) for v in vals) or c.station_id not in station_ids:
            raise ValueError('Invalid case or unknown station')
        if c.due_minute < c.discharge_minute or c.travel_minutes < 0 or c.service_minutes <= 0 or not 0 <= c.handoff_uniform < 1:
            raise ValueError('Invalid case timing/draw')
        if (not c.is_backlog and not 0 <= c.discharge_minute < config.arrival_days * 1440) or (c.is_backlog and c.discharge_minute >= 0):
            raise ValueError('Case outside introduction window')
    outcomes = {c.case_id: {'case_id': c.case_id, 'received_minute': receipt(c, config, policy),
        'worker_id': None, 'departed_minute': None, 'contact_started_minute': None,
        'contact_completed_minute': None, 'returned_minute': None} for c in cases}
    available = {s: [] for s in station_ids}
    workers = {s: {f'{s}-W{i+1}': 0.0 for i in range(config.workers_per_station)} for s in station_ids}
    busy = {s: 0.0 for s in station_ids}; events = []; serial = 0
    def push(t, kind, obj):
        nonlocal serial
        if t <= config.horizon:
            heapq.heappush(events, (t, serial, kind, obj)); serial += 1
    for c in cases: push(outcomes[c.case_id]['received_minute'], 'receipt', c)
    for day in range(config.arrival_days + config.drain_days):
        push(day * 1440 + config.shift_start, 'shift', None)
    while events:
        t = events[0][0]
        # All same-time receipts/returns are visible before dispatching any worker.
        while events and events[0][0] == t:
            _, _, kind, obj = heapq.heappop(events)
            if kind == 'receipt': available[obj.station_id].append(obj)
        if t >= config.horizon:
            continue
        day = math.floor(t / 1440); start = day * 1440 + config.shift_start
        end = min(day * 1440 + config.shift_end, config.horizon)
        if not start <= t < end:
            continue
        for s in sorted(station_ids):
            queue = available[s]
            if POLICIES[policy][1] == 'edf':
                queue.sort(key=lambda c: (c.due_minute, outcomes[c.case_id]['received_minute'], c.case_id))
            else:
                queue.sort(key=lambda c: (outcomes[c.case_id]['received_minute'], c.case_id))
            for worker in sorted(workers[s]):
                if workers[s][worker] > t or not queue:
                    continue
                c = queue[0]; duration = 2 * c.travel_minutes + c.service_minutes
                # Preserve queue order: no bypass of the head if its complete trip cannot fit.
                if t + duration > end + 1e-9:
                    break
                queue.pop(0); contact_start = t + c.travel_minutes
                complete = contact_start + c.service_minutes; returned = t + duration
                outcomes[c.case_id].update(worker_id=worker, departed_minute=t,
                    contact_started_minute=contact_start, contact_completed_minute=complete,
                    returned_minute=returned)
                workers[s][worker] = returned; busy[s] += duration
                push(returned, 'return', None)
    cohort = [c for c in cases if not c.is_backlog]
    metrics = summarize_cases(cohort, outcomes)
    capacity_per_station = (config.arrival_days + config.drain_days) * (config.shift_end - config.shift_start) * config.workers_per_station
    metrics['busy_minutes_all_tasks'] = sum(busy.values())
    metrics['available_worker_minutes'] = capacity_per_station * len(station_ids)
    metrics['utilization'] = sum(busy.values()) / metrics['available_worker_minutes'] if metrics['available_worker_minutes'] else None
    by_station = {}
    for s in station_ids:
        by_station[s] = summarize_cases([c for c in cohort if c.station_id == s], outcomes)
        by_station[s].update(busy_minutes_all_tasks=busy[s], available_worker_minutes=capacity_per_station,
                             utilization=busy[s] / capacity_per_station if capacity_per_station else None)
    return {'policy': policy, 'metrics': metrics, 'stations': by_station,
            'backlog': summarize_cases([c for c in cases if c.is_backlog], outcomes),
            'outcomes': [outcomes[c.case_id] for c in cases]}


def verify_run(cases, result, config):
    """Independent timeline/resource invariants, also used on every experiment run."""
    lookup = {c.case_id: c for c in cases}; intervals = collections.defaultdict(list)
    assert len(result['outcomes']) == len(lookup)
    assert len({o['case_id'] for o in result['outcomes']}) == len(lookup)
    for o in result['outcomes']:
        c = lookup[o['case_id']]
        assert o['received_minute'] == receipt(c, config, result['policy'])
        if o['departed_minute'] is None:
            assert all(o[k] is None for k in ['worker_id', 'contact_started_minute', 'contact_completed_minute', 'returned_minute'])
            continue
        depart, returned = o['departed_minute'], o['returned_minute']
        assert depart >= max(0, o['received_minute']) - 1e-8
        day = math.floor(depart / 1440)
        assert day * 1440 + config.shift_start <= depart
        assert returned <= min(day * 1440 + config.shift_end, config.horizon) + 1e-8
        assert math.isclose(o['contact_started_minute'], depart + c.travel_minutes)
        assert math.isclose(o['contact_completed_minute'], depart + c.travel_minutes + c.service_minutes)
        assert math.isclose(returned, depart + 2 * c.travel_minutes + c.service_minutes)
        assert o['worker_id'].startswith(c.station_id + '-W')
        intervals[o['worker_id']].append((depart, returned))
    for spans in intervals.values():
        spans.sort()
        assert all(a[1] <= b[0] + 1e-8 for a, b in zip(spans, spans[1:]))
    m = result['metrics']
    assert m['introduced'] == len([c for c in cases if not c.is_backlog])
    assert m['completed'] + m['unserved'] == m['introduced']
    assert m['on_time'] <= m['completed']
    if m['utilization'] is not None: assert 0 <= m['utilization'] <= 1 + 1e-9
