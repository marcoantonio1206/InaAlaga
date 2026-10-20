"use client";

import MotherHeader from "@/components/MotherHeader";
import StatusCard from "@/components/StatusCard";
import VisitCard from "@/components/VisitCard";
import WhyFollowUp from "@/components/WhyFollowUp";
import StationCard from "@/components/StationCard";
import RequestPanel from "@/components/RequestPanel";
import DemoNotice from "@/components/DemoNotice";
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
        <StatusCard status={status} />
        {visit ? <VisitCard visit={visit} /> : null}
        <WhyFollowUp />
        <StationCard stationName={data.station_name} />
        <RequestPanel requestState={data.request_state} onRequest={requestContact} />
      </div>
      <DemoNotice />
    </main>
  );
}