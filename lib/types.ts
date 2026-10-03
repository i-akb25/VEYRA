export const JOB_SOURCES = ["Remotive", "Arbeitnow", "Greenhouse", "Lever", "Ashby"] as const;
export type JobSource = (typeof JOB_SOURCES)[number];
export type ExperienceLevel = "fresher" | "entry" | "experienced" | "any";
export type Freshness = "new" | "recent" | "older" | "unknown";
export type ApplicationStatus = "saved" | "applied" | "interview" | "rejected" | "offer";

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
};

export type SearchResponse = {
  jobs: Job[];
  fetchedAt: string;
  warnings: string[];
  sources: string[];
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

export type LocalBackup = {
  version: 1;
  exportedAt: string;
  profile: CandidateProfile;
  saved: Job[];
  applications: ApplicationRecord[];
  careerBoards: CareerBoard[];
  seenJobIds: string[];
};
