import { redirect } from "next/navigation";

export default function HospitalIndex() {
  redirect("/hospital/patients");
}