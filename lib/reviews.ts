// Real client reviews of Will. KEEP THIS LIST EMPTY OR REAL.
//
// FTC Endorsement Guides (2023, 16 CFR Part 255) treat fabricated reviews as
// deceptive practice — civil penalties up to ~$51,744 per violation. NC
// Department of Insurance also prohibits misleading advertising under
// 11 NCAC 12.0314. Do NOT add a review unless:
//   (a) it is the actual words of a real client, AND
//   (b) the client gave permission to use their first name + last initial +
//       city (or pseudonym with disclosure), AND
//   (c) it describes a typical experience (avoid outliers without a
//       "results not typical" disclaimer).
//
// Easiest way to collect:
//   1. After each Calendly call, Will texts: "Would you be willing to write
//      2-3 sentences about our chat? It really helps neighbors trust the
//      process. I'll send you the exact words back so you can approve before
//      anything goes public."
//   2. Or pull verified Google Business Profile reviews — those are
//      automatically FTC-safe to surface.
//
// Schema:
//   id        — slug used as React key; any unique string
//   quote     — the client's words. Keep under 280 chars for scannability.
//   name      — first name + last initial, e.g. "Sarah K."
//   city      — "Greensboro", "Winston-Salem", "High Point", etc.
//   coverage  — what Will helped with, e.g. "Medicare supplement", "Term life"
//   verified  — true ONLY if pulled from Google Business Profile, BBB, etc.

export type ClientReview = {
  id: string;
  quote: string;
  name: string;
  city: string;
  coverage: string;
  verified?: boolean;
};

export const reviews: ClientReview[] = [
  // Example of the format Will should follow when collecting real quotes:
  //
  // {
  //   id: "sarah-k-ws",
  //   quote:
  //     "Will sat with my husband and me at our kitchen table for two hours " +
  //     "and walked us through every option in plain English. We saved $180 " +
  //     "a month on our Medicare supplement and finally feel like we " +
  //     "understand what we are paying for.",
  //   name: "Sarah K.",
  //   city: "Winston-Salem",
  //   coverage: "Medicare supplement",
  //   verified: true,
  // },
];
