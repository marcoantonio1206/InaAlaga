from dataclasses import asdict
from itertools import product
from pathlib import Path
import unittest
from simulation.factorial import AXES,experiment_plan
from simulation.model import digest,generate,load_pilot

class FactorialDesignTests(unittest.TestCase):
    def test_complete_cross_product(self):
        p=experiment_plan();self.assertEqual(len(p),162)
        got={(c.demand_per_day,c.workers_per_station,c.service_minutes,c.travel_multiplier,c.reference_delay_hours) for _,c in p}
        self.assertEqual(got,set(product(*AXES.values())))
        self.assertEqual(len({sid for sid,_ in p}),162)
        for _,c in p:
            self.assertEqual(c.fast_delay_hours,(0,6));self.assertEqual(c.backlog_days,0)
            self.assertEqual(c.due_windows_hours,(24,48,72))
    def test_cases_identical_across_capacity_and_reference_delay(self):
        pilot=load_pilot(Path(__file__).resolve().parents[1]);hashes=[]
        for _,c in experiment_plan():
            if c.demand_per_day==8 and c.service_minutes==30 and c.travel_multiplier==1:
                hashes.append(digest([asdict(x) for x in generate(c,20261018,pilot)]))
        self.assertEqual(len(hashes),6);self.assertEqual(len(set(hashes)),1)
