// Server-only: uses the service-role key, which Next.js never ships to the
// browser. Route handlers under app/api import this module; client code goes
// through ./api.js (selected by lib/data/index.js).
import { createClient } from '@supabase/supabase-js';
import { formatDot } from '@/lib/format';
import { DEMO_MOTHER_TOKEN, LINK_DAYS } from './demoLink';

// Lazy Supabase client - only created when actually needed
let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials. Check .env.local');
  }

  _supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  return _supabase;
}

// Frozen demo clock (same as mock)
export const DEMO_NOW = '2026-10-19T12:00:00+08:00';

export function getDemoNow() {
  return DEMO_NOW;
}

export function getDemoMotherToken() {
  return DEMO_MOTHER_TOKEN;
}

// Helper to append audit events
async function appendEvent(caseId, type, actor, detail = null) {
  const supabase = getSupabase();
  await supabase.from('events').insert({
    case_id: caseId,
    at: DEMO_NOW,
    type,
    actor,
    detail
  });
}

// DB worker names are "Demo worker Ana"; the UI acts as "Ana".
function workerDisplayName(name) {
  return name ? name.replace(/^Demo worker /, '') : null;
}

async function findWorkerId(workerName) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('workers')
    .select('id, name')
    .or(`id.eq."${workerName.toLowerCase()}",name.eq."${workerName}"`)
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

// DB enum names differ from the event types the UI labels.
const EVENT_TYPE = { case_accepted: 'accepted' };

// UI method labels <-> contact_attempts.method CHECK ('phone', 'sms', 'visit')
const ATTEMPT_METHOD = { 'Phone call': 'phone', SMS: 'sms' };
const ATTEMPT_LABEL = { phone: 'Phone call', sms: 'SMS' };

const byTime = (key) => (a, b) => new Date(a[key]) - new Date(b[key]);

function mapEvent(e) {
  return {
    at: e.at,
    type: EVENT_TYPE[e.type] || e.type,
    actor: e.actor,
    detail: typeof e.detail === 'string' ? e.detail : null
  };
}

// Helper to convert DB case to mock-compatible shape
function mapCase(dbCase) {
  const request = [...(dbCase.contact_requests || [])].sort(byTime('recorded_at')).at(-1);
  return {
    id: dbCase.id,
    alias: dbCase.alias,
    barangay: dbCase.barangay,
    station_name: dbCase.station_name || dbCase.stations?.name || null,
    handoff_state: dbCase.handoff_state,
    request_state: dbCase.request_state,
    owner_worker: dbCase.owner_worker_id ? workerDisplayName(dbCase.workers?.name) : null,
    acknowledged_at: dbCase.acknowledged_at,
    birth_at: dbCase.birth_at,
    discharge_at: dbCase.discharge_at,
    due_at: dbCase.due_at,
    recorded_at: dbCase.recorded_at,
    assigned_at: dbCase.assigned_at,
    // Request timestamps live in contact_requests; mock.js keeps them on the case.
    request_recorded_at: request?.recorded_at ?? null,
    request_acknowledged_by: request?.acknowledged_by ?? null,
    request_acknowledged_at: request?.acknowledged_at ?? null,
    visits: [...(dbCase.visits || [])].sort(byTime('scheduled_at')),
    contact_attempts: (dbCase.contact_attempts || [])
      .map((a) => ({ ...a, method: ATTEMPT_LABEL[a.method] || a.method }))
      .sort(byTime('recorded_at')),
    // EventHistory already renders "Discharge recorded" from recorded_at,
    // so the seed's case_created event would duplicate it.
    events: (dbCase.events || [])
      .filter((e) => e.type !== 'case_created')
      .map(mapEvent)
      .sort(byTime('at'))
  };
}

// Mother access: the link token is the case's random mother_token (UUID), never
// the case id (PRD M01). The schema has no expiry column, so a link expires
// LINK_DAYS after the discharge was recorded, as mock links do.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function linkExpiry(dbCase) {
  return new Date(new Date(dbCase.recorded_at).getTime() + LINK_DAYS * 86400000).toISOString();
}

function isLive(dbCase) {
  return new Date(linkExpiry(dbCase)) > new Date(DEMO_NOW);
}

// Case row for a token, live or expired; null for anything unknown.
async function caseRowForToken(token, columns) {
  if (typeof token !== 'string' || !UUID_RE.test(token)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cases')
    .select(columns)
    .eq('mother_token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// Unknown and expired tokens resolve to nothing, so they reveal no case details.
export async function getCaseByToken(token) {
  const data = await caseRowForToken(token, `
      *,
      stations(name),
      workers!owner_worker_id(name),
      visits(*),
      contact_attempts(*),
      contact_requests(*),
      events(*)
    `);
  if (!data || !isLive(data)) return null;
  return mapCase(data);
}

// What the simulated SMS shows. The message exists even when its link has
// expired; opening an expired link is what fails.
export async function getSimulatedMessage(token) {
  const data = await caseRowForToken(token, 'alias, recorded_at');
  return data ? { alias: data.alias, expires_at: linkExpiry(data) } : null;
}

export async function getMotherLink(caseId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cases')
    .select('mother_token, recorded_at')
    .ilike('id', caseId)
    .maybeSingle();
  if (error || !data) throw new Error('Unknown case');
  if (!data.mother_token || !isLive(data)) return null;
  return { token: data.mother_token, expires_at: linkExpiry(data) };
}

export async function createContactRequest(token) {
  const supabase = getSupabase();
  const existingCase = await caseRowForToken(token, 'id, request_state, recorded_at');
  if (!existingCase || !isLive(existingCase)) throw new Error('Unknown link');
  if (existingCase.request_state !== 'none') {
    return getCaseByToken(token);
  }

  const { error: updateError } = await supabase
    .from('cases')
    .update({
      request_state: 'recorded',
      updated_at: DEMO_NOW
    })
    .eq('id', existingCase.id);

  if (updateError) throw updateError;

  await supabase.from('contact_requests').insert({
    case_id: existingCase.id,
    state: 'recorded',
    recorded_at: DEMO_NOW
  });

  await appendEvent(existingCase.id, 'request_recorded', 'Mother', 'Please contact me');

  return getCaseByToken(token);
}

export async function listCases() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      stations(name),
      workers!owner_worker_id(name),
      visits(*),
      contact_attempts(*),
      contact_requests(*),
      events(*)
    `)
    .like('id', 'IA-%')
    .order('id');

  if (error) throw error;
  return (data || []).map(mapCase);
}

export async function getCaseById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      stations(name),
      workers!owner_worker_id(name),
      visits(*),
      contact_attempts(*),
      contact_requests(*),
      events(*)
    `)
    .ilike('id', id)
    .like('id', 'IA-%')
    .single();

  if (error || !data) return null;
  return mapCase(data);
}

// The cases table has no idempotency_key column, so retries are deduplicated
// in server memory, like mock.js does in the browser.
const submittedDischarges = new Map();

async function latestSessionId() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('cases')
    .select('session_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return data.session_id;
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return session?.id || null;
}

export async function createDischarge(input) {
  const supabase = getSupabase();
  if (input.idempotency_key && submittedDischarges.has(input.idempotency_key)) {
    const existingId = submittedDischarges.get(input.idempotency_key);
    const existing = await getCaseById(existingId);
    if (existing) return { case: existing, duplicate: true, link: await getMotherLink(existingId) };
  }

  // Validation (mirroring mock.js)
  if (!input.alias || !input.barangay || !input.birth_at || !input.discharge_at || !input.due_at) {
    throw new Error('Missing fields');
  }
  if (new Date(input.discharge_at) < new Date(input.birth_at)) throw new Error('Discharge before birth');
  if (new Date(input.due_at) < new Date(input.discharge_at)) throw new Error('Target before discharge');

  // Determine station from barangay
  const barangayStationMap = {
    'Caritan Norte': 'tanza',
    'Libag Sur': 'tanza',
    'Linao West': 'linao',
    'Atulayan Norte': 'linao',
    'Pallua Sur': 'linao'
  };
  let stationId = barangayStationMap[input.barangay] || null;
  if (!stationId && input.station_name) {
    const { data: stationData } = await supabase
      .from('stations')
      .select('id')
      .eq('name', input.station_name)
      .maybeSingle();
    stationId = stationData?.id || null;
  }

  const handoffState = stationId ? 'pending' : 'unassigned';

  // Generate ID
  const { data: countData } = await supabase
    .from('cases')
    .select('id', { count: 'exact' })
    .like('id', 'IA-%');

  const count = countData?.length || 0;
  const id = `IA-${String(42 + count).padStart(4, '0')}`;

  const sessionId = input.session_id || (await latestSessionId());
  if (!sessionId) throw new Error('No demo session. Seed one with POST /api/sessions/seed');

  const motherToken = crypto.randomUUID();

  const { error } = await supabase
    .from('cases')
    .insert({
      id,
      session_id: sessionId,
      alias: input.alias,
      barangay: input.barangay,
      station_id: stationId,
      handoff_state: handoffState,
      request_state: 'none',
      birth_at: input.birth_at,
      discharge_at: input.discharge_at,
      due_at: input.due_at,
      recorded_at: DEMO_NOW,
      assigned_at: stationId ? DEMO_NOW : null,
      mother_token: motherToken
    });

  if (error) throw error;

  await appendEvent(id, 'case_created', 'System', { method: 'discharge_form' });

  if (input.idempotency_key) submittedDischarges.set(input.idempotency_key, id);
  // Saving the discharge is the mother's registration: it issues her private link.
  return { case: await getCaseById(id), duplicate: false, link: await getMotherLink(id) };
}

export async function listStationCases(stationName) {
  const supabase = getSupabase();
  // Map station name to ID
  const stationMap = {
    'Tanza BHS (demo station)': 'tanza',
    'Linao West BHS (demo station)': 'linao'
  };
  const stationId = stationMap[stationName];

  if (!stationId) return [];

  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      stations!inner(name),
      workers!owner_worker_id(name),
      visits(*),
      contact_attempts(*),
      contact_requests(*),
      events(*)
    `)
    .eq('station_id', stationId)
    .like('id', 'IA-%')
    .order('due_at', { ascending: true })
    .order('recorded_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapCase);
}

export async function listWorkerSchedule(workerName) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      cases!inner(
        *,
        stations(name),
        workers!owner_worker_id(name),
        visits(*),
        contact_attempts(*),
        contact_requests(*),
        events(*)
      )
    `)
    .eq('worker_name', workerName)
    .eq('state', 'scheduled')
    .order('scheduled_for', { ascending: true });

  if (error) throw error;

  return (data || []).map(v => ({
    case: mapCase(v.cases),
    visit: {
      id: v.id,
      state: v.state,
      scheduled_for: v.scheduled_for,
      location_type: v.location_type,
      worker_name: v.worker_name,
      scheduled_at: v.scheduled_at
    }
  }));
}

export async function acknowledgeCase(caseId, { worker_name }) {
  const supabase = getSupabase();
  const workerId = await findWorkerId(worker_name);
  if (!workerId) throw new Error('Unknown worker');

  const { data: existingCase, error: fetchError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (fetchError || !existingCase) throw new Error('Unknown case');
  if (existingCase.handoff_state === 'unassigned') throw new Error('No station assigned');
  if (existingCase.handoff_state === 'acknowledged') {
    if (existingCase.owner_worker_id !== workerId) throw new Error('Owner conflict');
    return getCaseById(caseId);
  }

  const { error: updateError } = await supabase
    .from('cases')
    .update({
      handoff_state: 'acknowledged',
      owner_worker_id: workerId,
      acknowledged_at: DEMO_NOW,
      updated_at: DEMO_NOW
    })
    .eq('id', caseId);

  if (updateError) throw updateError;

  await appendEvent(caseId, 'case_accepted', worker_name, 'Accepted responsibility');

  return getCaseById(caseId);
}

export async function scheduleVisit(caseId, { scheduled_for, worker_name }) {
  const supabase = getSupabase();
  const { data: existingCase, error: fetchError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (fetchError || !existingCase) throw new Error('Unknown case');
  if (existingCase.handoff_state !== 'acknowledged') throw new Error('Case not accepted');
  if (new Date(scheduled_for) < new Date(existingCase.discharge_at)) throw new Error('Before discharge');

  const { data: existingVisit } = await supabase
    .from('visits')
    .select('id')
    .eq('case_id', caseId)
    .eq('state', 'scheduled')
    .limit(1)
    .maybeSingle();

  if (existingVisit) throw new Error('Visit already scheduled');

  const { data: countData } = await supabase
    .from('visits')
    .select('id', { count: 'exact' })
    .eq('case_id', caseId);

  // visits.id is the table's primary key, so it must be unique across cases.
  const visitId = `${caseId}-v${(countData?.length || 0) + 1}`;

  const { error: insertError } = await supabase
    .from('visits')
    .insert({
      id: visitId,
      case_id: caseId,
      state: 'scheduled',
      scheduled_for,
      location_type: 'home',
      worker_name,
      scheduled_at: DEMO_NOW
    });

  if (insertError) throw insertError;

  await appendEvent(caseId, 'visit_scheduled', worker_name, `Home follow-up · ${formatDot(scheduled_for)}`);

  return getCaseById(caseId);
}

export async function recordVisitOutcome(caseId, visitId, { started_at, ended_at, outcome }) {
  const supabase = getSupabase();
  if (outcome !== 'completed') throw new Error('Unsupported outcome');

  const { data: visit, error: fetchError } = await supabase
    .from('visits')
    .select('*, cases!inner(discharge_at)')
    .eq('id', visitId)
    .eq('case_id', caseId)
    .single();

  if (fetchError || !visit) throw new Error('No open visit');
  if (visit.state !== 'scheduled') throw new Error('No open visit');
  if (new Date(started_at) < new Date(visit.cases.discharge_at)) throw new Error('Before discharge');
  if (new Date(ended_at) < new Date(started_at)) throw new Error('Ended before started');

  const { error: updateError } = await supabase
    .from('visits')
    .update({
      state: 'completed',
      started_at,
      ended_at,
      outcome,
      completed_recorded_at: DEMO_NOW,
      updated_at: DEMO_NOW
    })
    .eq('id', visitId);

  if (updateError) throw updateError;

  await appendEvent(caseId, 'visit_completed', visit.worker_name, 'Completed home visit outcome saved');

  return getCaseById(caseId);
}

export async function acknowledgeRequest(caseId, { worker_name }) {
  const supabase = getSupabase();
  const { data: existingCase, error: fetchError } = await supabase
    .from('cases')
    .select('request_state')
    .eq('id', caseId)
    .single();

  if (fetchError || !existingCase) throw new Error('Unknown case');
  if (existingCase.request_state !== 'recorded') throw new Error('No open request');

  const { error: updateError } = await supabase
    .from('cases')
    .update({
      request_state: 'acknowledged',
      updated_at: DEMO_NOW
    })
    .eq('id', caseId);

  if (updateError) throw updateError;

  await supabase
    .from('contact_requests')
    .update({
      state: 'acknowledged',
      acknowledged_by: worker_name,
      acknowledged_at: DEMO_NOW,
      updated_at: DEMO_NOW
    })
    .eq('case_id', caseId);

  await appendEvent(caseId, 'request_acknowledged', worker_name, 'Contact request acknowledged');

  return getCaseById(caseId);
}

export async function recordContactAttempt(caseId, { method, started_at, ended_at, outcome, worker_name }) {
  const supabase = getSupabase();
  if (!['not_reached', 'reached'].includes(outcome)) throw new Error('Unsupported outcome');
  if (new Date(ended_at) < new Date(started_at)) throw new Error('Ended before started');

  const dbMethod = ATTEMPT_METHOD[method];
  if (!dbMethod) throw new Error(`Unsupported contact method: ${method}`);

  const { error: insertError } = await supabase.from('contact_attempts').insert({
    case_id: caseId,
    method: dbMethod,
    started_at,
    ended_at,
    outcome,
    worker_name,
    recorded_at: DEMO_NOW
  });

  if (insertError) throw insertError;

  await appendEvent(
    caseId,
    'contact_attempt',
    worker_name,
    outcome === 'reached' ? `Reached by ${method}` : `Not reached (${method})`
  );

  return getCaseById(caseId);
}

export async function resetDemoData() {
  // This is a no-op for Supabase - each session is isolated
  // The API route handles session reset
  return { success: true };
}

// Session management functions
export async function createSessionWithSeed(profile) {
  const supabase = getSupabase();
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ profile, demo_clock_at: DEMO_NOW })
    .select()
    .single();

  if (error) throw error;
  return session;
}

export async function resetSession(sessionId) {
  const supabase = getSupabase();
  // Delete all cases for this session (cascades to visits, requests, attempts, events)
  await supabase.from('cases').delete().eq('session_id', sessionId);

  // Re-seed would be done by calling createDischarge for each seed case
  return { success: true };
}