import { getSimulatedMessage } from '@/lib/data/supabase';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const message = await getSimulatedMessage(token);

    if (!message) {
      return Response.json({ error: 'Unknown link' }, { status: 404 });
    }

    return Response.json(message);
  } catch (error) {
    console.error('getSimulatedMessage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
