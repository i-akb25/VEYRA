export type JobSource = "Remotive" | "Arbeitnow";

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
  matchScore?: number;
  matchReasons?: string[];
};

export type SearchResponse = {
  jobs: Job[];
  fetchedAt: string;
  warnings: string[];
};

export type CandidateProfile = {
  role: string;
  skills: string;
  locations: string;
  experience: string;
  remoteOnly: boolean;
};
