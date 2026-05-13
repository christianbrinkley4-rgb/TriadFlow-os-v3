import type { Metadata } from "next";
import { Suspense } from "react";

import { MedicareWizard } from "./MedicareWizard";

export const metadata: Metadata = {
  title: "Free Triad Coverage Quote — life, health, and Medicare",
  description:
    "Three quick questions to get a free quote from Will Chappell, a licensed local life and health agent in the Piedmont Triad.",
};

function MedicareFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-paper px-4 font-body text-lg font-semibold text-navy">
      Loading questionnaire…
    </div>
  );
}

export default function MedicarePage() {
  return (
    <Suspense fallback={<MedicareFallback />}>
      <MedicareWizard />
    </Suspense>
  );
}
