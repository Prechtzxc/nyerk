const CMS_STORAGE_KEY = "oneestela_cms_data"

export type PublicSpace = {
  id: string
  name: string
  category: "venue" | "office"
  price: number
  capacity: string
  description: string
  image: string
  panoramaUrl: string
  type?: string
  panoImage?: string
}

export type PublicSpacesResult = {
  eventVenues: PublicSpace[]
  officeSpaces: PublicSpace[]
}

const DEFAULT_VENUES: PublicSpace[] = [
  {
    id: "v1", name: "The Milestone Event", category: "venue", price: 15000,
    capacity: "80–100 pax", description: "Premium space for grand celebrations and corporate events.",
    image: "/images/venue-chandelier.png", panoramaUrl: "", panoImage: "",
  },
  {
    id: "v2", name: "The Moment Event", category: "venue", price: 10000,
    capacity: "30–50 pax", description: "Intimate setting perfect for memorable milestones.",
    image: "/images/venue-interior.jpg", panoramaUrl: "", panoImage: "",
  },
  {
    id: "v3", name: "Conference Room", category: "venue", price: 3000,
    capacity: "4–10 pax", description: "Professional environment equipped for critical decisions.",
    image: "/images/venue-interior.jpg", panoramaUrl: "", panoImage: "",
  },
  {
    id: "v4", name: "Business Room", category: "venue", price: 5000,
    capacity: "10–15 pax", description: "Spacious meeting area ideal for collaborations.",
    image: "/images/venue-interior.jpg", panoramaUrl: "", panoImage: "",
  },
]

const DEFAULT_OFFICES: PublicSpace[] = [
  {
    id: "office-a", name: "Office A", category: "office", price: 15000,
    capacity: "1-4 pax per room", description: "Premium office wing with 8 individual private rooms.",
    image: "/images/venue-interior.jpg", panoramaUrl: "", panoImage: "",
  },
  {
    id: "office-b", name: "Office B", category: "office", price: 15000,
    capacity: "1-4 pax per room", description: "Executive office wing with 8 individual private rooms.",
    image: "/images/venue-interior.jpg", panoramaUrl: "", panoImage: "",
  },
]

function normalizeItem(item: any, category: "venue" | "office"): PublicSpace {
  return {
    id: String(item.id || ""),
    name: String(item.name || "Unnamed Space"),
    category,
    price: Number(item.price) || 0,
    capacity: String(item.capacity || ""),
    description: String(item.description || ""),
    image: String(item.image || ""),
    panoramaUrl: String(item.panoImage || item.panoramaUrl || item.panorama || ""),
    panoImage: String(item.panoImage || item.panoramaUrl || item.panorama || ""),
  }
}

export function getPublicSpacesFromData(cmsData: any): PublicSpacesResult {
  const rawVenues = Array.isArray(cmsData?.venues) ? cmsData.venues : []
  const rawOffices = Array.isArray(cmsData?.offices) ? cmsData.offices : []

  return {
    eventVenues: rawVenues.length > 0
      ? rawVenues.map((v: any) => normalizeItem(v, "venue"))
      : DEFAULT_VENUES,
    officeSpaces: rawOffices.length > 0
      ? rawOffices.map((o: any) => normalizeItem(o, "office"))
      : DEFAULT_OFFICES,
  }
}

export function getPublicSpaces(): PublicSpacesResult {
  if (typeof window === "undefined") {
    return { eventVenues: DEFAULT_VENUES, officeSpaces: DEFAULT_OFFICES }
  }

  try {
    const stored = localStorage.getItem(CMS_STORAGE_KEY)
    if (!stored) return { eventVenues: DEFAULT_VENUES, officeSpaces: DEFAULT_OFFICES }

    const parsed = JSON.parse(stored)
    return getPublicSpacesFromData(parsed)
  } catch {
    return { eventVenues: DEFAULT_VENUES, officeSpaces: DEFAULT_OFFICES }
  }
}

export function getPanoramaSource(space: PublicSpace | null | undefined): string {
  if (!space) return ""
  return space.panoramaUrl || space.image || ""
}
