import { redirect } from "next/navigation";

// The discharge form now opens as a dialog over the list; keep old links working.
export default function RecordDischargeRedirect() {
  redirect("/hospital/patients?new=1");
}
