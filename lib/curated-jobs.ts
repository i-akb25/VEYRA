import { getFreshness, inferExperience } from "./matching";
import type { Job, RoleCategory } from "./types";

type Curated = Omit<Job, "experienceLevel" | "freshness"> & { categories: RoleCategory[]; deadline?: string };

const records: Curated[] = [
  { id: "curated-wipro-get-gurugram", title: "Graduate Engineer Trainee", company: "Wipro", location: "Gurugram, India", remote: false, source: "Company Careers", url: "https://careers.wipro.com/job/Gurugram-Graduate-Engineer-Trainee-IND-122016/196593-en_US/", publishedAt: "2026-09-10", description: "Graduate Engineer Trainee opening in Gurugram. Verify eligibility and current status on Wipro Careers.", tags: ["GET", "graduate", "engineering", "Gurugram"], employmentType: "Full-time", categories: ["get", "software"] },
  { id: "curated-hitachi-management-trainee", title: "Management Trainee", company: "Hitachi Energy India", location: "India", remote: false, source: "Company Careers", url: "https://careers.hitachi.com/management-trainee/job/R0087362", publishedAt: "2026-09-25", description: "Technical project engineering across electrical, automation, mechanical and software disciplines.", tags: ["electrical", "automation", "graduate", "trainee"], employmentType: "Full-time", categories: ["electrical", "automation", "get"] },
  { id: "curated-intralog-get", title: "Graduate Engineering Trainee — Mechatronics", company: "Intralog Automation", location: "Vadodara, India", remote: false, source: "Company Careers", url: "https://www.intralog.in/careers/graduate-engineering-trainee-mechatronics", publishedAt: "2026-09-01", description: "Fresher role covering robotics, controls, electrical, mechanical and software engineering.", tags: ["automation", "robotics", "controls", "electrical", "fresher"], employmentType: "Full-time", categories: ["automation", "electrical", "get"] },
  { id: "curated-daikin-graduate", title: "Graduate Trainee", company: "Daikin India", location: "Sri City, Andhra Pradesh, India", remote: false, source: "Company Careers", url: "https://career.daikinindia.com/go/Daikn_Careers/514280/", publishedAt: "2026-08-24", description: "Official Daikin India careers listing for graduate trainees and electrical maintenance roles.", tags: ["graduate", "trainee", "electrical", "quality"], employmentType: "Full-time", categories: ["electrical", "get"] }
];

export function curatedJobs(category: RoleCategory): Job[] {
  const now = Date.now();
  return records.filter((job) => (category === "custom" || job.categories.includes(category)) && (!job.deadline || Date.parse(job.deadline) >= now)).map((record) => {
    const { categories, deadline, ...job } = record;
    void categories; void deadline;
    return { ...job, workplace: job.remote ? "remote" as const : "onsite" as const, experienceLevel: inferExperience(`${job.title} ${job.description}`), freshness: getFreshness(job.publishedAt), verifiedAt: "2026-10-03" };
  });
}
