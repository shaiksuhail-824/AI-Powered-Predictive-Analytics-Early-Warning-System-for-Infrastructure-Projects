export interface Sector {
  id: string;
  name: string;
  image: string;
  description: string;
  projectsTracked: string;
  investment: string;
}

export const sectorsData: Sector[] = [
  {
    id: "transport-logistics",
    name: "Transport & Logistics",
    image: "/sectors/transport-logistics.svg",
    description: "Highways, railways, ports, airports and multimodal connectivity for faster and safer movement.",
    projectsTracked: "~620",
    investment: "~₹16.8 Lakh Cr"
  },
  {
    id: "energy",
    name: "Energy",
    image: "/sectors/energy.svg",
    description: "Power generation, transmission, renewable energy and grid infrastructure for a sustainable future.",
    projectsTracked: "~298",
    investment: "~₹8.9 Lakh Cr"
  },
  {
    id: "water-sanitation",
    name: "Water & Sanitation",
    image: "/sectors/water-sanitation.svg",
    description: "Drinking water, wastewater management, irrigation and clean water for healthier communities.",
    projectsTracked: "~245",
    investment: "~₹6.7 Lakh Cr"
  },
  {
    id: "communication",
    name: "Communication",
    image: "/sectors/communication.svg",
    description: "Telecom, broadband, digital infrastructure and connectivity for a digitally empowered India.",
    projectsTracked: "~188",
    investment: "~₹5.2 Lakh Cr"
  },
  {
    id: "social-infrastructure",
    name: "Social Infrastructure",
    image: "/sectors/social-infrastructure.svg",
    description: "Education, healthcare, housing, urban development and other public services for inclusive growth.",
    projectsTracked: "~267",
    investment: "~₹7.4 Lakh Cr"
  },
  {
    id: "coal",
    name: "Coal",
    image: "/sectors/coal.svg",
    description: "Coal production, evacuation and related infrastructure for energy security.",
    projectsTracked: "~94",
    investment: "~₹3.1 Lakh Cr"
  },
  {
    id: "steel",
    name: "Steel",
    image: "/sectors/steel.svg",
    description: "Steel plants, raw material supply and supporting infrastructure for industrial growth.",
    projectsTracked: "~76",
    investment: "~₹2.8 Lakh Cr"
  },
  {
    id: "mining",
    name: "Mining",
    image: "/sectors/mining.svg",
    description: "Critical minerals, mineral processing and value chain infrastructure for a self-reliant India.",
    projectsTracked: "~62",
    investment: "~₹2.1 Lakh Cr"
  },
  {
    id: "urban-rural-development",
    name: "Urban & Rural Development",
    image: "/sectors/urban-rural-development.svg",
    description: "Smart cities, rural infrastructure, public buildings and local area development for better living standards.",
    projectsTracked: "~140",
    investment: "~₹4.9 Lakh Cr"
  },
  {
    id: "others",
    name: "Others",
    image: "/sectors/others.svg",
    description: "Includes agriculture, tourism, ports (non-major), industrial parks and other strategic sectors.",
    projectsTracked: "~49",
    investment: "~₹1.7 Lakh Cr"
  }
];
