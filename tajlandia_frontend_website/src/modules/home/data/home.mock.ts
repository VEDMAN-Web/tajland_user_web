import { routes } from "@/lib/constants/routes";
import type { HomePageContent } from "../types/home.types";

export const homePageContent: HomePageContent = {
  hero: {
    title: "Claim your little",
    titleContinue: "piece of",
    titleAccent: "Thailand.",
    subtitle:
      "Explore Thailand through an interactive map, choose your plots and create your own digital collection. Secure your digital legacy today.",
    cta: {
      label: "Explore the Map →",
      href: routes.explore,
    },
    image: {
      src: "/images/home/hero.jpg",
      alt: "Thai temples under a clear blue sky",
      width: 1920,
      height: 1080,
    },
  },
  features: {
    heading: "What would you like to do?",
    subtitle:
      "It's your piece of Thailand. A unique blend of digital artistry and collectible ownership.",
    items: [
      {
        id: "explore",
        title: "Explore Map",
        description:
          "Engage with a beautifully crafted, responsive digital twin of Thailand's geography.",
        href: routes.explore,
        featured: false,
        icon: "pointer",
        order: 1,
        isActive: true,
      },
      {
        id: "purchases",
        title: "My Purchases",
        description:
          "Own a mathematically unique digital asset, verified and immortalized.",
        href: routes.login,
        featured: false,
        icon: "bag",
        order: 2,
        isActive: true,
      },
      {
        id: "gift",
        title: "Gift a Plot",
        description:
          "Gift a piece of your Thailand collection to someone special and make it a memorable experience.",
        href: routes.contact,
        featured: false,
        icon: "gift",
        order: 3,
        isActive: true,
      },
    ],
  },
  world: {
    alt: "Earth from space with a glowing blue atmosphere",
    playerUrl: "tajlandia.com",
    image: {
      src: "/images/home/earth.jpg",
      alt: "Earth from space with a glowing blue atmosphere",
      width: 1920,
      height: 1080,
    },
  },
  map: {
    headingBefore: "A new way to experience",
    headingAccent: "Thailand",
    headingAfter: "",
    pins: [
      { id: "chiang-mai", label: "Chiang Mai", x: 214, y: 96 },
      { id: "bangkok", label: "Bangkok", x: 236, y: 310 },
      { id: "pattaya", label: "Pattaya", x: 300, y: 360 },
      { id: "phuket", label: "Phuket", x: 176, y: 620 },
    ],
    cta: {
      label: "Explore Map",
      href: routes.explore,
    },
  },
  howItWorks: {
    heading: "How it Works",
    steps: [
      {
        id: "discover",
        title: "Discover the map",
        description:
          "Start with a national view of Thailand and find the regions that interest you.",
        icon: "discover",
        order: 1,
        isActive: true,
      },
      {
        id: "explore",
        title: "Explore destinations",
        description:
          "Open a destination to understand lifestyle, access, and nearby opportunities.",
        icon: "explore",
        order: 2,
        isActive: true,
      },
      {
        id: "connect",
        title: "Talk to the team",
        description: "Share what you are looking for and get a clear, human response.",
        icon: "connect",
        order: 3,
        isActive: true,
      },
      {
        id: "secure",
        title: "Secure your piece",
        description:
          "Move forward with the right land, project, or next step at your own pace.",
        icon: "secure",
        order: 4,
        isActive: true,
      },
    ],
  },
  testimonials: {
    eyebrow: "See why",
    headingBefore: "Something worth",
    headingAccent: "trusting",
    items: [
      {
        id: "amelia",
        quote:
          "The map made Thailand feel understandable. I could compare regions without bouncing between ten different sites.",
        name: "Amelia Hart",
        role: "Lifestyle buyer, UK",
        image: {
          src: "/images/home/testimonial.jpg",
          alt: "Amelia Hart with her partner in Thailand",
          width: 1600,
          height: 1200,
        },
        order: 1,
        isActive: true,
      },
    ],
    rating: {
      label: "Highly rated",
      score: "4.9",
      detail: "Based on early explorer feedback",
    },
  },
  cta: {
    title: "Your piece of Thailand",
    subtitle: "The future is waiting.",
    cta: {
      label: "Explore",
      href: routes.explore,
    },
    image: {
      src: "/images/home/cta.jpg",
      alt: "Bangkok skyline at dusk along the river",
      width: 1920,
      height: 1080,
    },
  },
};
