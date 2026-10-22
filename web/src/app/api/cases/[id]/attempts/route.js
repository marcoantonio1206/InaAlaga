import { recordContactAttempt } from '@/lib/data/supabase';

export async function POST(request, { params }) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();

    const { method, started_at, ended_at, outcome, worker_name } = body;
    if (!method || !started_at || !ended_at || !outcome || !worker_name) {
      return Response.json({ error: 'method, started_at, ended_at, outcome, worker_name are required' }, { status: 400 });
    }

    const caseData = await recordContactAttempt(caseId, { method, started_at, ended_at, outcome, worker_name });
    return Response.json(caseData);
  } catch (error) {
    console.error('recordContactAttempt error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}