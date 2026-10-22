"""The web planning slice must match the stored v1 results it was exported from."""
from pathlib import Path
import json
import unittest
from simulation.export_planning import TARGET, load
ROOT = Path(__file__).resolve().parents[1]


class PlanningExportTests(unittest.TestCase):
    def test_committed_slice_is_current(self):
        committed = json.loads(TARGET.read_text(encoding='utf-8'))
        self.assertEqual(committed, load(), 'Rerun: python3 -m simulation.export_planning')

    def test_every_scenario_and_null_preserved(self):
        data = load()
        source = json.loads((ROOT / 'simulation/results/v1/results.json').read_text(encoding='utf-8'))
        self.assertEqual([s['id'] for s in data['scenarios']], [s['scenario_id'] for s in source['scenarios']])
        zero = next(s for s in data['scenarios'] if s['id'] == 'control_zero_workers')
        self.assertIsNone(zero['policies']['A']['utilization']['mean'])
        self.assertTrue(all(s['label'] and s['group'] for s in data['scenarios']))


if __name__ == '__main__':
    unittest.main()
