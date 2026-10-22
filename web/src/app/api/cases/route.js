import { createDischarge, listCases } from '@/lib/data/supabase';

export async function GET() {
  try {
    const cases = await listCases();
    return Response.json(cases);
  } catch (error) {
    console.error('listCases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // The dialog validates its form fields client-side (validateDischarge);
    // createDischarge re-checks the ISO fields it receives here.
    // Session is optional: without one, the latest seeded session is used.
    const sessionId = request.headers.get('x-demo-session-id');

    const result = await createDischarge({
      ...body,
      session_id: sessionId || undefined
    });

    return Response.json(result);
  } catch (error) {
    console.error('createDischarge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
