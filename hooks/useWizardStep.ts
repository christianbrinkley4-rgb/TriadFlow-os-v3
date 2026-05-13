"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STEP_QUERY = "step";

export function useWizardStep(totalSteps: number, defaultStep = 1) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const step = useMemo(() => {
    const raw = searchParams.get(STEP_QUERY);
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    if (!Number.isFinite(parsed)) return defaultStep;
    return Math.min(totalSteps, Math.max(1, parsed));
  }, [searchParams, totalSteps, defaultStep]);

  const setStep = useCallback(
    (next: number) => {
      const clamped = Math.min(totalSteps, Math.max(1, Math.round(next)));
      const params = new URLSearchParams(searchParams.toString());
      params.set(STEP_QUERY, String(clamped));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams, totalSteps],
  );

  return { step, setStep, stepQueryKey: STEP_QUERY };
}
