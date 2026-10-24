import { assignCase } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { worker_id } = await request.json();
    if (typeof worker_id !== 'string' || !worker_id.trim()) return Response.json({ error: 'Choose an available BHW.' }, { status: 400 });
    return Response.json(await assignCase(id, { worker_id }));
  } catch (error) {
    const status = error.message === 'Unknown case' ? 404 : error.message.includes('already assigned') ? 409 : error.message === 'Choose an available BHW.' || error instanceof SyntaxError ? 400 : 500;
    return Response.json({ error: error instanceof SyntaxError ? 'Invalid request.' : error.message }, { status });
  }
}
