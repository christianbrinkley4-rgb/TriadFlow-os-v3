import { reviews } from "@/lib/reviews";

/**
 * Reviews section, tuned for 60+ readers:
 *  - Large 18-20px body type
 *  - High-contrast navy on paper background
 *  - First name + last initial + city + coverage line (concrete, relatable)
 *  - No glossy stock photos, no emoji
 *  - Renders NOTHING if the reviews list is empty (FTC-safe default)
 */
export function Reviews() {
  if (reviews.length === 0) return null;

  return (
    <section
      aria-labelledby="reviews-title"
      className="mx-auto mt-10 max-w-xl px-4"
    >
      <h2
        id="reviews-title"
        className="font-display text-2xl font-normal text-navy sm:text-3xl"
      >
        What Triad neighbors say about working with Will
      </h2>
      <p className="mt-2 text-lg text-navy/70">
        Real words from real clients across Greensboro, Winston-Salem, and
        High Point.
      </p>

      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-2xl border border-navy/10 bg-white/90 p-6 shadow-sm shadow-navy/5"
          >
            <blockquote className="text-lg leading-relaxed text-[var(--color-ink)]">
              &ldquo;{review.quote}&rdquo;
            </blockquote>
            <footer className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-base">
              <span className="font-bold text-navy">{review.name}</span>
              <span className="text-navy/70">{review.city}</span>
              <span aria-hidden="true" className="text-navy/30">
                ·
              </span>
              <span className="text-navy/70">{review.coverage}</span>
              {review.verified ? (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  Verified Google review
                </span>
              ) : null}
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
