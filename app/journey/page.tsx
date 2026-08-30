import { getJourneyMetrics } from "@/lib/data";
import JourneyClient from "./JourneyClient";

export default function JourneyPage() {
  const journey = getJourneyMetrics();
  return (
    <div className="p-6 md:p-8 max-w-screen-xl">
      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Behavioral Analysis</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Customer Journey</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Event transition patterns, session types, and common purchase/abandonment paths.
          Sequences show the first 5 events per session.
        </p>
      </div>
      <JourneyClient journey={journey} />
    </div>
  );
}
