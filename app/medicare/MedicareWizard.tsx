"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useWizardStep } from "@/hooks/useWizardStep";
import { submitLead } from "@/lib/lead";
import { trackFunnelStep, trackLead } from "@/lib/analytics";

const TOTAL_STEPS = 3;
const STORAGE_KEY = "triad-coverage-quote";
const CALENDLY_URL =
  "https://calendly.com/wchappell37/retirement-consultation";

export type CoverageQuoteAnswers = {
  coverageType: string;
  ageBand: string;
  fullName: string;
  email: string;
  phone: string;
  zip: string;
  submittedAt?: string;
};

const emptyState: CoverageQuoteAnswers = {
  coverageType: "",
  ageBand: "",
  fullName: "",
  email: "",
  phone: "",
  zip: "",
};

type Option = { value: string; label: string };

function OptionGrid({
  name,
  options,
  value,
  onChange,
  labelledBy,
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  labelledBy: string;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {options.map((opt, index) => {
        const id = `${name}-opt-${index}`;
        const selected = value === opt.value;
        return (
          <div key={opt.value}>
            <input
              type="radio"
              id={id}
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className={`flex min-h-[60px] cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-center text-lg font-semibold leading-snug transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                selected
                  ? "border-gold bg-gold-soft/60 text-navy shadow-[inset_0_0_0_1px_#c5a059]"
                  : "border-navy/15 bg-white/90 text-navy hover:border-gold/40"
              } `}
            >
              {opt.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

type WizardChoiceKey = "coverageType" | "ageBand";

function fieldForStep(step: number): WizardChoiceKey | null {
  switch (step) {
    case 1:
      return "coverageType";
    case 2:
      return "ageBand";
    default:
      return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\D+/g;
const ZIP_RE = /^\d{5}(?:-\d{4})?$/;

export function MedicareWizard() {
  const searchParams = useSearchParams();
  const { step, setStep } = useWizardStep(TOTAL_STEPS, 1);
  const { value: answers, setStored: setAnswers, hydrated } =
    useLocalStorage<CoverageQuoteAnswers>(STORAGE_KEY, emptyState);

  const [stepError, setStepError] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("step") == null) {
      setStep(1);
    }
  }, [searchParams, setStep]);

  useEffect(() => {
    setStepError(null);
    trackFunnelStep(step, `step_${step}`);
  }, [step]);

  const patch = useCallback(
    (partial: Partial<CoverageQuoteAnswers>) => {
      setAnswers((prev) => ({ ...prev, ...partial }));
    },
    [setAnswers],
  );

  const pick = useCallback(
    (key: WizardChoiceKey, value: string) => {
      setStepError(null);
      patch({ [key]: value });
    },
    [patch],
  );

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const isComplete = Boolean(answers.submittedAt);

  const validateStep = useCallback(
    (s: number): boolean => {
      if (s === TOTAL_STEPS) {
        const nameOk = answers.fullName.trim().length > 1;
        const emailOk = EMAIL_RE.test(answers.email.trim());
        const phoneDigits = answers.phone.replace(PHONE_DIGITS_RE, "");
        const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 11;
        const zipOk = ZIP_RE.test(answers.zip.trim());
        if (!nameOk) {
          setStepError("Please add your full name so Will knows who to call.");
          return false;
        }
        if (!emailOk) {
          setStepError("Please enter a valid email address.");
          return false;
        }
        if (!phoneOk) {
          setStepError("Please enter a 10-digit phone number.");
          return false;
        }
        if (!zipOk) {
          setStepError(
            "Please enter your 5-digit ZIP so we can match North Carolina carriers.",
          );
          return false;
        }
        setStepError(null);
        return true;
      }
      const key = fieldForStep(s);
      if (!key) return true;
      const v = answers[key];
      if (typeof v !== "string" || v.length === 0) {
        setStepError("Please choose an option to continue.");
        return false;
      }
      setStepError(null);
      return true;
    },
    [answers],
  );

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(step + 1);
  };

  const goBack = () => {
    setStepError(null);
    setStep(step - 1);
  };

  const onSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(TOTAL_STEPS)) return;
    if (submitting) return;
    setSubmitting(true);
    const result = await submitLead({
      fullName: answers.fullName.trim(),
      email: answers.email.trim(),
      phone: answers.phone.trim(),
      zip: answers.zip.trim(),
      coverageType: answers.coverageType,
      ageBand: answers.ageBand,
    });
    setSubmitting(false);
    if (!result.ok) {
      setStepError(
        "We couldn't send your request just now. Please try again, or book a time below.",
      );
      return;
    }
    trackLead(0, "USD");
    setAnswers((prev) => ({
      ...prev,
      submittedAt: new Date().toISOString(),
    }));
  };

  const resetFlow = () => {
    setAnswers({ ...emptyState });
    setStep(1);
    setStepError(null);
  };

  const coverageOptions = useMemo<Option[]>(
    () => [
      { value: "Life — family protection", label: "Life insurance for my family" },
      { value: "Health — under 65", label: "Health / medical (under 65)" },
      { value: "Medicare 65+", label: "Medicare supplement (65 or older)" },
      { value: "Not sure", label: "Not sure — help me choose" },
    ],
    [],
  );

  const ageOptions = useMemo<Option[]>(
    () => [
      { value: "Under 40", label: "Under 40" },
      { value: "40–54", label: "40 to 54" },
      { value: "55–64", label: "55 to 64" },
      { value: "65+", label: "65 or older" },
    ],
    [],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4 text-navy">
        <p className="text-lg font-semibold text-navy/80">Loading…</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-16 pt-10">
        <div className="rounded-2xl border border-navy/10 bg-white/90 p-8 shadow-md shadow-navy/10">
          <div
            className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-emerald-700 text-4xl text-white"
            role="img"
            aria-label="Success"
          >
            ✓
          </div>
          <h1 className="font-display text-center text-3xl font-normal text-navy">
            You&apos;re on Will&apos;s list
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink)]">
            Thanks, {answers.fullName.trim().split(/\s+/)[0]}. Will Chappell, a
            local licensed agent in the Piedmont Triad, will reach out within
            one business day with quotes that fit your situation — no obligation
            and no mailing-list spam.
          </p>
          <p className="mt-3 text-base text-navy/70">
            Want to lock in a time now? Pick a 15-minute slot below.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-[60px] items-center justify-center rounded-lg bg-gold px-6 text-lg font-bold text-navy transition-all hover:bg-gold-soft"
          >
            Book a free 15-minute call (optional)
          </a>
          <button
            type="button"
            onClick={resetFlow}
            className="mt-4 w-full min-h-[60px] rounded-lg border-2 border-navy/20 bg-paper px-6 text-lg font-semibold text-navy transition-colors hover:border-navy/40"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-20 pt-8 text-[var(--color-ink)]">
      <div className="mx-auto max-w-xl px-4">
        <header className="mb-8 flex items-start gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-gold bg-navy text-center text-xl font-bold text-paper">
            {!photoFailed ? (
              <Image
                src="/will.webp"
                alt="Will Chappell — licensed insurance agent, Piedmont Triad"
                fill
                sizes="80px"
                className="object-cover"
                priority
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span aria-hidden="true">WC</span>
            )}
          </div>
          <div>
            <p className="text-lg font-bold leading-snug text-navy">
              Will Chappell — licensed life &amp; health agent, Piedmont Triad
            </p>
            <p className="mt-1 text-lg text-navy/80">
              Three quick questions. One screen at a time. No spam — just quotes
              tailored to you.
            </p>
          </div>
        </header>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-lg font-semibold text-navy">
            <span>Free Triad Coverage Quote</span>
            <span className="tabular-nums text-navy/70">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-navy/10"
            role="progressbar"
            aria-label="Question progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
          >
            <div
              className="h-full rounded-full bg-gold transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white/90 p-6 shadow-lg shadow-navy/5 sm:p-8">
          <form
            onSubmit={
              step === TOTAL_STEPS ? onSubmitFinal : (e) => e.preventDefault()
            }
          >
            <div
              key={step}
              className="animate-step-enter transition-all duration-300"
            >
              {step === 1 && (
                <>
                  <h2
                    id="s1-title"
                    className="font-display text-2xl font-normal text-navy sm:text-3xl"
                  >
                    What kind of coverage are you looking for?
                  </h2>
                  <p className="mt-2 text-lg opacity-90">
                    Pick the closest fit — Will handles all of these every week.
                  </p>
                  <div className="mt-6">
                    <OptionGrid
                      name="coverageType"
                      options={coverageOptions}
                      value={answers.coverageType}
                      onChange={(v) => pick("coverageType", v)}
                      labelledBy="s1-title"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2
                    id="s2-title"
                    className="font-display text-2xl font-normal text-navy sm:text-3xl"
                  >
                    Which age group fits you?
                  </h2>
                  <p className="mt-2 text-lg opacity-90">
                    Your age band drives which carriers and rates apply.
                  </p>
                  <div className="mt-6">
                    <OptionGrid
                      name="ageBand"
                      options={ageOptions}
                      value={answers.ageBand}
                      onChange={(v) => pick("ageBand", v)}
                      labelledBy="s2-title"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2
                    id="s3-title"
                    className="font-display text-2xl font-normal text-navy sm:text-3xl"
                  >
                    Where should Will send your quote?
                  </h2>
                  <p className="mt-2 text-lg opacity-90">
                    Last step. He&apos;ll reach out within one business day —
                    your info is never sold.
                  </p>
                  <div className="mt-6 space-y-4 text-left">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        Full name
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        value={answers.fullName}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ fullName: e.target.value });
                        }}
                        className="w-full rounded-lg border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy outline-none transition-colors focus:border-gold min-h-[60px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={answers.email}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ email: e.target.value });
                        }}
                        className="w-full rounded-lg border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy outline-none transition-colors focus:border-gold min-h-[60px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="(336) 555-0123"
                        value={answers.phone}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ phone: e.target.value });
                        }}
                        className="w-full rounded-lg border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy outline-none transition-colors focus:border-gold min-h-[60px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="zip"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        ZIP code
                      </label>
                      <input
                        id="zip"
                        name="zip"
                        type="text"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        placeholder="27401"
                        value={answers.zip}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ zip: e.target.value });
                        }}
                        className="w-full rounded-lg border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy outline-none transition-colors focus:border-gold min-h-[60px]"
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-left text-base italic text-navy/75">
                    By submitting, you agree Will Chappell may contact you by
                    phone, text, or email about insurance options. Standard
                    rates apply. We don&apos;t sell your information.
                  </p>
                </>
              )}
            </div>

            {stepError ? (
              <p
                className="mt-4 text-left text-lg font-semibold text-amber-900"
                role="alert"
              >
                {stepError}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-[60px] flex-1 items-center justify-center rounded-lg bg-navy px-6 text-lg font-bold text-paper transition-all hover:bg-navy/90"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[60px] flex-1 items-center justify-center rounded-lg bg-navy px-6 text-lg font-bold text-paper transition-all hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Sending…" : "Get my free quote"}
                </button>
              )}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex min-h-[60px] flex-1 items-center justify-center rounded-lg border-2 border-navy/20 bg-transparent px-6 text-lg font-semibold text-navy transition-colors hover:border-navy/40"
                >
                  Back
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
