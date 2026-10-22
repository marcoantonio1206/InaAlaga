import { redirect } from "next/navigation";

// Case detail now opens as a panel over the Cases list; keep old links working.
export default async function BhwCaseRedirect({ params }) {
  const { caseId } = await params;
  redirect(`/bhw?case=${encodeURIComponent(caseId)}`);
}
