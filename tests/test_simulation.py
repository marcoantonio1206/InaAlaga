"""Hand-calculated queue fixtures and independent model invariants."""
from dataclasses import replace, asdict
from pathlib import Path
import unittest
from simulation.model import (Case, Config, generate, load_pilot, receipt, simulate,
                              verify_run, digest)
ROOT = Path(__file__).resolve().parents[1]

class SimulationTests(unittest.TestCase):
    def setUp(self):
        self.config = Config(arrival_days=1, drain_days=1, shift_start=0, shift_end=120,
                             reference_delay_hours=(0, 0), fast_delay_hours=(0, 0))
    def case(self, name, due=200, discharge=0, travel=0, service=60, draw=.5, station='S'):
        return Case(name, '0201529047', station, discharge, due, travel, service, draw)
    def run_case(self, cases, policy='A', config=None):
        cfg = config or self.config; r = simulate(cases, cfg, policy, ['S']); verify_run(cases, r, cfg)
        return r
    def test_hand_queue_edf_vs_fifo(self):
        # FIFO: a completes 60, b 120 => 1/2 on time. EDF: b 60, a 120 => 2/2.
        cases = [self.case('a'), self.case('b', due=60)]
        a = self.run_case(cases); c = self.run_case(cases, 'C')
        self.assertEqual(a['metrics']['on_time_rate'], .5)
        self.assertEqual(c['metrics']['on_time_rate'], 1)
        self.assertEqual(c['outcomes'][1]['contact_completed_minute'], 60)
    def test_hand_overload_and_denominator(self):
        # Two 120-min shifts, three 120-min tasks; the third remains unserved.
        r = self.run_case([self.case(str(i), due=2000, service=120) for i in range(3)])
        self.assertEqual(r['metrics']['completed'], 2)
        self.assertEqual(r['metrics']['unserved'], 1)
        self.assertAlmostEqual(r['metrics']['on_time_rate'], 2/3)
        self.assertEqual(r['outcomes'][1]['departed_minute'], 1440)
    def test_no_workers(self):
        r = self.run_case([self.case('a')], config=replace(self.config, workers_per_station=0))
        self.assertEqual(r['metrics']['on_time_rate'], 0)
        self.assertEqual(r['metrics']['unserved_rate'], 1)
        self.assertIsNone(r['metrics']['utilization'])
    def test_abundant_workers_one_case_assigned_once(self):
        r = self.run_case([self.case('a')], config=replace(self.config, workers_per_station=10))
        self.assertEqual(r['metrics']['completed'], 1)
        self.assertEqual(r['metrics']['busy_minutes_all_tasks'], 60)
    def test_same_time_arrivals_visible_before_dispatch(self):
        r = self.run_case([self.case('z', due=10, service=10), self.case('a', due=200)], 'C')
        self.assertEqual(r['outcomes'][0]['departed_minute'], 0)
    def test_equal_deadline_equal_handoff_order_ties(self):
        cs = [self.case('b'), self.case('a')]
        self.assertEqual(self.run_case(cs)['outcomes'], self.run_case(cs, 'C')['outcomes'])
        self.assertEqual(self.run_case(cs)['outcomes'][1]['departed_minute'], 0)
    def test_shift_boundary_and_travel_included(self):
        c = self.case('a', discharge=80, due=2000, travel=10, service=30)
        r = self.run_case([c]); o = r['outcomes'][0]
        self.assertEqual(o['departed_minute'], 1440)
        self.assertEqual(o['contact_started_minute'], 1450)
        self.assertEqual(o['contact_completed_minute'], 1480)
        self.assertEqual(o['returned_minute'], 1490)
        self.assertEqual(r['metrics']['busy_minutes_all_tasks'], 50)
    def test_exact_shift_fit_allowed(self):
        r = self.run_case([self.case('a', discharge=70, travel=10, service=30)])
        self.assertEqual(r['outcomes'][0]['returned_minute'], 120)
    def test_handoff_after_horizon_stays_denominator(self):
        cfg = replace(self.config, reference_delay_hours=(100, 100))
        r = self.run_case([self.case('a')], config=cfg)
        self.assertEqual(r['metrics']['unserved'], 1)
    def test_delayed_handoff_never_started_early(self):
        cfg = replace(self.config, reference_delay_hours=(1, 1))
        r = self.run_case([self.case('a', service=10)], config=cfg)
        self.assertEqual(r['outcomes'][0]['departed_minute'], 60)
    def test_nonfitting_head_not_bypassed(self):
        cs = [self.case('a', discharge=100, due=2000, service=30),
              self.case('b', discharge=101, due=2000, service=5)]
        r = self.run_case(cs)
        self.assertEqual(r['outcomes'][0]['departed_minute'], 1440)
        self.assertEqual(r['outcomes'][1]['departed_minute'], 1470)
    def test_nonoverlap_two_workers(self):
        r = self.run_case([self.case(str(i), service=20) for i in range(10)],
                          config=replace(self.config, workers_per_station=2))
        self.assertEqual(r['metrics']['completed'], 10)
    def test_empty_cohort_not_false_zero_rate(self):
        r = self.run_case([])
        self.assertEqual(r['metrics']['introduced'], 0)
        self.assertIsNone(r['metrics']['on_time_rate'])
    def test_backlog_consumes_capacity_separate_denominator(self):
        old = replace(self.case('old', discharge=-10, due=100, service=120), is_backlog=True)
        new = self.case('new', due=2000, service=120)
        r = self.run_case([old, new])
        self.assertEqual(r['metrics']['introduced'], 1)
        self.assertEqual(r['backlog']['introduced'], 1)
        self.assertEqual(r['metrics']['busy_minutes_all_tasks'], 240)
    def test_stations_cannot_borrow_idle_workers(self):
        cfg = replace(self.config, drain_days=0)
        cases = [self.case('a', service=120), self.case('b', service=120)]
        r = simulate(cases, cfg, 'A', ['S', 'T']); verify_run(cases, r, cfg)
        self.assertEqual(r['metrics']['completed'], 1)
        self.assertEqual(r['stations']['T']['busy_minutes_all_tasks'], 0)
    def test_final_horizon_is_not_extra_shift(self):
        cfg = replace(self.config, drain_days=0, shift_start=1320, shift_end=1440)
        r = self.run_case([self.case('a', discharge=1320, due=1440, service=120),
                           self.case('b', discharge=1321, due=2000, service=120)], config=cfg)
        self.assertEqual(r['outcomes'][0]['contact_completed_minute'], 1440)
        self.assertIsNone(r['outcomes'][1]['contact_completed_minute'])
    def test_invalid_inputs_rejected(self):
        with self.assertRaises(ValueError): self.run_case([self.case('a'), self.case('a')])
        with self.assertRaises(ValueError): self.run_case([self.case('a', travel=-1)])
        with self.assertRaises(ValueError): self.run_case([self.case('a', station='other')])
        with self.assertRaises(ValueError): replace(self.config, shift_end=-1).validate()
    def test_generation_pairing_and_reproduction(self):
        pilot = load_pilot(ROOT); cfg = Config(); a = generate(cfg, 123, pilot)
        self.assertEqual(a, generate(cfg, 123, pilot))
        self.assertTrue(all(c.case_id.startswith('SYN-') and len(c.barangay_psgc)==10 for c in a))
        before = digest([asdict(c) for c in a])
        for policy in ['A','B','C','D']:
            r = simulate(a, cfg, policy, pilot['stations']); verify_run(a,r,cfg)
            self.assertEqual(before,digest([asdict(c) for c in a]))
        self.assertEqual([receipt(c,cfg,'B') for c in a], [receipt(c,cfg,'C') for c in a])
    def test_sensitivity_preserves_unaffected_draws(self):
        pilot=load_pilot(ROOT);cfg=Config();a=generate(cfg,99,pilot)
        b=generate(replace(cfg,backlog_days=1),99,pilot)
        self.assertEqual(a,[c for c in b if not c.is_backlog])
        c=generate(replace(cfg,service_minutes=60),99,pilot)
        self.assertEqual([replace(x,service_minutes=60) for x in a],c)
        d=generate(replace(cfg,travel_multiplier=2),99,pilot)
        self.assertEqual([replace(x,travel_minutes=x.travel_minutes*2) for x in a],d)

if __name__=='__main__': unittest.main()
