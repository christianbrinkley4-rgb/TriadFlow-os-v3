/**
 * Process-walkthrough block — FTC-safe (it's a description of Will's process,
 * not third-party endorsement). Designed to do the same trust-building job as
 * testimonials when real ones aren't yet collected. 60+-tuned: 18-20px type,
 * numbered steps, concrete time commitments, plain language.
 */
export function WhatToExpect() {
  const steps = [
    {
      title: "You hear from Will within one business day",
      body:
        "Usually a short phone call — under 10 minutes — so Will can " +
        "understand what brought you in and answer any first questions.",
    },
    {
      title: "A no-pressure 30-minute conversation",
      body:
        "If you want a closer look, Will sits down with you (in person at " +
        "his Greensboro office, or by phone) and walks through your " +
        "options in plain English. No paperwork on the first call.",
    },
    {
      title: "Quotes from multiple top-rated carriers",
      body:
        "Will compares plans side by side and sends you a written summary. " +
        "You decide what fits your family. He never pressures, and there's " +
        "no obligation to buy anything.",
    },
    {
      title: "He stays your point of contact",
      body:
        "If something changes — a new diagnosis, a move, a question about " +
        "a bill — you call Will directly. Not a call center.",
    },
  ];

  return (
    <section
      aria-labelledby="what-to-expect-title"
      className="mx-auto mt-10 max-w-xl px-4"
    >
      <h2
        id="what-to-expect-title"
        className="font-display text-2xl font-normal text-navy sm:text-3xl"
      >
        What happens after you finish these questions
      </h2>
      <p className="mt-2 text-lg text-navy/70">
        No pressure. No spam. Here is exactly what comes next.
      </p>

      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-4 rounded-2xl border border-navy/10 bg-white/90 p-5 shadow-sm shadow-navy/5"
          >
            <span
              aria-hidden="true"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-lg font-bold text-navy"
            >
              {index + 1}
            </span>
            <div>
              <p className="text-lg font-bold text-navy">{step.title}</p>
              <p className="mt-1 text-lg leading-relaxed text-[var(--color-ink)]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
