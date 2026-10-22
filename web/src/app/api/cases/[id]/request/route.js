import { createContactRequest } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const token = request.headers.get('x-demo-mother-token');
    if (!token) {
      return Response.json({ error: 'Mother token required' }, { status: 401 });
    }

    const caseData = await createContactRequest(token);
    return Response.json(caseData);
  } catch (error) {
    console.error('createContactRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}