import { getCaseById } from '@/lib/data/supabase';

export async function GET(request, { params }) {
  try {
    const { id: caseId } = await params;
    const caseData = await getCaseById(caseId);

    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    return Response.json(caseData);
  } catch (error) {
    console.error('getCaseById error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}