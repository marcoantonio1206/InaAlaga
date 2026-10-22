import { redirect } from "next/navigation";

// The profile now opens as a panel over the list; keep old links working.
export default async function PatientProfileRedirect({ params }) {
  const { caseId } = await params;
  redirect(`/hospital/patients?case=${encodeURIComponent(caseId)}`);
}
