export const PROFESSION_PAGES = [
  { slug: "part-time-jobs", title: "Part-time jobs", description: "Part-time opportunities for students, professionals and people returning to work.", search: "/?roles=custom&schedule=part-time&scope=any&workplaces=any&experience=any#search" },
  { slug: "fresher-jobs", title: "Fresher and graduate jobs", description: "Graduate trainee, apprentice, internship and entry-level opportunities.", search: "/?roles=get&scope=any&workplaces=any&experience=fresher#search" },
  { slug: "remote-jobs", title: "Remote jobs", description: "Worldwide and country-restricted remote opportunities from attributed public feeds.", search: "/?roles=custom&scope=any&workplaces=remote&experience=any#search" },
  { slug: "administration-jobs", title: "Administration jobs", description: "Office assistant, administrator, receptionist, back-office and executive-assistant roles.", search: "/?roles=administration&scope=any&workplaces=any&experience=any#search" },
  { slug: "healthcare-jobs", title: "Healthcare jobs", description: "Clinical, nursing, pharmacy, hospital operations and healthcare-support roles.", search: "/?roles=healthcare&industry=healthcare&scope=any&workplaces=any&experience=any#search" },
  { slug: "education-jobs", title: "Education jobs", description: "Teaching, tutoring, academic counselling, research and education-operations roles.", search: "/?roles=education&industry=education&scope=any&workplaces=any&experience=any#search" },
  { slug: "hospitality-jobs", title: "Hospitality jobs", description: "Hotel, guest services, front-office, restaurant and travel roles.", search: "/?roles=hospitality&industry=hospitality&scope=any&workplaces=any&experience=any#search" },
  { slug: "skilled-trade-jobs", title: "Skilled-trade jobs", description: "Technician, electrician, fitter, welder, mechanic and operator roles.", search: "/?roles=trades&scope=any&workplaces=onsite&experience=any#search" }
] as const;

export const LOCATION_PAGES = [
  { slug: "delhi-ncr", title: "Jobs in Delhi NCR", location: "Delhi NCR", description: "Search Delhi, New Delhi, Noida, Greater Noida, Gurugram, Faridabad and Ghaziabad together." },
  { slug: "lucknow", title: "Jobs in Lucknow", location: "Lucknow", description: "Search roles in Lucknow and its nearby employment area." },
  { slug: "patna", title: "Jobs in Patna", location: "Patna", description: "Search roles across Patna, Hajipur and Bihta." },
  { slug: "bengaluru", title: "Jobs in Bengaluru", location: "Bengaluru", description: "Search Bengaluru roles across technical and non-technical professions." },
  { slug: "mumbai", title: "Jobs in Mumbai", location: "Mumbai Metropolitan Region", description: "Search Mumbai, Navi Mumbai and Thane together." },
  { slug: "hyderabad", title: "Jobs in Hyderabad", location: "Hyderabad", description: "Search Hyderabad and Secunderabad roles." },
  { slug: "pune", title: "Jobs in Pune", location: "Pune", description: "Search Pune and Pimpri-Chinchwad roles." },
  { slug: "international", title: "International jobs", location: "", description: "Search onsite, hybrid and remote opportunities outside India with stated eligibility." }
] as const;

export const GOVERNMENT_PAGES = [
  { slug: "psu-recruitment", title: "PSU recruitment", category: "PSU", description: "Reviewed official recruitment pages for IOCL, ONGC, NTPC, BHEL, GAIL, SAIL, ISRO and other public-sector organisations." },
  { slug: "banking-jobs", title: "Banking recruitment", category: "Banking", description: "Official banking recruitment and examination notices." },
  { slug: "railway-jobs", title: "Railway recruitment", category: "Railway", description: "Official Railway Recruitment Board notices and centralised employment notices." },
  { slug: "teaching-jobs", title: "Government teaching opportunities", category: "Teaching", description: "Teacher eligibility and official teaching-recruitment destinations." },
  { slug: "apprenticeships", title: "Government apprenticeships", category: "Apprenticeship", description: "Official apprenticeship opportunities for ITI, diploma and graduate candidates." }
] as const;
