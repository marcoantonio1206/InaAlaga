import { getCaseByToken } from '@/lib/data/supabase';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const caseData = await getCaseByToken(token);

    if (!caseData) {
      return Response.json({ error: 'Unknown link' }, { status: 404 });
    }

    return Response.json(caseData);
  } catch (error) {
    console.error('getCaseByToken error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
