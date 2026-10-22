import { recordVisitOutcome } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const { id: visitId } = await params;
    const body = await request.json();

    const { case_id, started_at, ended_at, outcome } = body;
    if (!case_id || !started_at || !ended_at || !outcome) {
      return Response.json({ error: 'case_id, started_at, ended_at, outcome are required' }, { status: 400 });
    }

    const caseData = await recordVisitOutcome(case_id, visitId, { started_at, ended_at, outcome });
    return Response.json(caseData);
  } catch (error) {
    console.error('recordVisitOutcome error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}