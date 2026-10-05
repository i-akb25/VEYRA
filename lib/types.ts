export const JOB_SOURCES = ["Remotive", "Arbeitnow", "Jobicy", "Himalayas", "Remote OK", "Greenhouse", "Lever", "Ashby", "SmartRecruiters", "Company Careers"] as const;
export type JobSource = (typeof JOB_SOURCES)[number];
export type ExperienceLevel = "fresher" | "entry" | "experienced" | "any";
export type Freshness = "new" | "recent" | "older" | "unknown";
export type ApplicationStatus = "saved" | "applied" | "interview" | "rejected" | "offer";
export type RoleCategory = "custom" | "software" | "electrical" | "automation" | "get" | "sales" | "marketing" | "management" | "finance" | "hr" | "design" | "data" | "operations" | "support" | "healthcare" | "education" | "science" | "legal" | "hospitality" | "retail" | "construction" | "trades" | "administration" | "media" | "agriculture" | "social" | "remote";
export type Qualification = "any" | "school" | "iti" | "diploma" | "undergraduate" | "btech" | "postgraduate" | "phd" | "professional";
export type WorkplaceMode = "any" | "remote" | "hybrid" | "onsite";
export type GeographyScope = "india" | "international" | "any";
export type RemoteScope = "worldwide" | "country-restricted" | "not-remote" | "not-stated";
export type EligibilityValue = "yes" | "no" | "not-stated";
export type SortMode = "relevance" | "newest" | "salary" | "company";
export type ResultLayout = "detailed" | "compact";
export type SearchMode = "exact" | "balanced" | "broad";
export type EmploymentSchedule = "any" | "full-time" | "part-time" | "contract" | "internship" | "temporary" | "volunteer";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  workplace?: Exclude<WorkplaceMode, "any"> | "unknown";
  source: JobSource;
  url: string;
  publishedAt: string;
  description: string;
  tags: string[];
  employmentType?: string;
  experienceLevel: ExperienceLevel;
  freshness: Freshness;
  salaryText?: string;
  matchScore?: number;
  matchReasons?: string[];
  missingSkills?: string[];
  relevanceScore?: number;
  roleMatchScore?: number;
  qualification?: string;
  verifiedAt?: string;
  locationFit?: "exact" | "india-fallback" | "global-remote" | "international" | "anywhere";
  country?: string;
  city?: string;
  remoteScope?: RemoteScope;
  visaSponsorship?: EligibilityValue;
  workAuthorization?: string;
  requiredLanguage?: string;
  experienceRange?: string;
  relocation?: EligibilityValue;
  salaryCurrency?: string;
  lastCheckedAt?: string;
  closesAt?: string;
  liveStatus?: "live" | "closed" | "unknown";
  liveStatusReason?: string;
};

export type SourceHealth = { name: string; status: "healthy" | "degraded" | "disabled"; count: number; message?: string; lastCheckedAt?: string; cached?: boolean };

export type SearchResponse = {
  jobs: Job[];
  fetchedAt: string;
  warnings: string[];
  sources: string[];
  health: SourceHealth[];
  cache: { status: "hit" | "miss"; maxAgeSeconds: number };
};

export type CandidateProfile = {
  role: string;
  skills: string;
  locations: string;
  experience: string;
  experienceLevel: ExperienceLevel;
  graduationYear: string;
  education: string;
  remoteOnly: boolean;
  recentGraduate: boolean;
};

export type LocalProfile = { id: string; name: string; profile: CandidateProfile };

export type SearchFilters = {
  experienceLevel: ExperienceLevel;
  postedWithin: "any" | "1" | "7" | "30";
  company: string;
  source: "all" | JobSource;
  employmentType: string;
  minimumSalary: string;
  qualification: Qualification;
  sort: SortMode;
  layout: ResultLayout;
};

export type ApplicationRecord = {
  id: string;
  job: Job;
  status: ApplicationStatus;
  notes: string;
  deadline: string;
  followUp: string;
  updatedAt: string;
};

export type CareerBoard = { id: string; url: string; label: string };

export type SearchPreset = {
  id: string;
  name: string;
  query: string;
  category: RoleCategory;
  location: string;
  scope: GeographyScope;
  workplace: WorkplaceMode;
  experienceLevel: ExperienceLevel;
  qualification: Qualification;
  negativeKeywords: string;
  industry?: string;
  specificRoles?: string[];
  mode?: SearchMode;
  schedule?: EmploymentSchedule;
  requiredKeywords?: string;
  optionalKeywords?: string;
  relocation?: "any" | "yes" | "no";
  includeNearby?: boolean;
};

export type GovernmentCategory = "UPSC" | "SSC" | "BPSC" | "State PSC" | "Banking" | "Railway" | "Defence" | "Teaching" | "PSU" | "Apprenticeship" | "Higher Studies" | "Private Exam";
export type GovernmentOpportunity = {
  id: string;
  category: GovernmentCategory;
  title: string;
  organization: string;
  notificationDate: string;
  deadline: string | null;
  qualification: string;
  location: string;
  officialUrl: string;
  officialPdfUrl?: string;
  vacancies?: string;
  ageLimit?: string;
  qualificationLevel?: Qualification;
  verifiedAt?: string;
  corrections?: Array<{ date: string; note: string; url: string }>;
  note?: string;
};

export type LocalBackup = {
  version: 1;
  exportedAt: string;
  profile: CandidateProfile;
  saved: Job[];
  applications: ApplicationRecord[];
  careerBoards: CareerBoard[];
  seenJobIds: string[];
  searchPresets?: SearchPreset[];
  hiddenJobIds?: string[];
  profiles?: LocalProfile[];
  activeProfileId?: string;
};
