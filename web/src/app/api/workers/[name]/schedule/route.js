import { listWorkerSchedule } from '@/lib/data/supabase';

export async function GET(request, { params }) {
  try {
    const { name } = await params;
    const workerName = decodeURIComponent(name);
    const schedule = await listWorkerSchedule(workerName);
    return Response.json(schedule);
  } catch (error) {
    console.error('listWorkerSchedule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}