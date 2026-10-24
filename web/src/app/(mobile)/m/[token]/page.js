"use client";

import MotherHeader from "@/components/MotherHeader";
import MotherFollowUp from "@/components/MotherFollowUp";
import RequestPanel from "@/components/RequestPanel";
import { useCase } from "@/lib/caseContext";
import { getStatus, getCardVisit } from "@/lib/status";

export default function HomePage() {
  const { data, now, requestContact } = useCase();
  const status = getStatus(data, now);
  const visit = getCardVisit(data, status);

  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="flex flex-col gap-3 p-4">
        <MotherFollowUp caseData={data} visit={visit} status={status} />
        <RequestPanel requestState={data.request_state} onRequest={requestContact} />
      </div>
    </main>
  );
}
