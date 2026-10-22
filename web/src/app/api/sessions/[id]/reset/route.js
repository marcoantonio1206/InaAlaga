import { createClient } from '@supabase/supabase-js';
import { resetSession } from '@/lib/data/supabase';

// Lazy Supabase client for API routes
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(request, { params }) {
  try {
    const { id: sessionId } = await params;
    const supabase = getSupabase();

    // Delete all cases for this session (cascades to visits, requests, attempts, events)
    await supabase.from('cases').delete().eq('session_id', sessionId);

    // Note: In a full implementation, you'd re-seed the original data here
    // For now, just return success - the client can re-seed

    return Response.json({ success: true, session_id: sessionId });
  } catch (error) {
    console.error('reset session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}