"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useWizardStep } from "@/hooks/useWizardStep";
import { submitLead } from "@/lib/lead";
import { trackFunnelStep, trackLead } from "@/lib/analytics";
import { Reviews } from "@/components/Reviews";
import { WhatToExpect } from "@/components/WhatToExpect";

const TOTAL_STEPS = 3;
// v2: schema changed (firstName/lastName, no zip, new coverage values)
const STORAGE_KEY = "triad-coverage-quote-v2";
const CALENDLY_URL =
  "https://calendly.com/wchappell37/retirement-consultation";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type CoverageQuoteAnswers = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverageType: string;
  ageBand: string;
  submittedAt?: string;
};

const emptyState: CoverageQuoteAnswers = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  coverageType: "",
  ageBand: "",
};

type Option = { value: string; label: string; sublabel?: string };

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
              className={`flex h-full min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 px-4 py-3 text-center leading-snug transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                selected
                  ? "border-gold bg-gold-soft/60 text-navy shadow-[inset_0_0_0_1px_#c5a059]"
                  : "border-navy/15 bg-white/90 text-navy hover:border-gold/40"
              } `}
            >
              <span className="text-lg font-semibold">{opt.label}</span>
              {opt.sublabel ? (
                <span className="mt-1 text-sm font-normal text-navy/70">
                  {opt.sublabel}
                </span>
              ) : null}
            </label>
          </div>
        );
      })}
    </div>
  );
}

type WizardChoiceKey = "coverageType" | "ageBand";

function choiceFieldForStep(step: number): WizardChoiceKey | null {
  switch (step) {
    case 2:
      return "coverageType";
    case 3:
      return "ageBand";
    default:
      return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\D+/g;

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
      if (s === 1) {
        const firstOk = answers.firstName.trim().length > 0;
        const lastOk = answers.lastName.trim().length > 0;
        const emailOk = EMAIL_RE.test(answers.email.trim());
        const phoneDigits = answers.phone.replace(PHONE_DIGITS_RE, "");
        const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 11;
        if (!firstOk) {
          setStepError("Please add your first name so Will knows who to call.");
          return false;
        }
        if (!lastOk) {
          setStepError("Please add your last name.");
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
        setStepError(null);
        return true;
      }
      const key = choiceFieldForStep(s);
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
      firstName: answers.firstName.trim(),
      lastName: answers.lastName.trim(),
      email: answers.email.trim(),
      phone: answers.phone.trim(),
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
      { value: "medicare-health", label: "Medicare & Health Coverage" },
      { value: "life", label: "Life Insurance" },
      { value: "retirement", label: "Financial Planning & Retirement" },
      {
        value: "not-sure",
        label: "Not sure yet",
        sublabel: "We'll help you figure it out.",
      },
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
            Thanks, {answers.firstName.trim() || "friend"}. Will Chappell,
            an independent financial advisor based in Greensboro, NC, will
            reach out within one business day with options that fit your
            situation — no obligation and no mailing-list spam.
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
        <Reviews />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-20 pt-8 text-[var(--color-ink)]">
      <div className="mx-auto max-w-xl px-4">
        <header className="mb-8 flex items-start gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold/90 bg-navy text-center text-xl font-bold text-paper shadow-md shadow-navy/20 ring-1 ring-navy/5 sm:h-24 sm:w-24">
            {!photoFailed ? (
              <Image
                src={`${BASE_PATH}/will.jpg`}
                alt="Will Chappell — independent financial advisor in Greensboro, NC"
                fill
                sizes="(min-width: 640px) 96px, 80px"
                className="object-cover object-[center_25%]"
                priority
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span aria-hidden="true">WC</span>
            )}
          </div>
          <div>
            <p className="text-lg font-bold leading-snug text-navy">
              Will Chappell — independent financial advisor, Greensboro NC
            </p>
            <p className="mt-1 text-lg text-navy/80">
              Three quick questions. One screen at a time. No spam — just clear
              answers tailored to you.
            </p>
            <p className="mt-2 text-base font-semibold text-navy/70">
              Trusted by 200+ Greensboro &amp; Winston-Salem households.
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
                    Start with how Will should reach you
                  </h2>
                  <p className="mt-2 text-lg opacity-90">
                    Quick contact info — Will personally follows up within one
                    business day. We never sell your data.
                  </p>
                  <div className="mt-6 space-y-4 text-left">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        First name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        value={answers.firstName}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ firstName: e.target.value });
                        }}
                        className="w-full rounded-lg border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy outline-none transition-colors focus:border-gold min-h-[60px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-lg font-bold text-navy"
                      >
                        Last name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        value={answers.lastName}
                        onChange={(e) => {
                          setStepError(null);
                          patch({ lastName: e.target.value });
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
                  </div>
                  <p className="mt-4 text-left text-base italic text-navy/75">
                    By submitting, you agree Will Chappell may contact you by
                    phone, text, or email about your options. Standard rates
                    apply. We don&apos;t sell your information.
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <h2
                    id="s2-title"
                    className="font-display text-2xl font-normal text-navy sm:text-3xl"
                  >
                    What kind of help are you looking for?
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
                      labelledBy="s3-title"
                    />
                  </div>
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

        {step === 1 ? (
          <>
            <WhatToExpect />
            <Reviews />
          </>
        ) : null}
      </div>
    </div>
  );
}
