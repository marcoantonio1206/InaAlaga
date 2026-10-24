import { arrangeOverdue } from '@/lib/data/supabase';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { worker_name } = await request.json();
    if (typeof worker_name !== 'string' || !worker_name.trim()) return Response.json({ error: 'Choose a BHW.' }, { status: 400 });
    return Response.json(await arrangeOverdue(id, { worker_name }));
  } catch (error) {
    const status = error.message === 'Unknown case' ? 404 : error.message.includes('responsible BHW') ? 403 : error instanceof SyntaxError ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
}
