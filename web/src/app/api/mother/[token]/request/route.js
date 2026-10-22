import { createContactRequest } from '@/lib/data/supabase';

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const caseData = await createContactRequest(token);
    return Response.json(caseData);
  } catch (error) {
    console.error('createContactRequest error:', error);
    const status = error.message === 'Unknown link' ? 404 : 500;
    return Response.json({ error: error.message }, { status });
  }
}
