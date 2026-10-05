export type LocationGroup = { id: string; label: string; state?: string; cities: string[]; tier?: 1 | 2 | 3 };

export const INDIA_LOCATION_GROUPS: LocationGroup[] = [
  { id: "delhi-ncr", label: "Delhi NCR", state: "Delhi / NCR", cities: ["Delhi", "New Delhi", "Noida", "Greater Noida", "Gurugram", "Gurgaon", "Faridabad", "Ghaziabad"], tier: 1 },
  { id: "mumbai-mmr", label: "Mumbai Metropolitan Region", state: "Maharashtra", cities: ["Mumbai", "Navi Mumbai", "Thane"], tier: 1 },
  { id: "bengaluru", label: "Bengaluru", state: "Karnataka", cities: ["Bengaluru", "Bangalore"], tier: 1 },
  { id: "hyderabad", label: "Hyderabad", state: "Telangana", cities: ["Hyderabad", "Secunderabad"], tier: 1 },
  { id: "pune", label: "Pune", state: "Maharashtra", cities: ["Pune", "Pimpri-Chinchwad"], tier: 1 },
  { id: "chennai", label: "Chennai", state: "Tamil Nadu", cities: ["Chennai", "Sriperumbudur"], tier: 1 },
  { id: "kolkata", label: "Kolkata", state: "West Bengal", cities: ["Kolkata", "Howrah", "Salt Lake"], tier: 1 },
  { id: "lucknow", label: "Lucknow", state: "Uttar Pradesh", cities: ["Lucknow", "Barabanki"], tier: 2 },
  { id: "patna", label: "Patna", state: "Bihar", cities: ["Patna", "Hajipur", "Bihta"], tier: 2 },
  { id: "jaipur", label: "Jaipur", state: "Rajasthan", cities: ["Jaipur"], tier: 2 },
  { id: "ahmedabad", label: "Ahmedabad", state: "Gujarat", cities: ["Ahmedabad", "Gandhinagar", "Sanand"], tier: 2 },
  { id: "vadodara", label: "Vadodara", state: "Gujarat", cities: ["Vadodara", "Baroda", "Anand"], tier: 2 },
  { id: "kochi", label: "Kochi", state: "Kerala", cities: ["Kochi", "Ernakulam"], tier: 2 },
  { id: "chandigarh", label: "Chandigarh Tricity", state: "Chandigarh / Punjab / Haryana", cities: ["Chandigarh", "Mohali", "Panchkula"], tier: 2 },
  { id: "indore", label: "Indore", state: "Madhya Pradesh", cities: ["Indore", "Pithampur"], tier: 2 },
  { id: "bhubaneswar", label: "Bhubaneswar", state: "Odisha", cities: ["Bhubaneswar", "Cuttack"], tier: 2 },
  { id: "coimbatore", label: "Coimbatore", state: "Tamil Nadu", cities: ["Coimbatore", "Tiruppur"], tier: 2 },
  { id: "dehradun", label: "Dehradun", state: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Rishikesh"], tier: 2 },
  { id: "ranchi", label: "Ranchi", state: "Jharkhand", cities: ["Ranchi"], tier: 2 },
  { id: "guwahati", label: "Guwahati", state: "Assam", cities: ["Guwahati"], tier: 2 },
  { id: "muzaffarpur", label: "Muzaffarpur", state: "Bihar", cities: ["Muzaffarpur", "Bettiah", "Motihari"], tier: 3 },
  { id: "kanpur", label: "Kanpur", state: "Uttar Pradesh", cities: ["Kanpur", "Unnao"], tier: 2 },
  { id: "varanasi", label: "Varanasi", state: "Uttar Pradesh", cities: ["Varanasi", "Banaras"], tier: 2 }
];

export const locationTerms = (value: string): string[] => {
  const wanted = value.toLowerCase().trim();
  const group = INDIA_LOCATION_GROUPS.find((item) => item.id === wanted || item.label.toLowerCase() === wanted || item.cities.some((city) => city.toLowerCase() === wanted));
  return group ? [...group.cities, group.state ?? ""].filter(Boolean).map((item) => item.toLowerCase()) : value.split(/[,;]/).map((item) => item.trim().toLowerCase()).filter(Boolean);
};
