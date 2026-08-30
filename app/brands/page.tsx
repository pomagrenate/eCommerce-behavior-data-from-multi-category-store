import { getBrandMetrics, getBrandJourneyMetrics } from "@/lib/data";
import BrandsClient from "./BrandsClient";

export default function BrandsPage() {
  const brands = getBrandMetrics();
  const brandJourney = getBrandJourneyMetrics();

  return (
    <div className="p-6 md:p-8 max-w-screen-xl">
      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Brand Intelligence & Market Research</p>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Brand Performance & Purchase Journey</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Compare traffic, conversion rates, and purchase journey funnel behavior across major brands (Apple, Samsung, Xiaomi...).
        </p>
      </div>
      <BrandsClient brands={brands} brandJourney={brandJourney} />
    </div>
  );
}

