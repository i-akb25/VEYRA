import type { RoleCategory } from "./types";

export type OccupationRole = { id: string; label: string; category: RoleCategory; synonyms: string[] };

export const OCCUPATION_ROLES: OccupationRole[] = [
  { id: "software-engineer", label: "Software engineer", category: "software", synonyms: ["software developer", "sde", "web developer", "application developer"] },
  { id: "data-analyst", label: "Data analyst", category: "data", synonyms: ["business intelligence analyst", "mis analyst", "reporting analyst"] },
  { id: "electrical-engineer", label: "Electrical engineer", category: "electrical", synonyms: ["electrical design engineer", "power systems engineer", "electrical maintenance"] },
  { id: "automation-engineer", label: "Automation engineer", category: "automation", synonyms: ["controls engineer", "plc engineer", "scada engineer", "instrumentation engineer"] },
  { id: "graduate-trainee", label: "Graduate trainee", category: "get", synonyms: ["graduate engineer trainee", "get", "management trainee", "fresher", "new graduate", "apprentice"] },
  { id: "sales-executive", label: "Sales executive", category: "sales", synonyms: ["business development executive", "bde", "account executive", "relationship manager", "field sales"] },
  { id: "marketing-executive", label: "Marketing executive", category: "marketing", synonyms: ["digital marketer", "growth associate", "seo executive", "brand executive", "social media executive"] },
  { id: "accountant", label: "Accountant", category: "finance", synonyms: ["accounts executive", "finance executive", "audit associate", "tax associate", "bookkeeper"] },
  { id: "hr-executive", label: "HR executive", category: "hr", synonyms: ["human resources executive", "recruiter", "talent acquisition", "people operations"] },
  { id: "office-administrator", label: "Office administrator", category: "administration", synonyms: ["administrative assistant", "admin executive", "office assistant", "office coordinator", "back office executive", "clerical assistant"] },
  { id: "executive-assistant", label: "Executive assistant", category: "administration", synonyms: ["personal assistant", "secretary", "administrative coordinator"] },
  { id: "receptionist", label: "Receptionist", category: "administration", synonyms: ["front desk executive", "front office assistant", "guest relations executive"] },
  { id: "customer-support", label: "Customer support", category: "support", synonyms: ["customer service executive", "customer care", "support associate", "technical support", "chat support"] },
  { id: "nurse", label: "Nurse", category: "healthcare", synonyms: ["staff nurse", "registered nurse", "nursing officer", "clinical nurse"] },
  { id: "pharmacist", label: "Pharmacist", category: "healthcare", synonyms: ["clinical pharmacist", "pharmacy assistant", "dispensing pharmacist"] },
  { id: "healthcare-administrator", label: "Healthcare administrator", category: "healthcare", synonyms: ["hospital administrator", "patient coordinator", "medical receptionist", "clinical coordinator"] },
  { id: "teacher", label: "Teacher", category: "education", synonyms: ["school teacher", "educator", "faculty", "lecturer", "tutor", "trainer"] },
  { id: "academic-counsellor", label: "Academic counsellor", category: "education", synonyms: ["admission counsellor", "student counsellor", "education counsellor", "student success"] },
  { id: "retail-associate", label: "Retail associate", category: "retail", synonyms: ["store associate", "sales associate", "cashier", "store executive", "merchandiser"] },
  { id: "hotel-operations", label: "Hotel operations", category: "hospitality", synonyms: ["front office executive", "guest service associate", "hotel receptionist", "food and beverage associate"] },
  { id: "civil-site-engineer", label: "Civil/site engineer", category: "construction", synonyms: ["site engineer", "civil engineer", "quantity surveyor", "construction supervisor"] },
  { id: "technician", label: "Technician", category: "trades", synonyms: ["electrician", "fitter", "welder", "machinist", "mechanic", "machine operator"] },
  { id: "content-writer", label: "Content writer", category: "media", synonyms: ["copywriter", "editor", "journalist", "content editor", "communications associate"] },
  { id: "legal-associate", label: "Legal associate", category: "legal", synonyms: ["legal executive", "paralegal", "legal counsel", "compliance associate"] },
  { id: "research-assistant", label: "Research assistant", category: "science", synonyms: ["research associate", "laboratory assistant", "lab technician", "junior scientist"] },
  { id: "agriculture-officer", label: "Agriculture officer", category: "agriculture", synonyms: ["agronomist", "field officer agriculture", "horticulture officer", "food technologist"] },
  { id: "ngo-programme-associate", label: "NGO programme associate", category: "social", synonyms: ["programme officer", "project coordinator", "social worker", "community mobiliser", "development sector"] }
];

export const rolesForCategory = (category: RoleCategory) => OCCUPATION_ROLES.filter((role) => category === "custom" || role.category === category);

export function occupationPhrases(roleIds: string[]): string[] {
  return OCCUPATION_ROLES.filter((role) => roleIds.includes(role.id)).flatMap((role) => [role.label, ...role.synonyms]);
}

export function occupationLabel(roleId: string): string {
  return OCCUPATION_ROLES.find((role) => role.id === roleId)?.label ?? roleId;
}

export function occupationMatches(title: string, roleId: string): boolean {
  const role = OCCUPATION_ROLES.find((item) => item.id === roleId); if (!role) return false;
  const normalized = title.toLowerCase(); return [role.label, ...role.synonyms].some((phrase) => normalized.includes(phrase.toLowerCase()));
}
