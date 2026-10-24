import { listAssignableWorkers } from '@/lib/data/supabase';

export async function GET() {
  try {
    return Response.json(await listAssignableWorkers());
  } catch {
    return Response.json({ error: "Couldn't load the BHW list." }, { status: 500 });
  }
}
