import type { EligibilityValue, Job, RemoteScope } from "./types";

const NOT_STATED = "Not stated";
const countryPatterns: Array<[string, RegExp]> = [
  ["India", /\b(india|bengaluru|bangalore|delhi|gurugram|gurgaon|noida|mumbai|pune|hyderabad|chennai|kolkata|ahmedabad|jaipur|lucknow|patna)\b/i],
  ["United States", /\b(united states|usa|u\.s\.|new york|california|texas|seattle|boston|chicago)\b/i],
  ["Canada", /\b(canada|toronto|vancouver|montreal|ottawa)\b/i],
  ["United Kingdom", /\b(united kingdom|uk|england|london|manchester|edinburgh)\b/i],
  ["Germany", /\b(germany|berlin|munich|hamburg|frankfurt)\b/i],
  ["France", /\b(france|paris|lyon)\b/i],
  ["Netherlands", /\b(netherlands|amsterdam|rotterdam)\b/i],
  ["United Arab Emirates", /\b(united arab emirates|uae|dubai|abu dhabi)\b/i],
  ["Singapore", /\bsingapore\b/i],
  ["Australia", /\b(australia|sydney|melbourne|brisbane|perth)\b/i]
];

function stated(value: boolean | null): EligibilityValue {
  return value === null ? "not-stated" : value ? "yes" : "no";
}

function sentenceContaining(text: string, pattern: RegExp): string | undefined {
  return text.split(/(?<=[.!?])\s+/).find((sentence) => pattern.test(sentence))?.trim().slice(0, 240);
}

export function extractEligibility(job: Job): Pick<Job, "country" | "city" | "remoteScope" | "visaSponsorship" | "workAuthorization" | "requiredLanguage" | "experienceRange" | "qualification" | "relocation" | "salaryCurrency"> {
  const text = `${job.title}. ${job.location}. ${job.description}`.replace(/\s+/g, " ");
  const country = countryPatterns.find(([, pattern]) => pattern.test(job.location))?.[0] ?? (/worldwide|anywhere|global/i.test(job.location) ? "Worldwide" : NOT_STATED);
  const city = job.location.split(",")[0]?.trim() || NOT_STATED;
  let remoteScope: RemoteScope = "not-remote";
  if (job.workplace === "remote") remoteScope = /worldwide|anywhere|global|all countries/i.test(text) ? "worldwide" : /must be based|only candidates|within|eligible to work|reside in|remote (?:in|from)/i.test(text) ? "country-restricted" : "not-stated";

  const sponsorshipPositive = /\b(visa sponsorship (?:is )?(?:available|provided|offered)|sponsor(?:ing|ship) (?:is )?(?:available|provided|offered))\b/i.test(text);
  const sponsorshipNegative = /\b(no visa sponsorship|cannot sponsor|unable to sponsor|sponsorship is not available|do not sponsor)\b/i.test(text);
  const relocationPositive = /\b(relocation (?:assistance|support|package) (?:is )?(?:available|provided|offered)|will relocate)\b/i.test(text);
  const relocationNegative = /\b(no relocation|relocation (?:is )?not (?:available|provided|offered))\b/i.test(text);
  const experience = text.match(/\b(?:at least\s+)?\d{1,2}\s*(?:[-–+]\s*\d{1,2})?\+?\s*years?(?:\s+of\s+experience)?\b/i)?.[0];
  const language = text.match(/\b(?:fluent|proficient|professional proficiency|native)\s+(?:in\s+)?(English|Hindi|French|German|Spanish|Arabic|Mandarin|Japanese)\b/i)?.[1];
  const qualification = sentenceContaining(text, /\b(Ph\.?D|doctorate|master'?s|postgraduate|bachelor'?s|undergraduate|B\.?Tech|B\.?E\.?|diploma|ITI|high school|secondary school|professional certification)\b/i);
  const authorization = sentenceContaining(text, /\b(work authori[sz]ation|authori[sz]ed to work|right to work|work permit|citizen(?:ship)?|permanent resident)\b/i);
  const currency = job.salaryText?.match(/₹|INR|USD|\$|GBP|£|EUR|€|AED|CAD|AUD/i)?.[0];

  return {
    country,
    city,
    remoteScope,
    visaSponsorship: stated(sponsorshipPositive ? true : sponsorshipNegative ? false : null),
    workAuthorization: authorization ?? NOT_STATED,
    requiredLanguage: language ?? NOT_STATED,
    experienceRange: experience ?? NOT_STATED,
    qualification: qualification ?? NOT_STATED,
    relocation: stated(relocationPositive ? true : relocationNegative ? false : null),
    salaryCurrency: currency ? ({ "₹": "INR", "$": "USD", "£": "GBP", "€": "EUR" }[currency] ?? currency.toUpperCase()) : NOT_STATED
  };
}
