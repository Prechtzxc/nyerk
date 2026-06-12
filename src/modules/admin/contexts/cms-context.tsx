"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { DEFAULT_POLICY_CONTENT, POLICY_LABELS, ALL_POLICY_KEYS, type PolicyKey } from "@/src/modules/shared/lib/policies"

export type PastEvent = {
  id: string
  title: string
  clientName?: string
  description: string
  eventDate: string
  venueName: string
  image: string
  isFeatured?: boolean
  hasClientConsent?: boolean
  createdAt: string
  updatedAt?: string
}

export interface HomepageContent {
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  heroDescription?: string
  heroBadge?: string
  heroPrimaryCta?: string
  heroSecondaryCta?: string
  aboutTitle?: string
  aboutDescription?: string
  aboutImage?: string
  aboutLabel?: string
  ctaText?: string
  ctaButtonText?: string
  ctaTitle?: string
  ctaDescription?: string
  ctaImage?: string
  galleryLabel?: string
  galleryTitle?: string
  gallerySubtitle?: string
  faqLabel?: string
  faqTitle?: string
  faqSubtitle?: string
}

export type FAQ = {
  id: string
  question: string
  answer: string
  isHidden?: boolean
  order?: number
  createdAt: string
  updatedAt?: string
}

export type PolicyType = PolicyKey

export type Policy = {
  id: string
  title: string
  content: string
  type: PolicyType
  isPublished: boolean
  createdAt: string
  updatedAt?: string
}

export interface CMSData {
  homepage: HomepageContent
  footer: {
    email: string
    phone: string
    address: string
    facebook: string
    brandName?: string
    footerDescription?: string
    copyrightText?: string
    instagram?: string
  }
  venues: any[]
  offices: any[]
  faqs: FAQ[]
  pastEvents: PastEvent[]
  policies: Policy[]
}

type CMSContextType = {
  cmsData: CMSData
  homepage: CMSData["homepage"]
  updateHomepage: (data: Partial<CMSData["homepage"]>) => void
  updateFooter: (data: Partial<CMSData["footer"]>) => void

  venues: CMSData["venues"]
  offices: CMSData["offices"]
  officeRoomsGround: any[]
  officeRoomsSecond: any[]
  updateVenue: (id: string, data: any) => void
  updateOffice: (id: string, data: any) => void
  addVenue: (data: any) => void
  deleteVenue: (id: string) => void
  addOffice: (data: any) => void
  deleteOffice: (id: string) => void
  updateOfficeRoom: (id: string, data: any) => void
  addOfficeRoom: (data: any) => void
  deleteOfficeRoom: (id: string) => void

  faqs: FAQ[]
  addFAQ: (data: Omit<FAQ, "id" | "createdAt" | "updatedAt">) => void
  updateFAQ: (id: string, data: Partial<FAQ>) => void
  deleteFAQ: (id: string) => void
  reorderFAQs: (orderedIds: string[]) => void

  policies: Policy[]
  addPolicy: (data: Omit<Policy, "id" | "createdAt" | "updatedAt">) => void
  updatePolicy: (id: string, data: Partial<Policy>) => void
  deletePolicy: (id: string) => void

  addPastEvent: (data: Omit<PastEvent, "id" | "createdAt" | "updatedAt">) => void
  updatePastEvent: (id: string, data: Partial<PastEvent>) => void
  deletePastEvent: (id: string) => void

  saveCMSData: (newData: CMSData) => void
}

const CMS_STORAGE_KEY = "oneestela_cms_data"
const CMS_UPDATED_EVENT = "oneestela_cms_updated"

const DEFAULT_FAQS: FAQ[] = [
  {
    id: "faq-1",
    question: "How long is the standard venue rental?",
    answer:
      "The standard venue rental is 6 hours. Setup, program, and cleanup should fit within the approved booking schedule.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "faq-2",
    question: "What is included in the venue rental?",
    answer:
      "One Estela Place focuses on venue space rental only. Clients may arrange their own decorations, catering, suppliers, and event services.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "faq-3",
    question: "Do you provide catering services?",
    answer:
      "No. Catering is not included. Clients may bring or coordinate with their preferred caterer based on venue guidelines.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "faq-4",
    question: "Can I visit the venue before booking?",
    answer:
      "Yes. Clients may schedule an ocular visit before finalizing their reservation.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "faq-5",
    question: "How does booking confirmation work?",
    answer:
      "A booking request will be reviewed first. Once approved and payment requirements are verified, the booking may be marked as confirmed.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const DEFAULT_POLICIES: Policy[] = ALL_POLICY_KEYS.map((key, i) => ({
  id: `policy-${i + 1}`,
  title: POLICY_LABELS[key],
  content: DEFAULT_POLICY_CONTENT[key],
  type: key,
  isPublished: true,
  createdAt: new Date().toISOString(),
}))

const defaultCMSData: CMSData = {
  homepage: {
    heroTitle: "Welcome to \nOne Estela Place",
    heroSubtitle:
      "The perfect venue for your special events, corporate gatherings, and everyday workspace needs.",
    heroImage: "/images/venue-interior.jpg",
    heroBadge: "Event Venue · San Pedro, Laguna",
    heroPrimaryCta: "Book Your Event",
    heroSecondaryCta: "Take a Tour",
    aboutTitle: "One Estela Place Event Venue",
    aboutDescription:
      "One Estela Place is an event venue in San Pedro, Laguna, established in 2018. It was created to provide a clean, comfortable, and elegant space for special occasions and gatherings.\n\nThe venue focuses on space rental, giving clients the freedom to arrange their own decorations, suppliers, catering, and event setup based on their preferred style.",
    aboutImage: "/images/venue-chandelier.png",
    aboutLabel: "Our Story",
    ctaTitle: "Ready to plan your next event?",
    ctaDescription:
      "Explore the venue through our virtual tour or send a booking request to start your reservation.",
    ctaButtonText: "Book Your Event",
    ctaText: "Take a Tour",
    galleryLabel: "Past Client Bookings",
    galleryTitle: "Real Events Hosted at One Estela Place",
    gallerySubtitle:
      "Actual client celebrations and gatherings held at our event venue, uploaded by the admin with client permission.",
    faqLabel: "Help Center",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle:
      "Find answers to common questions about booking at One Estela Place.",
  },
  footer: {
    email: "inquiries@oneestelaplace.com",
    phone: "+63 917 123 4567",
    address: "Carmona, Calabarzon, Philippines",
    facebook: "https://facebook.com/oneestelaplace",
    brandName: "One Estela Place",
    footerDescription:
      "Creating unforgettable moments for your special events. The perfect place for weddings, birthdays, and corporate gatherings.",
    copyrightText: "One Estela Place. All rights reserved.",
    instagram: "#",
  },
  venues: [
    {
      id: "v1",
      name: "The Milestone Event",
      capacity: "80–100 pax",
      price: 15000,
      type: "venue",
      image: "/images/venue-chandelier.png",
      panoImage: "",
      description: "Premium space for grand celebrations and corporate events.",
    },
    {
      id: "v2",
      name: "The Moment Event",
      capacity: "30–50 pax",
      price: 10000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "",
      description: "Intimate setting perfect for memorable milestones.",
    },
    {
      id: "v3",
      name: "Conference Room",
      capacity: "4–10 pax",
      price: 3000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "",
      description: "Professional environment equipped for critical decisions.",
    },
    {
      id: "v4",
      name: "Business Room",
      capacity: "10–15 pax",
      price: 5000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "",
      description: "Spacious meeting area ideal for collaborations.",
    },
  ],
  offices: [
    {
      id: "office-a",
      name: "Office A",
      capacity: "1-4 pax per room",
      price: 15000,
      type: "office",
      image: "/images/venue-interior.jpg",
      panoImage: "",
      description: "Premium office wing with 8 individual private rooms.",
    },
    {
      id: "office-b",
      name: "Office B",
      capacity: "1-4 pax per room",
      price: 15000,
      type: "office",
      image: "/images/venue-interior.jpg",
      panoImage: "",
      description: "Executive office wing with 8 individual private rooms.",
    },
  ],
  faqs: DEFAULT_FAQS,
  pastEvents: [],
  policies: DEFAULT_POLICIES,
}

const defaultHomepage: CMSData["homepage"] = defaultCMSData.homepage

const defaultContextValue: CMSContextType = {
  cmsData: defaultCMSData,
  homepage: defaultHomepage,
  updateHomepage: () => {},
  updateFooter: () => {},

  venues: defaultCMSData.venues,
  offices: defaultCMSData.offices,
  officeRoomsGround: [],
  officeRoomsSecond: [],
  updateVenue: () => {},
  updateOffice: () => {},
  addVenue: () => {},
  deleteVenue: () => {},
  addOffice: () => {},
  deleteOffice: () => {},
  updateOfficeRoom: () => {},
  addOfficeRoom: () => {},
  deleteOfficeRoom: () => {},

  faqs: defaultCMSData.faqs,
  addFAQ: () => {},
  updateFAQ: () => {},
  deleteFAQ: () => {},
  reorderFAQs: () => {},

  policies: defaultCMSData.policies,
  addPolicy: () => {},
  updatePolicy: () => {},
  deletePolicy: () => {},

  addPastEvent: () => {},
  updatePastEvent: () => {},
  deletePastEvent: () => {},

  saveCMSData: () => {},
}

const CMSContext = createContext<CMSContextType>(defaultContextValue)

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizePastEvent(event: any): PastEvent {
  return {
    id: event?.id || createLocalId("past-client-booking"),
    title: event?.title || "",
    clientName: event?.clientName || "",
    description: event?.description || "",
    eventDate: event?.eventDate || "",
    venueName: event?.venueName || "One Estela Place",
    image: event?.image || "/placeholder.jpg",
    isFeatured: event?.isFeatured ?? true,
    hasClientConsent: event?.hasClientConsent === true,
    createdAt: event?.createdAt || new Date().toISOString(),
    updatedAt: event?.updatedAt,
  }
}

function normalizeCMSData(parsed: Partial<CMSData> | null): CMSData {
  if (!parsed) return defaultCMSData

  const parsedFaqs = Array.isArray(parsed.faqs) ? parsed.faqs : []

  const mergedFaqs =
    parsedFaqs.length >= DEFAULT_FAQS.length
      ? parsedFaqs
      : [
          ...parsedFaqs,
          ...DEFAULT_FAQS.filter(
            (defaultFaq) =>
              !parsedFaqs.some(
                (faq: any) =>
                  faq.id === defaultFaq.id ||
                  faq.question?.trim()?.toLowerCase() ===
                    defaultFaq.question.trim().toLowerCase()
              )
          ),
        ]

  return {
    ...defaultCMSData,
    ...parsed,
    homepage: {
      ...defaultCMSData.homepage,
      ...(parsed.homepage || {}),
    },
    footer: {
      ...defaultCMSData.footer,
      ...(parsed.footer || {}),
    },
    venues: Array.isArray(parsed.venues) ? parsed.venues : defaultCMSData.venues,
    offices: Array.isArray(parsed.offices) ? parsed.offices : defaultCMSData.offices,
    faqs: mergedFaqs,
    pastEvents: Array.isArray(parsed.pastEvents)
      ? parsed.pastEvents.map(normalizePastEvent)
      : defaultCMSData.pastEvents,
    policies: Array.isArray(parsed.policies) ? parsed.policies : defaultCMSData.policies,
  }
}

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const [cmsData, setCmsData] = useState<CMSData>(defaultCMSData)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadCMSData = () => {
      const stored = localStorage.getItem(CMS_STORAGE_KEY)

      if (!stored) {
        setCmsData(defaultCMSData)
        return
      }

      try {
        const parsed = JSON.parse(stored)
        setCmsData(normalizeCMSData(parsed))
      } catch (error) {
        console.error(error)
        setCmsData(defaultCMSData)
      }
    }

    loadCMSData()

    window.addEventListener("storage", loadCMSData)
    window.addEventListener(CMS_UPDATED_EVENT, loadCMSData)

    return () => {
      window.removeEventListener("storage", loadCMSData)
      window.removeEventListener(CMS_UPDATED_EVENT, loadCMSData)
    }
  }, [])

  const saveCMSData = (newData: CMSData) => {
    const normalizedData = normalizeCMSData(newData)

    setCmsData(normalizedData)

    if (typeof window !== "undefined") {
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(normalizedData))
      window.dispatchEvent(new Event(CMS_UPDATED_EVENT))
    }

    toast({
      title: "Content Saved",
      description: "Changes have been successfully published.",
      className: "bg-emerald-500 text-white border-none",
    })
  }

  const updateHomepage = (data: Partial<CMSData["homepage"]>) => {
    saveCMSData({
      ...cmsData,
      homepage: {
        ...cmsData.homepage,
        ...data,
      },
    })
  }

  const updateFooter = (data: Partial<CMSData["footer"]>) => {
    saveCMSData({
      ...cmsData,
      footer: {
        ...cmsData.footer,
        ...data,
      },
    })
  }

  const updateVenue = (id: string, data: any) => {
    const updatedVenues = cmsData.venues.map((venue) =>
      venue.id === id
        ? {
            ...venue,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : venue
    )

    saveCMSData({
      ...cmsData,
      venues: updatedVenues,
    })
  }

  const updateOffice = (id: string, data: any) => {
    const updatedOffices = cmsData.offices.map((office) =>
      office.id === id
        ? {
            ...office,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : office
    )

    saveCMSData({
      ...cmsData,
      offices: updatedOffices,
    })
  }

  const addVenue = (data: any) => {
    const newVenue = {
      id: data.id || createLocalId("venue"),
      type: "venue",
      createdAt: new Date().toISOString(),
      ...data,
    }

    saveCMSData({
      ...cmsData,
      venues: [...cmsData.venues, newVenue],
    })
  }

  const deleteVenue = (id: string) => {
    saveCMSData({
      ...cmsData,
      venues: cmsData.venues.filter((venue) => venue.id !== id),
    })
  }

  const addOffice = (data: any) => {
    const newOffice = {
      id: data.id || createLocalId("office"),
      type: "office",
      createdAt: new Date().toISOString(),
      ...data,
    }

    saveCMSData({
      ...cmsData,
      offices: [...cmsData.offices, newOffice],
    })
  }

  const deleteOffice = (id: string) => {
    saveCMSData({
      ...cmsData,
      offices: cmsData.offices.filter((office) => office.id !== id),
    })
  }

  const addPastEvent = (
    data: Omit<PastEvent, "id" | "createdAt" | "updatedAt">
  ) => {
    const newPastEvent: PastEvent = {
      id: createLocalId("past-client-booking"),
      title: data.title,
      clientName: data.clientName || "",
      description: data.description,
      eventDate: data.eventDate,
      venueName: data.venueName,
      image: data.image,
      isFeatured: data.isFeatured ?? true,
      hasClientConsent: data.hasClientConsent === true,
      createdAt: new Date().toISOString(),
    }

    saveCMSData({
      ...cmsData,
      pastEvents: [newPastEvent, ...cmsData.pastEvents],
    })
  }

  const updatePastEvent = (id: string, data: Partial<PastEvent>) => {
    const updatedPastEvents = cmsData.pastEvents.map((event) =>
      event.id === id
        ? {
            ...event,
            ...data,
            hasClientConsent: data.hasClientConsent ?? event.hasClientConsent ?? false,
            updatedAt: new Date().toISOString(),
          }
        : event
    )

    saveCMSData({
      ...cmsData,
      pastEvents: updatedPastEvents,
    })
  }

  const deletePastEvent = (id: string) => {
    saveCMSData({
      ...cmsData,
      pastEvents: cmsData.pastEvents.filter((event) => event.id !== id),
    })
  }

  const addFAQ = (
    data: Omit<FAQ, "id" | "createdAt" | "updatedAt">
  ) => {
    const newFAQ: FAQ = {
      id: createLocalId("faq"),
      question: data.question,
      answer: data.answer,
      isHidden: data.isHidden ?? false,
      order: data.order ?? cmsData.faqs.length,
      createdAt: new Date().toISOString(),
    }
    saveCMSData({
      ...cmsData,
      faqs: [...cmsData.faqs, newFAQ],
    })
  }

  const updateFAQ = (id: string, data: Partial<FAQ>) => {
    saveCMSData({
      ...cmsData,
      faqs: cmsData.faqs.map((faq) =>
        faq.id === id ? { ...faq, ...data, updatedAt: new Date().toISOString() } : faq
      ),
    })
  }

  const deleteFAQ = (id: string) => {
    saveCMSData({
      ...cmsData,
      faqs: cmsData.faqs.filter((faq) => faq.id !== id),
    })
  }

  const reorderFAQs = (orderedIds: string[]) => {
    const reordered = orderedIds
      .map((id, index) => {
        const faq = cmsData.faqs.find((f) => f.id === id)
        return faq ? { ...faq, order: index } : null
      })
      .filter(Boolean) as FAQ[]
    saveCMSData({
      ...cmsData,
      faqs: reordered,
    })
  }

  const addPolicy = (
    data: Omit<Policy, "id" | "createdAt" | "updatedAt">
  ) => {
    const newPolicy: Policy = {
      id: createLocalId("policy"),
      title: data.title,
      content: data.content,
      type: data.type,
      isPublished: data.isPublished ?? true,
      createdAt: new Date().toISOString(),
    }
    saveCMSData({
      ...cmsData,
      policies: [...cmsData.policies, newPolicy],
    })
  }

  const updatePolicy = (id: string, data: Partial<Policy>) => {
    saveCMSData({
      ...cmsData,
      policies: cmsData.policies.map((policy) =>
        policy.id === id ? { ...policy, ...data, updatedAt: new Date().toISOString() } : policy
      ),
    })
  }

  const deletePolicy = (id: string) => {
    saveCMSData({
      ...cmsData,
      policies: cmsData.policies.filter((policy) => policy.id !== id),
    })
  }

  const updateOfficeRoom: CMSContextType["updateOfficeRoom"] = (id, data) => {
    saveCMSData({
      ...cmsData,
      offices: cmsData.offices.map((office) =>
        office.id === id
          ? {
              ...office,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : office
      ),
    })
  }

  const addOfficeRoom: CMSContextType["addOfficeRoom"] = (data) => {
    const newRoom = {
      id: data.id || createLocalId("office-room"),
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveCMSData({
      ...cmsData,
      offices: [...cmsData.offices, newRoom],
    })
  }

  const deleteOfficeRoom: CMSContextType["deleteOfficeRoom"] = (id) => {
    saveCMSData({
      ...cmsData,
      offices: cmsData.offices.filter((office) => office.id !== id),
    })
  }

  return (
    <CMSContext.Provider
      value={{
        cmsData,
        homepage: cmsData.homepage,
        updateHomepage,
        updateFooter,

        venues: cmsData.venues,
        offices: cmsData.offices,
        officeRoomsGround: cmsData.offices.filter((office: any) => office?.floor === "ground" || office?.floor === "Ground"),
        officeRoomsSecond: cmsData.offices.filter((office: any) => office?.floor === "second" || office?.floor === "Second"),
        updateVenue,
        updateOffice,
        addVenue,
        deleteVenue,
        addOffice,
        deleteOffice,
        updateOfficeRoom,
        addOfficeRoom,
        deleteOfficeRoom,

        faqs: cmsData.faqs,
        addFAQ,
        updateFAQ,
        deleteFAQ,
        reorderFAQs,

        policies: cmsData.policies,
        addPolicy,
        updatePolicy,
        deletePolicy,

        addPastEvent,
        updatePastEvent,
        deletePastEvent,

        saveCMSData,
      }}
    >
      {children}
    </CMSContext.Provider>
  )
}

export const useCMS = () => useContext(CMSContext)