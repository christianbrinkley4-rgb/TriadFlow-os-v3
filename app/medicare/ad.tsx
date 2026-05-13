import Image from "next/image";
import { Montserrat } from "next/font/google";

const headline = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const QUOTE_URL = "/medicare";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Vertical-split marketing graphic: advisor photo (left) + copy panel (right).
 * Used for ad creative renders. Uses Academic Elite tokens.
 */
export default function MedicareAd() {
  return (
    <div
      className="relative mx-auto w-full max-w-[960px] overflow-hidden bg-paper shadow-lg"
      style={{ minHeight: "min(100vh, 640px)" }}
    >
      <div className="flex min-h-[560px] flex-col pb-14 sm:min-h-[600px] sm:flex-row sm:pb-16">
        <div className="relative h-64 w-full sm:h-auto sm:min-h-[600px] sm:w-1/2 sm:flex-none">
          <Image
            src={`${BASE_PATH}/will.jpg`}
            alt="Will Chappell — independent financial advisor based in Greensboro, NC"
            fill
            className="object-cover object-[center_top]"
            sizes="(max-width: 640px) 100vw, 480px"
            priority
          />
        </div>

        <div className="relative flex w-full flex-1 flex-col hyphens-none bg-paper px-6 py-8 [word-break:normal] sm:w-1/2 sm:px-8 sm:pb-16 sm:pt-10">
          <div className="flex flex-1 flex-col gap-4">
            <h1
              className={`${headline.className} text-[28px] leading-snug text-gold`}
            >
              IS YOUR FAMILY ONE PAYCHECK AWAY FROM A FINANCIAL EMERGENCY?
            </h1>

            <div className="text-lg leading-relaxed text-navy sm:text-[18px]">
              <p className="m-0">
                Will Chappell is an independent financial advisor based in
                Greensboro, NC. He compares your options from top-rated
                carriers so you don&apos;t have to.
              </p>
              <p className="mt-4 m-0 text-[17px] leading-relaxed text-navy/90 sm:text-[18px]">
                Three quick questions. Clear answers in your inbox. No pressure,
                no spam — just a neighbor who lives here too.
              </p>
              <p className="mt-3 m-0 text-[15px] font-semibold leading-tight text-navy/70 sm:text-base">
                Trusted by 200+ Greensboro &amp; Winston-Salem households.
              </p>
            </div>

            <div className="mt-auto flex w-full justify-center pt-8 sm:pt-10">
              <a
                href={QUOTE_URL}
                className="inline-flex min-h-[60px] w-full max-w-md items-center justify-center rounded-md bg-gold px-6 text-center text-lg font-bold leading-snug text-navy transition-colors hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Get My Free Quote →
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-0 left-0 right-0 hyphens-none bg-paper/90 px-4 py-2 text-center text-[11px] leading-tight text-navy/40 [word-break:normal] sm:text-xs">
        For educational purposes only; not individualized tax, legal, or
        investment advice. Coverage and rates subject to underwriting and
        carrier approval.
      </p>
    </div>
  );
}
