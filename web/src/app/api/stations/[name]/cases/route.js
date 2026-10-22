import { listStationCases } from '@/lib/data/supabase';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { name: stationNameRaw } = await params;
    const stationName = decodeURIComponent(stationNameRaw);
    const cases = await listStationCases(stationName);
    return Response.json(cases);
  } catch (error) {
    console.error('listStationCases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}