"use client";

import MotherHeader from "@/components/MotherHeader";
import StationCard from "@/components/StationCard";
import DemoNotice from "@/components/DemoNotice";
import { useCase } from "@/lib/caseContext";

export default function StationPage() {
  const { data } = useCase();
  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="flex flex-col gap-3 p-4">
        <StationCard stationName={data.station_name} />
      </div>
      <DemoNotice />
    </main>
  );
}