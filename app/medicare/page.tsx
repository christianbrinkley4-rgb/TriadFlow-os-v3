import type { Metadata } from "next";
import { Suspense } from "react";

import { MedicareWizard } from "./MedicareWizard";

export const metadata: Metadata = {
  title: "Free Triad Coverage Quote — life, health, and Medicare",
  description:
    "Three quick questions to get clear answers from Will Chappell, an independent financial advisor based in Greensboro, NC. Trusted by 200+ households.",
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
