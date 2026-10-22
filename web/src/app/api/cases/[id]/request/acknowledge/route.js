import { acknowledgeRequest } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();

    const { worker_name } = body;
    if (!worker_name) {
      return Response.json({ error: 'worker_name is required' }, { status: 400 });
    }

    const caseData = await acknowledgeRequest(caseId, { worker_name });
    return Response.json(caseData);
  } catch (error) {
    console.error('acknowledgeRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}