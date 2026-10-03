import type { GovernmentOpportunity } from "./types";

// Every record links directly to the issuing authority. Deadlines automatically
// move expired notices out of the Open view; users must verify the official notice.
export const GOVERNMENT_OPPORTUNITIES: GovernmentOpportunity[] = [
  {
    id: "upsc-ese-2027",
    category: "UPSC",
    title: "Engineering Services (Preliminary) Examination, 2027",
    organization: "Union Public Service Commission",
    notificationDate: "2026-09-16",
    deadline: "2026-10-06T18:00:00+05:30",
    qualification: "Engineering degree in an eligible discipline; verify the notification for discipline and age rules.",
    location: "India",
    officialUrl: "https://www.upsc.gov.in/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027"
  },
  {
    id: "ssc-gd-2027",
    category: "SSC",
    title: "Constable (GD) Examination, 2027",
    organization: "Staff Selection Commission",
    notificationDate: "2026-09-01",
    deadline: null,
    qualification: "See the official 2026–27 examination calendar and notification for eligibility.",
    location: "India",
    officialUrl: "https://ssc.gov.in/",
    note: "The official calendar gives an October 2026 notification window. Confirm the exact closing date on SSC before applying."
  },
  {
    id: "bpsc-advertisements",
    category: "BPSC",
    title: "Current BPSC recruitment advertisements",
    organization: "Bihar Public Service Commission",
    notificationDate: "2026-09-22",
    deadline: null,
    qualification: "Varies by advertisement. Open the official advertisement archive for post-specific rules.",
    location: "Bihar",
    officialUrl: "https://bpsc.bihar.gov.in/notification-category/advertisement/",
    note: "Multiple advertisements; VEYRA does not invent a shared deadline."
  },
  {
    id: "ibps-various-posts-2026",
    category: "Banking",
    title: "Recruitment of various IBPS posts",
    organization: "Institute of Banking Personnel Selection",
    notificationDate: "2026-09-25",
    deadline: "2026-10-21T23:59:00+05:30",
    qualification: "Qualification varies by post; verify the official detailed notification.",
    location: "India",
    officialUrl: "https://ibpsreg.ibps.in/ibpsvpspt26/index.php?stat=0"
  },
  {
    id: "rrb-employment-notices-2026",
    category: "Railway",
    title: "Centralised Employment Notices, including ALP 01/2026",
    organization: "Railway Recruitment Board, Chandigarh",
    notificationDate: "2026-05-14",
    deadline: null,
    qualification: "Varies by CEN: graduate, diploma, ITI or matriculation depending on the post.",
    location: "India",
    officialUrl: "https://www.rrbcdg.gov.in/employment-notices.php",
    note: "Official notice index. Individual application windows may already be closed."
  },
  {
    id: "ksrtc-aee-electrical-2026",
    category: "PSU",
    title: "Assistant Executive Engineer (Electrical)",
    organization: "Kerala State Road Transport Corporation",
    notificationDate: "2026-09-25",
    deadline: "2026-10-09T17:00:00+05:30",
    qualification: "Electrical engineering qualification and experience as specified in the official notice.",
    location: "Kerala",
    officialUrl: "https://cmd.kerala.gov.in/recruitment/recruitment-for-selection-to-the-posts-of-chief-engineer-projects-civil-works-and-assistant-executive-engineer-electrical-at-kerala-state-road-transport-corporation-ksrtc/"
  },
  {
    id: "powergrid-apprentices-rolling",
    category: "Apprenticeship",
    title: "Rolling engagement of apprentices",
    organization: "POWERGRID",
    notificationDate: "2026-09-01",
    deadline: null,
    qualification: "ITI, diploma or engineering degree depending on trade; NAPS/NATS registration required.",
    location: "India",
    officialUrl: "https://www.powergrid.in/en/rolling-advertisement-enagagement-apprentices",
    note: "Rolling programme. Confirm the active region and trade on the official page."
  },
  {
    id: "isro-iprc-technical-2026",
    category: "PSU",
    title: "Technical Assistant and Technician recruitment",
    organization: "ISRO Propulsion Complex",
    notificationDate: "2026-09-12",
    deadline: "2026-10-05T23:59:00+05:30",
    qualification: "Diploma or trade qualification depending on the post, including Electrical and Electronics roles.",
    location: "Tamil Nadu",
    officialUrl: "https://www.isro.gov.in/IPRCRecruitment4.html"
  },
  {
    id: "cmet-project-staff-2026",
    category: "PSU",
    title: "Research Associate, JRF and Project Assistant",
    organization: "Centre for Materials for Electronics Technology",
    notificationDate: "2026-09-25",
    deadline: "2026-10-16T17:00:00+05:30",
    qualification: "Post-specific science or engineering qualification; verify the detailed official advertisement.",
    location: "India",
    officialUrl: "https://www.cmet.gov.in/jobs"
  },
  {
    id: "canara-graduate-apprentice-2026",
    category: "Apprenticeship",
    title: "Engagement of Graduate Apprentices for FY 2026–27",
    organization: "Canara Bank",
    notificationDate: "2026-09-01",
    deadline: "2026-11-01T23:59:00+05:30",
    qualification: "Graduate degree; verify state, language and registration requirements.",
    location: "India",
    officialUrl: "https://ibpsreg.ibps.in/cabgasep26/"
  }
];
