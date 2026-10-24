import { normalizeVisitLocation } from "@/lib/visitLocation";
import { scheduleVisit } from '@/lib/data/supabase';

export async function POST(request, { params }) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();

    const { scheduled_for, worker_name } = body;
    if (!scheduled_for || !worker_name) {
      return Response.json({ error: 'scheduled_for and worker_name are required' }, { status: 400 });
    }

    let location;
    try {
      location = normalizeVisitLocation(body);
      if (!Number.isFinite(Date.parse(scheduled_for))) throw new Error("Enter a valid visit date and time.");
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    const caseData = await scheduleVisit(caseId, { scheduled_for, worker_name, ...location });
    return Response.json(caseData);
  } catch (error) {
    console.error('scheduleVisit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}