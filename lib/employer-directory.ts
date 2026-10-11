import directory from "../data/employer-directory.json";

export type EmployerDirectoryEntry = {
  name: string;
  careersUrl: string;
  discoveryUrls?: string[];
  regions: string[];
  industries: string[];
  reviewedAt: string;
};

// The directory is data rather than application code so verified employers can
// be added by the importer and daily workflows without editing this module.
export const employerDirectory = directory as EmployerDirectoryEntry[];
