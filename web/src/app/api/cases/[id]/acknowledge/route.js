import { acknowledgeCase } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();

    const { worker_name } = body;
    if (!worker_name) {
      return Response.json({ error: 'worker_name is required' }, { status: 400 });
    }

    const caseData = await acknowledgeCase(caseId, { worker_name });
    return Response.json(caseData);
  } catch (error) {
    console.error('acknowledgeCase error:', error);
    const status = error.message === 'Owner conflict' || error.message === 'This case is assigned to another BHW.' ? 409
      : error.message === 'This worker belongs to another station.' ? 403
      : error.message === 'Unknown case' ? 404 : 500;
    return Response.json({ error: error.message }, { status });
  }
}