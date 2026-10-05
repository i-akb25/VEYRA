export type EmployerDirectoryEntry = {
  name: string;
  careersUrl: string;
  regions: string[];
  industries: string[];
  reviewedAt: string;
};

const reviewedAt = "2026-10-05";
const group = (regions: string[], industries: string[], entries: Array<[string, string]>): EmployerDirectoryEntry[] =>
  entries.map(([name, careersUrl]) => ({ name, careersUrl, regions, industries, reviewedAt }));

export const employerDirectory: EmployerDirectoryEntry[] = [
  ...group(["India", "Global"], ["Technology", "Consulting"], [
    ["TCS", "https://www.tcs.com/careers"], ["Infosys", "https://www.infosys.com/careers/"], ["Wipro", "https://careers.wipro.com/"], ["HCLTech", "https://www.hcltech.com/careers"],
    ["Tech Mahindra", "https://careers.techmahindra.com/"], ["LTIMindtree", "https://www.ltimindtree.com/careers/"], ["Cognizant", "https://careers.cognizant.com/global-en/"], ["Accenture", "https://www.accenture.com/in-en/careers"],
    ["Capgemini", "https://www.capgemini.com/in-en/careers/"], ["IBM", "https://www.ibm.com/careers"], ["Deloitte India", "https://www.deloitte.com/in/en/careers.html"], ["EY India", "https://www.ey.com/en_in/careers"],
    ["KPMG India", "https://kpmg.com/in/en/home/careers.html"], ["PwC India", "https://www.pwc.in/careers.html"], ["Persistent Systems", "https://www.persistent.com/careers/"], ["Mphasis", "https://careers.mphasis.com/"]
  ]),
  ...group(["India", "Global"], ["Technology", "Product"], [
    ["Google", "https://www.google.com/about/careers/applications/jobs/results/"], ["Microsoft", "https://jobs.careers.microsoft.com/global/en/search"], ["Amazon", "https://www.amazon.jobs/en/search"], ["Apple", "https://jobs.apple.com/en-in/search"],
    ["Adobe", "https://careers.adobe.com/us/en"], ["Salesforce", "https://careers.salesforce.com/en/jobs/"], ["Oracle", "https://www.oracle.com/careers/"], ["SAP", "https://jobs.sap.com/"],
    ["Zoho", "https://www.zoho.com/careers/"], ["Freshworks", "https://www.freshworks.com/company/careers/"], ["Razorpay", "https://razorpay.com/jobs/"], ["PhonePe", "https://www.phonepe.com/careers/"],
    ["Paytm", "https://paytm.com/careers/"], ["Flipkart", "https://www.flipkartcareers.com/"], ["Meesho", "https://www.meesho.io/jobs"], ["Swiggy", "https://careers.swiggy.com/"],
    ["Zomato", "https://www.zomato.com/careers"], ["MakeMyTrip", "https://careers.makemytrip.com/"], ["OYO", "https://www.oyorooms.com/careers/"], ["Dream11", "https://about.dream11.in/careers/"]
  ]),
  ...group(["India"], ["Manufacturing", "Electrical", "Automation", "Energy", "Construction"], [
    ["Reliance Industries", "https://careers.ril.com/"], ["Jio", "https://careers.jio.com/"], ["Tata Motors", "https://careers.tatamotors.com/"], ["Tata Steel", "https://www.tatasteel.com/careers/"],
    ["Tata Power", "https://www.tatapower.com/careers"], ["Larsen & Toubro", "https://www.larsentoubro.com/corporate/careers/"], ["Siemens India", "https://www.siemens.com/in/en/company/jobs.html"], ["Schneider Electric India", "https://www.se.com/in/en/about-us/careers/"],
    ["ABB India", "https://careers.abb/global/en"], ["Bosch India", "https://www.bosch.in/careers/"], ["Honeywell India", "https://careers.honeywell.com/"], ["Hitachi Energy", "https://www.hitachienergy.com/in/en/careers"],
    ["GE Vernova", "https://careers.gevernova.com/"], ["Mahindra", "https://www.mahindra.com/careers"], ["Maruti Suzuki", "https://www.marutisuzuki.com/corporate/careers"], ["Hyundai India", "https://www.hyundai.com/in/en/hyundai-story/career"],
    ["JSW", "https://www.jsw.in/careers"], ["Adani", "https://careers.adani.com/"], ["Vedanta", "https://www.vedantalimited.com/eng/work-at-vedanta.php"], ["Ola Electric", "https://www.olaelectric.com/careers"]
  ]),
  ...group(["India"], ["Banking", "Finance", "Insurance"], [
    ["State Bank of India", "https://sbi.co.in/web/careers"], ["ICICI Bank", "https://www.icicicareers.com/"], ["HDFC Bank", "https://www.hdfcbank.com/personal/about-us/careers"], ["Axis Bank", "https://www.axisbank.com/careers"],
    ["Kotak Mahindra Bank", "https://www.kotak.com/en/about-us/careers.html"], ["Bajaj Finserv", "https://www.bajajfinserv.in/careers"], ["HDFC Life", "https://www.hdfclife.com/hdfc-careers"], ["LIC", "https://licindia.in/careers"]
  ]),
  ...group(["India"], ["Healthcare", "Pharmaceuticals"], [
    ["Apollo Hospitals", "https://www.apollohospitals.com/careers"], ["Fortis Healthcare", "https://www.fortishealthcare.com/careers"], ["Dr. Reddy's Laboratories", "https://careers.drreddys.com/"], ["Sun Pharma", "https://sunpharma.com/careers/"],
    ["Cipla", "https://www.cipla.com/careers"], ["Biocon", "https://www.biocon.com/careers/"], ["Lupin", "https://www.lupin.com/careers/"], ["Max Healthcare", "https://www.maxhealthcare.in/careers"]
  ]),
  ...group(["India"], ["Retail", "Consumer", "Hospitality", "Education"], [
    ["Hindustan Unilever", "https://careers.unilever.com/india"], ["P&G India", "https://www.pgcareers.com/"], ["ITC", "https://www.itcportal.com/careers/"], ["Nestlé India", "https://www.nestle.in/jobs"],
    ["Tata Consumer Products", "https://careers.tataconsumer.com/"], ["Asian Paints", "https://www.asianpaints.com/more/careers.html"], ["Indian Hotels Company", "https://careers.tajhotels.com/"], ["Teach For India", "https://www.teachforindia.org/work-with-us"],
    ["Unacademy", "https://unacademy.com/careers"], ["Physics Wallah", "https://www.pw.live/life"], ["upGrad", "https://www.upgrad.com/careers/"], ["Vedantu", "https://www.vedantu.com/careers"]
  ]),
  ...group(["Global"], ["Technology", "Product"], [
    ["Meta", "https://www.metacareers.com/jobs/"], ["Netflix", "https://explore.jobs.netflix.net/careers"], ["Airbnb", "https://careers.airbnb.com/positions/"], ["Uber", "https://www.uber.com/us/en/careers/list/"],
    ["Stripe", "https://stripe.com/jobs/search"], ["NVIDIA", "https://www.nvidia.com/en-us/about-nvidia/careers/"], ["Intel", "https://jobs.intel.com/"], ["AMD", "https://careers.amd.com/"],
    ["Cisco", "https://jobs.cisco.com/"], ["Dell Technologies", "https://jobs.dell.com/"], ["Atlassian", "https://www.atlassian.com/company/careers/all-jobs"], ["Canva", "https://www.lifeatcanva.com/en/jobs/"],
    ["Spotify", "https://www.lifeatspotify.com/jobs"], ["Shopify", "https://www.shopify.com/careers"], ["GitHub", "https://www.github.careers/careers-home/jobs"], ["GitLab", "https://about.gitlab.com/jobs/"],
    ["Cloudflare", "https://www.cloudflare.com/careers/jobs/"], ["Datadog", "https://careers.datadoghq.com/"], ["MongoDB", "https://www.mongodb.com/careers/jobs"], ["Notion", "https://www.notion.so/careers"],
    ["OpenAI", "https://openai.com/careers/search/"], ["Anthropic", "https://www.anthropic.com/careers/jobs"], ["Figma", "https://www.figma.com/careers/"], ["Reddit", "https://www.redditinc.com/careers"]
  ]),
  ...group(["Global"], ["Manufacturing", "Energy", "Mobility", "Construction"], [
    ["Tesla", "https://www.tesla.com/careers/search/"], ["SpaceX", "https://www.spacex.com/careers/jobs/"], ["Boeing", "https://jobs.boeing.com/"], ["Airbus", "https://www.airbus.com/en/careers/search-and-apply"],
    ["Siemens", "https://jobs.siemens.com/careers"], ["Schneider Electric", "https://www.se.com/ww/en/about-us/careers/"], ["ABB", "https://careers.abb/global/en"], ["Bosch", "https://www.bosch.com/careers/"],
    ["Honeywell", "https://careers.honeywell.com/"], ["Johnson Controls", "https://jobs.johnsoncontrols.com/"], ["Shell", "https://www.shell.com/careers.html"], ["BP", "https://www.bp.com/en/global/corporate/careers.html"],
    ["ExxonMobil", "https://jobs.exxonmobil.com/"], ["Equinor", "https://www.equinor.com/careers"], ["AECOM", "https://aecom.jobs/"], ["Jacobs", "https://careers.jacobs.com/"]
  ]),
  ...group(["Global"], ["Finance", "Banking", "Payments"], [
    ["JPMorgan Chase", "https://careers.jpmorgan.com/"], ["Goldman Sachs", "https://www.goldmansachs.com/careers"], ["Morgan Stanley", "https://www.morganstanley.com/people-opportunities"], ["HSBC", "https://www.hsbc.com/careers"],
    ["Barclays", "https://search.jobs.barclays/"], ["Standard Chartered", "https://www.sc.com/en/global-careers/"], ["Citi", "https://jobs.citi.com/"], ["Visa", "https://jobs.smartrecruiters.com/Visa"],
    ["Mastercard", "https://careers.mastercard.com/us/en"], ["American Express", "https://www.americanexpress.com/en-us/careers/"], ["PayPal", "https://careers.pypl.com/"], ["Wise", "https://www.wise.jobs/"]
  ]),
  ...group(["Global"], ["Healthcare", "Science", "Pharmaceuticals"], [
    ["Pfizer", "https://www.pfizer.com/about/careers"], ["Roche", "https://careers.roche.com/global/en"], ["Novartis", "https://www.novartis.com/careers/career-search"], ["AstraZeneca", "https://careers.astrazeneca.com/"],
    ["Sanofi", "https://jobs.sanofi.com/"], ["GSK", "https://jobs.gsk.com/"], ["Johnson & Johnson", "https://www.careers.jnj.com/"], ["NHS Jobs", "https://www.jobs.nhs.uk/candidate/search"]
  ]),
  ...group(["Global"], ["Retail", "Consumer", "Hospitality"], [
    ["Walmart", "https://careers.walmart.com/"], ["IKEA", "https://jobs.ikea.com/"], ["Unilever", "https://careers.unilever.com/"], ["Nestlé", "https://www.nestle.com/jobs"],
    ["Marriott", "https://careers.marriott.com/"], ["Accor", "https://careers.accor.com/global/en"], ["Hilton", "https://jobs.hilton.com/"], ["Nike", "https://careers.nike.com/"]
  ]),
  ...group(["Global"], ["Public Interest", "International Organisations"], [
    ["United Nations", "https://careers.un.org/"], ["UNICEF", "https://jobs.unicef.org/"], ["World Bank", "https://www.worldbank.org/en/about/careers"], ["WHO", "https://www.who.int/careers"],
    ["Asian Development Bank", "https://www.adb.org/work-with-us/careers"], ["OECD", "https://www.oecd.org/careers/"], ["International Labour Organization", "https://jobs.ilo.org/"], ["CERN", "https://careers.cern/"]
  ])
];
