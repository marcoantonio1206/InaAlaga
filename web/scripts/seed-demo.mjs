/**
 * Demo Data Seed Script for InaAlaga
 *
 * Usage:
 *   node scripts/seed-demo.js clean      # Seed with clean profile (6 mothers)
 *   node scripts/seed-demo.js populated  # Seed with populated profile (20 mothers)
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Frozen demo clock
const DEMO_CLOCK = '2026-10-19T04:00:00Z';

// Maria's demo link token; keep in sync with src/lib/data/demoLink.js
const DEMO_MOTHER_TOKEN = '6d51a7c2-0042-4e8b-9f3a-2c7d5e1b8a40';

// Station and worker IDs (matching demoGeography.js)
const STATIONS = {
  tanza: 'Tanza BHS (demo station)',
  linao: 'Linao West BHS (demo station)'
};

const WORKERS = {
  ana: { name: 'Demo worker Ana', station_id: 'tanza' },
  carlo: { name: 'Demo worker Carlo', station_id: 'tanza' },
  bea: { name: 'Demo worker Bea', station_id: 'linao' },
  dina: { name: 'Demo worker Dina', station_id: 'linao' }
};

// Barangay to station mapping
const BARANGAY_STATION = {
  'Caritan Norte': 'tanza',
  'Libag Sur': 'tanza',
  'Linao West': 'linao',
  'Atulayan Norte': 'linao',
  'Pallua Sur': 'linao',
  'Outside demo area': null
};

// Clean seed profile (6 mothers)
const CLEAN_SEED = [
  {
    id: 'IA-0042',
    alias: 'Maria Santos',
    barangay: 'Caritan Norte',
    birth_at: '2026-10-18T09:40:00+08:00',
    discharge_at: '2026-10-19T11:15:00+08:00',
    due_at: '2026-10-20T10:00:00+08:00'
  },
  {
    id: 'IA-0043',
    alias: 'Rosa Dela Cruz',
    barangay: 'Libag Sur',
    birth_at: '2026-10-18T14:00:00+08:00',
    discharge_at: '2026-10-19T10:30:00+08:00',
    due_at: '2026-10-20T13:00:00+08:00'
  },
  {
    id: 'IA-0044',
    alias: 'Grace Villanueva',
    barangay: 'Atulayan Norte',
    birth_at: '2026-10-19T02:00:00+08:00',
    discharge_at: '2026-10-19T09:00:00+08:00',
    due_at: '2026-10-22T06:00:00+08:00'
  },
  {
    id: 'IA-0045',
    alias: 'Liza Mercado',
    barangay: 'Linao West',
    birth_at: '2026-10-17T08:00:00+08:00',
    discharge_at: '2026-10-18T09:00:00+08:00',
    due_at: '2026-10-19T09:00:00+08:00'
  },
  {
    id: 'IA-0046',
    alias: 'Angelica Bautista',
    barangay: 'Pallua Sur',
    birth_at: '2026-10-18T20:00:00+08:00',
    discharge_at: '2026-10-19T10:00:00+08:00',
    due_at: '2026-10-21T07:30:00+08:00'
  },
  {
    id: 'IA-0047',
    alias: 'Carmela Tolentino',
    barangay: 'Outside demo area',
    birth_at: '2026-10-18T11:00:00+08:00',
    discharge_at: '2026-10-19T10:45:00+08:00',
    due_at: '2026-10-21T09:00:00+08:00'
  }
];

// Populated seed profile (20 mothers) - abbreviated for script
// Full data would come from seed_populated_v1.json
const POPULATED_SEED = [
  ...CLEAN_SEED,
  // Additional 14 mothers (IA-0048 through IA-0061)
  // These would be loaded from the JSON file in production
];

async function seedStationsAndWorkers() {
  console.log('🌱 Seeding stations...');
  for (const [id, name] of Object.entries(STATIONS)) {
    const { error } = await supabase
      .from('stations')
      .upsert({ id, name }, { onConflict: 'id' });
    if (error) throw error;
  }

  console.log('🌱 Seeding workers...');
  for (const [id, worker] of Object.entries(WORKERS)) {
    const { error } = await supabase
      .from('workers')
      .upsert({ id, ...worker }, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function createSession(profile) {
  console.log(`📦 Creating ${profile} session...`);
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      profile,
      demo_clock_at: DEMO_CLOCK
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`✅ Session created: ${session.id}`);
  return session;
}

async function seedCases(sessionId, cases) {
  console.log(`🌱 Seeding ${cases.length} cases...`);

  for (const c of cases) {
    const stationId = BARANGAY_STATION[c.barangay] || null;
    const handoffState = stationId ? 'pending' : 'unassigned';
    const assignedAt = stationId ? DEMO_CLOCK : null;

    // Generate mother token for mother view access
    const motherToken = c.id === 'IA-0042' ? DEMO_MOTHER_TOKEN : crypto.randomUUID();

    const { error: caseError } = await supabase
      .from('cases')
      .insert({
        id: c.id,
        session_id: sessionId,
        alias: c.alias,
        barangay: c.barangay,
        barangay_psgc: stationId ? '0201529000' : null, // placeholder PSGC
        station_id: stationId,
        handoff_state: handoffState,
        request_state: 'none',
        owner_worker_id: null,
        acknowledged_at: null,
        birth_at: c.birth_at,
        discharge_at: c.discharge_at,
        due_at: c.due_at,
        recorded_at: DEMO_CLOCK,
        assigned_at: assignedAt,
        mother_token: motherToken
      });

    if (caseError) {
      console.error(`❌ Failed to insert case ${c.id}:`, caseError.message);
      throw caseError;
    }

    // Add initial event
    await supabase.from('events').insert({
      case_id: c.id,
      at: DEMO_CLOCK,
      type: 'case_created',
      actor: 'System',
      detail: { method: 'seed', profile: 'clean' }
    });
  }

  console.log(`✅ ${cases.length} cases seeded`);
}

async function main() {
  const profile = process.argv[2] || 'clean';

  if (!['clean', 'populated'].includes(profile)) {
    console.error('Usage: node scripts/seed-demo.js [clean|populated]');
    process.exit(1);
  }

  const cases = profile === 'clean' ? CLEAN_SEED : POPULATED_SEED;

  try {
    console.log(`🚀 Starting ${profile} seed...`);

    // Seed reference data
    await seedStationsAndWorkers();

    // Create session
    const session = await createSession(profile);

    // Seed cases
    await seedCases(session.id, cases);

    console.log('✅ Seed complete!');
    console.log(`\nDemo clock: ${DEMO_CLOCK}`);
    console.log(`Session ID: ${session.id}`);
    console.log('\nMother tokens (for testing mother view):');

    // Print mother tokens for testing
    const { data: seededCases } = await supabase
      .from('cases')
      .select('id, alias, mother_token')
      .eq('session_id', session.id);

    seededCases?.forEach(c => {
      console.log(`  ${c.id} (${c.alias}): ${c.mother_token}`);
    });

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

main();