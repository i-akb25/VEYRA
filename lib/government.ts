import type { GovernmentOpportunity } from "./types";

// Every record links directly to the issuing authority. Deadlines automatically
// move expired notices out of the Open view; users must verify the official notice.
const REVIEWED_GOVERNMENT_OPPORTUNITIES: GovernmentOpportunity[] = [
  {
    id: "kmscl-assistant-manager-it-2026", kind: "vacancy", category: "PSU",
    title: "Assistant Manager (IT)", organization: "Kerala Medical Services Corporation Limited",
    notificationDate: "2026-10-06", deadline: "2026-10-20T17:00:00+05:30", verifiedAt: "2026-10-06",
    qualification: "B.Tech/BE Computer Science or MCA; minimum two years of relevant post-qualification experience.", qualificationLevels: ["btech", "undergraduate", "postgraduate"],
    ageLimit: "40 years as on 1 October 2026; official relaxation rules apply", vacancies: "1", location: "Thiruvananthapuram, Kerala",
    officialUrl: "https://cmd.kerala.gov.in/recruitment/kmscl-notification-for-recruitment-to-the-post-of-assistant-manager-it/",
    officialPdfUrl: "https://cmd.kerala.gov.in/wp-content/uploads/2026/10/KMSCL-Assistant-Manager-Notification-V1.pdf",
    note: "Contract appointment; monthly remuneration ₹33,600. Reviewed from the official notification."
  },
  {
    id: "cmd-project-engineer-civil-2026", kind: "vacancy", category: "PSU",
    title: "Project Engineer (Civil)", organization: "Centre for Management Development, Government of Kerala",
    notificationDate: "2026-10-01", deadline: "2026-10-14T17:00:00+05:30", verifiedAt: "2026-10-06",
    qualification: "Civil engineering graduation; minimum three years of construction experience. Relevant postgraduate qualification preferred.", qualificationLevels: ["btech", "undergraduate", "postgraduate"],
    ageLimit: "30 years as on 1 October 2026", vacancies: "1", location: "Kerala",
    officialUrl: "https://cmd.kerala.gov.in/recruitment/notification-for-recruitment-to-the-post-of-project-engineer-at-cmd/",
    officialPdfUrl: "https://cmd.kerala.gov.in/wp-content/uploads/2026/10/Notification-Project-Engineer.pdf",
    note: "One-year contract; remuneration ₹35,000–45,000. Apply by the email procedure specified in the PDF."
  },
  {
    id: "kcb-accounts-officer-2026", kind: "vacancy", category: "PSU",
    title: "Accounts Officer", organization: "Kerala Cashew Board Limited",
    notificationDate: "2026-09-29", deadline: "2026-10-13T17:00:00+05:30", verifiedAt: "2026-10-06",
    qualification: "CA/ICMA Inter with completed articleship and two years post-articleship experience, or M.Com with three years relevant post-qualification experience.", qualificationLevels: ["professional", "postgraduate"],
    ageLimit: "Below 30 years as on 1 September 2026", vacancies: "1", location: "Kerala",
    officialUrl: "https://cmd.kerala.gov.in/recruitment/recruitment-for-selection-to-the-post-of-accounts-officer-at-kerala-cashew-board-ltd/",
    officialPdfUrl: "https://cmd.kerala.gov.in/wp-content/uploads/2026/09/29-09-2026-NOTIFICATION-KCB-AO-FINAL.pdf",
    note: "11-month contract; remuneration ₹35,000 per month."
  },
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
    kind: "vacancy",
    verifiedAt: "2026-10-06",
    officialPdfUrl: "https://cmd.kerala.gov.in/wp-content/uploads/2026/09/Notification-Final-CE-AE-v2.pdf",
    vacancies: "1 (Electrical)",
    ageLimit: "50 years as on 1 September 2026; see relaxation rules",
    qualificationLevels: ["btech", "undergraduate"],
    corrections: [{ date: "2026-10-06", note: "Indexed notification date corrected to 26 September; added PDF, vacancy count, age and minimum experience from the official notice.", url: "https://cmd.kerala.gov.in/wp-content/uploads/2026/09/Notification-Final-CE-AE-v2.pdf" }],
    category: "PSU",
    title: "Assistant Executive Engineer (Electrical)",
    organization: "Kerala State Road Transport Corporation",
    notificationDate: "2026-09-26",
    deadline: "2026-10-09T17:00:00+05:30",
    qualification: "B.Tech Electrical or recognised equivalent; at least 10 years of eligible electrical engineering experience. Not a fresher vacancy.",
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
  },
  {
    id: "iocl-current-openings",
    category: "PSU",
    title: "Current recruitment and apprenticeship notices",
    organization: "Indian Oil Corporation Limited (IOCL)",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "10th/12th, ITI, diploma, graduate and professional roles vary by advertisement.",
    location: "India",
    officialUrl: "https://iocl.com/latest-job-opening",
    note: "Official IOCL recruitment index. Check the individual advertisement for deadline, region and discipline."
  },
  {
    id: "ongc-careers",
    category: "PSU",
    title: "Current recruitment notices",
    organization: "Oil and Natural Gas Corporation (ONGC)",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Varies across apprentice, graduate trainee, engineering and specialist advertisements.",
    location: "India",
    officialUrl: "https://ongcindia.com/web/eng/career/recruitment-notice",
    note: "Official ONGC recruitment-notice page."
  },
  {
    id: "ntpc-careers",
    category: "PSU",
    title: "Jobs and executive trainee recruitment",
    organization: "NTPC Limited",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Engineering, finance, HR, medical, diploma and other qualifications depending on the notice.",
    location: "India",
    officialUrl: "https://careers.ntpc.co.in/",
    note: "Official NTPC careers portal."
  },
  {
    id: "bhel-careers",
    category: "PSU",
    title: "Current vacancies and apprentice notices",
    organization: "Bharat Heavy Electricals Limited (BHEL)",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "ITI, diploma, engineering and professional qualifications vary by unit and notice.",
    location: "India",
    officialUrl: "https://careers.bhel.in/",
    note: "Official BHEL recruitment portal."
  },
  {
    id: "gail-careers",
    category: "PSU",
    title: "Current GAIL career opportunities",
    organization: "GAIL (India) Limited",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Engineering, technical, medical and business qualifications vary by advertisement.",
    location: "India",
    officialUrl: "https://gailonline.com/CRApplyingGail.html",
    note: "Official GAIL careers and application page."
  },
  {
    id: "sail-careers",
    category: "PSU",
    title: "SAIL jobs and trainee notices",
    organization: "Steel Authority of India Limited",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "ITI, diploma, engineering, medical and management qualifications vary by plant and notice.",
    location: "India",
    officialUrl: "https://sailcareers.com/",
    note: "Official SAIL careers portal."
  },
  {
    id: "isro-careers",
    category: "PSU",
    title: "Current ISRO opportunities",
    organization: "Indian Space Research Organisation",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Scientist/Engineer, Technical Assistant, Technician, apprentice and administrative criteria vary by centre.",
    location: "India",
    officialUrl: "https://www.isro.gov.in/Careers.html",
    note: "Official ISRO careers index."
  },
  {
    id: "drdo-rac-ceptam",
    category: "Defence",
    title: "Scientist and technical recruitment",
    organization: "Defence Research and Development Organisation",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Scientist recruitment is published through RAC; technical and administrative recruitment through CEPTAM.",
    location: "India",
    officialUrl: "https://www.drdo.gov.in/drdo/careers",
    note: "Official DRDO careers index linking RAC and CEPTAM."
  },
  {
    id: "ctet-official",
    category: "Teaching",
    title: "Central Teacher Eligibility Test (CTET)",
    organization: "Central Board of Secondary Education",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Teacher-training and academic qualifications vary by paper and current information bulletin.",
    qualificationLevel: "undergraduate",
    location: "India",
    officialUrl: "https://ctet.nic.in/",
    vacancies: "Eligibility examination, not a vacancy count",
    ageLimit: "See the current official bulletin",
    note: "CTET eligibility does not itself guarantee appointment. Recruitment is conducted separately by the relevant authority."
  },
  {
    id: "uppsc-current-notices",
    category: "State PSC",
    title: "Current recruitment notices and examinations",
    organization: "Uttar Pradesh Public Service Commission",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Varies by examination and post.",
    location: "Uttar Pradesh",
    officialUrl: "https://uppsc.up.nic.in/",
    note: "Official UPPSC portal. VEYRA lists BPSC separately because each state commission publishes its own calendar and notices."
  },
  {
    id: "gate-official",
    category: "Higher Studies",
    title: "Graduate Aptitude Test in Engineering (GATE)",
    organization: "GATE organising institute",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Undergraduate degree holders and eligible students; discipline and year rules are in the current brochure.",
    location: "India",
    officialUrl: "https://gate2027.iitm.ac.in/",
    note: "Used for postgraduate admission and by some PSUs. Verify the current brochure and dates."
  },
  {
    id: "cat-official",
    category: "Higher Studies",
    title: "Common Admission Test (CAT)",
    organization: "Indian Institutes of Management",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Bachelor’s degree or equivalent subject to the current CAT eligibility rules.",
    location: "India",
    officialUrl: "https://iimcat.ac.in/",
    note: "Official CAT portal for IIM and participating management-programme admissions."
  },
  {
    id: "cuet-pg-official",
    category: "Higher Studies",
    title: "Common University Entrance Test (Postgraduate)",
    organization: "National Testing Agency",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Programme-specific undergraduate qualification set by participating universities.",
    location: "India",
    officialUrl: "https://exams.nta.ac.in/CUET-PG/",
    note: "Official NTA CUET-PG portal."
  },
  {
    id: "ugc-net-official",
    category: "Higher Studies",
    title: "UGC-NET",
    organization: "National Testing Agency",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Postgraduate qualification and subject-specific criteria as stated in the current bulletin.",
    location: "India",
    officialUrl: "https://ugcnet.nta.ac.in/",
    note: "Official UGC-NET portal for JRF, Assistant Professor and PhD-admission categories."
  },
  {
    id: "csir-net-official",
    category: "Higher Studies",
    title: "Joint CSIR-UGC NET",
    organization: "National Testing Agency",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Science postgraduate and other eligible qualifications specified in the current bulletin.",
    location: "India",
    officialUrl: "https://csirnet.nta.ac.in/",
    note: "Official Joint CSIR-UGC NET portal."
  },
  {
    id: "tcs-nqt",
    category: "Private Exam",
    title: "TCS National Qualifier Test",
    organization: "TCS iON",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Eligibility varies by test variant and participating employer.",
    location: "India",
    officialUrl: "https://www.tcsion.com/hub/national-qualifier-test/",
    note: "Private assessment. A test score does not guarantee recruitment; check fees and employer eligibility before registering."
  },
  {
    id: "elitmus",
    category: "Private Exam",
    title: "pH Test and employer opportunities",
    organization: "eLitmus",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Employer and test-specific eligibility.",
    location: "India",
    officialUrl: "https://www.elitmus.com/",
    note: "Private assessment platform. Verify current fees, validity and employer participation."
  },
  {
    id: "amcat",
    category: "Private Exam",
    title: "AMCAT assessment and jobs",
    organization: "SHL",
    notificationDate: "2026-10-05",
    deadline: null,
    qualification: "Test and employer-specific eligibility.",
    location: "India",
    officialUrl: "https://www.myamcat.com/",
    note: "Private assessment platform. Verify current fees and hiring-program terms before registering."
  }
];

function qualificationLevel(text: string): GovernmentOpportunity["qualificationLevel"] {
  const value = text.toLowerCase();
  if (/\b(10th|12th|matric|school)\b/.test(value)) return "school";
  if (/\biti\b/.test(value)) return "iti";
  if (/\bdiploma\b/.test(value)) return "diploma";
  if (/\b(postgraduate|master|m\.tech|m\.sc|mba)\b/.test(value)) return "postgraduate";
  if (/\b(phd|ph\.d|doctorate)\b/.test(value)) return "phd";
  if (/\b(engineering degree|bachelor|graduate|degree)\b/.test(value)) return "undergraduate";
  return "any";
}

export const GOVERNMENT_OPPORTUNITIES: GovernmentOpportunity[] = REVIEWED_GOVERNMENT_OPPORTUNITIES.map((item) => ({
  kind: item.deadline ? "vacancy" : ["Higher Studies", "Private Exam", "Teaching"].includes(item.category) ? "exam" : "directory",
  vacancies: "Not stated in the indexed record",
  ageLimit: "See the official notification",
  verifiedAt: "2026-10-05",
  corrections: [],
  qualificationLevel: qualificationLevel(item.qualification),
  ...item
}));

export function governmentStatus(item: GovernmentOpportunity, now = Date.now()): "closed" | "open" | "verify" | "directory" {
  if (item.kind === "directory") return "directory";
  if (item.deadline && Date.parse(item.deadline) < now) return "closed";
  const recentlyReviewed = item.verifiedAt && now - Date.parse(item.verifiedAt) < 14 * 86_400_000;
  return item.deadline && recentlyReviewed ? "open" : "verify";
}
