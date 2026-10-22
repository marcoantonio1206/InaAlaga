import { createClient } from '@supabase/supabase-js';
import { createSessionWithSeed } from '@/lib/data/supabase';
import { DEMO_MOTHER_TOKEN } from '@/lib/data/demoLink';

// -----------------------------------------------------------------------------
// Lazy Supabase client – only created when actually needed
// -----------------------------------------------------------------------------
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing Supabase credentials. Check .env.local');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// -----------------------------------------------------------------------------
// Seed data – matches mock.js
// -----------------------------------------------------------------------------
const CLEAN_SEED = [
  {
    id: 'IA-0042',
    alias: 'Maria Santos',
    barangay: 'Caritan Norte',
    birth_at: '2026-10-18T09:40:00+08:00',
    discharge_at: '2026-10-19T11:15:00+08:00',
    due_at: '2026-10-20T10:00:00+08:00',
  },
  {
    id: 'IA-0043',
    alias: 'Rosa Dela Cruz',
    barangay: 'Libag Sur',
    birth_at: '2026-10-18T14:00:00+08:00',
    discharge_at: '2026-10-19T10:30:00+08:00',
    due_at: '2026-10-20T13:00:00+08:00',
  },
  {
    id: 'IA-0044',
    alias: 'Grace Villanueva',
    barangay: 'Atulayan Norte',
    birth_at: '2026-10-19T02:00:00+08:00',
    discharge_at: '2026-10-19T09:00:00+08:00',
    due_at: '2026-10-22T06:00:00+08:00',
  },
  {
    id: 'IA-0045',
    alias: 'Liza Mercado',
    barangay: 'Linao West',
    birth_at: '2026-10-17T08:00:00+08:00',
    discharge_at: '2026-10-18T09:00:00+08:00',
    due_at: '2026-10-19T09:00:00+08:00',
  },
  {
    id: 'IA-0046',
    alias: 'Angelica Bautista',
    barangay: 'Pallua Sur',
    birth_at: '2026-10-18T20:00:00+08:00',
    discharge_at: '2026-10-19T10:00:00+08:00',
    due_at: '2026-10-21T07:30:00+08:00',
  },
  {
    id: 'IA-0047',
    alias: 'Carmela Tolentino',
    barangay: 'Outside demo area',
    birth_at: '2026-10-18T11:00:00+08:00',
    discharge_at: '2026-10-19T10:45:00+08:00',
    due_at: '2026-10-21T09:00:00+08:00',
  },
];

const BARANGAY_STATION = {
  'Caritan Norte': 'tanza',
  'Libag Sur': 'tanza',
  'Linao West': 'linao',
  'Atulayan Norte': 'linao',
  'Pallua Sur': 'linao',
  'Outside demo area': null,
};

const DEMO_NOW = '2026-10-19T12:00:00+08:00';

// -----------------------------------------------------------------------------
// Helper: parse JSON without throwing on empty body
// -----------------------------------------------------------------------------
async function safeJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return {};
  }
}

// -----------------------------------------------------------------------------
// POST /api/sessions/seed
// -----------------------------------------------------------------------------
export async function POST(request) {
  try {
    const body = await safeJson(request);
    const profile = (body.profile ?? 'clean').toString().toLowerCase();

    if (!['clean', 'populated'].includes(profile)) {
      return new Response(JSON.stringify({ error: 'Profile must be "clean" or "populated"' }), {
        status: 400,
      });
    }

    const session = await createSessionWithSeed(profile);
    const sessionId = session.id;

    const supabase = getSupabase();

    for (const c of CLEAN_SEED) {
      const stationId = BARANGAY_STATION[c.barangay] || null;
      const handoffState = stationId ? 'pending' : 'unassigned';
      const assignedAt = stationId ? DEMO_NOW : null;
      const motherToken = c.id === 'IA-0042' ? DEMO_MOTHER_TOKEN : crypto.randomUUID();

      const { error: caseError } = await supabase
        .from('cases')
        .insert({
          id: c.id,
          session_id: sessionId,
          alias: c.alias,
          barangay: c.barangay,
          station_id: stationId,
          handoff_state: handoffState,
          request_state: 'none',
          birth_at: c.birth_at,
          discharge_at: c.discharge_at,
          due_at: c.due_at,
          recorded_at: DEMO_NOW,
          assigned_at: assignedAt,
          mother_token: motherToken,
        });

      if (caseError) {
        console.error(`Failed to insert case ${c.id}`, caseError);
        throw caseError;
      }

      await supabase
        .from('events')
        .insert({
          case_id: c.id,
          at: DEMO_NOW,
          type: 'case_created',
          actor: 'System',
          detail: { method: 'seed', profile },
        });
    }

    return new Response(
      JSON.stringify({ session_id: sessionId, demo_clock: DEMO_NOW, case_count: CLEAN_SEED.length }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Seed session error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
