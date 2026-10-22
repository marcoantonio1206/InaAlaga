import { getMotherLink } from '@/lib/data/supabase';

export async function GET(request, { params }) {
  try {
    const { id: caseId } = await params;
    const link = await getMotherLink(caseId);
    return Response.json(link);
  } catch (error) {
    console.error('getMotherLink error:', error);
    const status = error.message === 'Unknown case' ? 404 : 500;
    return Response.json({ error: error.message }, { status });
  }
}
