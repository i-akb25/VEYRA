export const JOB_SOURCES = ["Remotive", "Arbeitnow", "Greenhouse", "Lever", "Ashby", "Company Careers"] as const;
export type JobSource = (typeof JOB_SOURCES)[number];
export type ExperienceLevel = "fresher" | "entry" | "experienced" | "any";
export type Freshness = "new" | "recent" | "older" | "unknown";
export type ApplicationStatus = "saved" | "applied" | "interview" | "rejected" | "offer";
export type RoleCategory = "custom" | "software" | "electrical" | "automation" | "get" | "remote";
export type Qualification = "any" | "btech" | "degree" | "diploma" | "iti";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
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
  locationFit?: "exact" | "india-fallback" | "global-remote";
};

export type SourceHealth = { name: string; status: "healthy" | "degraded"; count: number; message?: string };

export type SearchResponse = {
  jobs: Job[];
  fetchedAt: string;
  warnings: string[];
  sources: string[];
  health: SourceHealth[];
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

export type SearchFilters = {
  experienceLevel: ExperienceLevel;
  postedWithin: "any" | "1" | "7" | "30";
  company: string;
  source: "all" | JobSource;
  employmentType: string;
  minimumSalary: string;
  qualification: Qualification;
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

export type GovernmentCategory = "UPSC" | "SSC" | "BPSC" | "Banking" | "Railway" | "PSU" | "Apprenticeship";
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
};
