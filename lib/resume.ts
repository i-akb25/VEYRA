import type { CandidateProfile, ExperienceLevel } from "./types";
import { tokens } from "./matching";

const SKILLS = [
  "javascript", "typescript", "react", "next.js", "node.js", "express", "mongodb", "postgresql", "sql", "python", "java", "c++",
  "git", "github", "docker", "aws", "azure", "vercel", "html", "css", "tailwind", "redux", "angular", "webrtc", "rest api", "graphql",
  "prisma", "linux", "ci/cd", "matlab", "simulink", "plc", "scada", "automation", "control systems", "electrical machines", "power systems",
  "embedded systems", "arduino", "raspberry pi", "dronekit", "pixhawk", "iot", "robotics", "pmsm", "bldc", "communication", "leadership", "project management"
];

const ROLE_PATTERNS = [
  "software engineer", "frontend engineer", "backend engineer", "full stack developer", "web developer", "product engineer", "electrical engineer",
  "automation engineer", "control engineer", "graduate engineer trainee", "embedded engineer", "robotics engineer", "systems engineer", "data analyst", "product manager"
];

export async function readResume(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.size > 8 * 1024 * 1024) throw new Error("Resume must be smaller than 8 MB.");
  const buffer = await file.arrayBuffer();

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    return pages.join("\n");
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  }
  if (extension === "txt" || extension === "md") return new TextDecoder().decode(buffer);
  throw new Error("Use a PDF, DOCX, TXT or Markdown resume.");
}

export function profileFromResume(text: string, existing: CandidateProfile): CandidateProfile {
  const lower = text.toLowerCase();
  const skills = SKILLS.filter((skill) => lower.includes(skill));
  const roles = ROLE_PATTERNS.filter((role) => lower.includes(role));
  const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((match) => match[0]);
  const graduationYear = years.filter((year) => Number(year) >= 2015 && Number(year) <= new Date().getFullYear() + 6).at(-1) ?? existing.graduationYear;
  const experienceMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?experience/i);
  const experience = experienceMatch?.[1] ? `${experienceMatch[1]} years` : existing.experience;
  const numericExperience = Number(experienceMatch?.[1] ?? 0);
  let experienceLevel: ExperienceLevel = existing.experienceLevel;
  if (numericExperience >= 3) experienceLevel = "experienced";
  else if (numericExperience > 0) experienceLevel = "entry";
  else if (/\b(fresher|recent graduate|graduate engineer trainee)\b/i.test(text)) experienceLevel = "fresher";

  return {
    ...existing,
    role: roles.join(", ") || existing.role,
    skills: skills.join(", ") || tokens(text).slice(0, 20).join(", "),
    education: extractEducation(text) || existing.education,
    experience,
    experienceLevel,
    graduationYear,
    recentGraduate: graduationYear ? new Date().getFullYear() - Number(graduationYear) <= 2 : existing.recentGraduate
  };
}

function extractEducation(text: string): string {
  return text.match(/(?:B\.?\s?Tech|Bachelor(?:'s)?|M\.?\s?Tech|Master(?:'s)?|B\.?E\.?)[^\n]{0,100}/i)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
}
