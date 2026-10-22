import BhwShell from "@/components/bhw/BhwShell";
import { WorkerProvider } from "@/lib/bhwWorkers";

export const metadata = {
  title: "InaAlaga · BHW workspace",
  description: "Fictional demonstration only",
};

export default function BhwLayout({ children }) {
  return (
    <WorkerProvider>
      <BhwShell>{children}</BhwShell>
    </WorkerProvider>
  );
}
