import "server-only";

import { homePageContent } from "../data/home.mock";
import { homePageContentSchema } from "../schemas/home-content.schema";
import type { HomePageContent } from "../types/home.types";

function byOrder<T extends { order: number }>(left: T, right: T) {
  return left.order - right.order;
}

export function parseHomePageContent(input: unknown): HomePageContent {
  const parsed = homePageContentSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Home content failed validation");
  }

  return parsed.data;
}

export function toHomePageViewModel(content: HomePageContent): HomePageContent {
  return {
    ...content,
    features: {
      ...content.features,
      items: content.features.items.filter((item) => item.isActive).sort(byOrder),
    },
    howItWorks: {
      ...content.howItWorks,
      steps: content.howItWorks.steps.filter((step) => step.isActive).sort(byOrder),
    },
    testimonials: {
      ...content.testimonials,
      items: content.testimonials.items.filter((item) => item.isActive).sort(byOrder),
    },
  };
}

export async function getHomePageContent(): Promise<HomePageContent> {
  // Today this reads validated mock data. When the admin API exists, replace
  // `homePageContent` with `apiGet("/home", homePageContentSchema)` only.
  return toHomePageViewModel(parseHomePageContent(homePageContent));
}
