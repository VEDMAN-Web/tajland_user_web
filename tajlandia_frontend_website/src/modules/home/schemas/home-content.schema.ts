import { z } from "zod";
import { routes } from "@/lib/constants/routes";

const appRouteSchema = z.enum([
  routes.home,
  routes.explore,
  routes.blog,
  routes.contact,
  routes.login,
  routes.signup,
  routes.privacy,
  routes.terms,
]);

const ctaSchema = z.object({
  label: z.string().min(1),
  href: appRouteSchema,
});

const mediaAssetSchema = z.object({
  src: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("/images/"), {
      message: "Home media must be a same-origin /images path",
    }),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const featureIconSchema = z.enum(["pointer", "bag", "gift"]);
const howItWorksIconSchema = z.enum(["discover", "explore", "connect", "secure"]);

export const homePageContentSchema = z.object({
  hero: z.object({
    title: z.string().min(1),
    titleContinue: z.string().optional(),
    titleAccent: z.string().min(1),
    subtitle: z.string().optional(),
    cta: ctaSchema.optional(),
    image: mediaAssetSchema.optional(),
  }),
  features: z.object({
    heading: z.string().min(1),
    subtitle: z.string().optional(),
    items: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        href: appRouteSchema,
        featured: z.boolean(),
        icon: featureIconSchema,
        image: mediaAssetSchema.optional(),
        order: z.number().int(),
        isActive: z.boolean(),
      }),
    ),
  }),
  world: z.object({
    image: mediaAssetSchema.optional(),
    video: z
      .object({
        src: z
          .string()
          .min(1)
          .refine(
            (value) =>
              value.startsWith("/videos/") || value.startsWith("/images/"),
            {
              message: "Home video must be a same-origin /videos or /images path",
            },
          ),
        poster: mediaAssetSchema.optional(),
      })
      .optional(),
    playerUrl: z.string().min(1).optional(),
    alt: z.string().min(1),
  }),
  map: z.object({
    headingBefore: z.string().min(1),
    headingAccent: z.string().min(1),
    headingAfter: z.string(),
    description: z.string().optional(),
    cta: ctaSchema.optional(),
    pins: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        x: z.number(),
        y: z.number(),
      }),
    ),
  }),
  howItWorks: z.object({
    heading: z.string().min(1),
    steps: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        icon: howItWorksIconSchema,
        order: z.number().int(),
        isActive: z.boolean(),
      }),
    ),
  }),
  testimonials: z.object({
    eyebrow: z.string().optional(),
    headingBefore: z.string().min(1),
    headingAccent: z.string().min(1),
    items: z.array(
      z.object({
        id: z.string().min(1),
        quote: z.string().min(1),
        name: z.string().min(1),
        role: z.string().min(1),
        image: mediaAssetSchema.optional(),
        order: z.number().int(),
        isActive: z.boolean(),
      }),
    ),
    rating: z
      .object({
        label: z.string().min(1),
        score: z.string().min(1),
        detail: z.string().min(1),
      })
      .optional(),
  }),
  cta: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    cta: ctaSchema.optional(),
    image: mediaAssetSchema.optional(),
  }),
});

export type HomePageContent = z.infer<typeof homePageContentSchema>;
export type HomeCta = z.infer<typeof ctaSchema>;
export type HomeMediaAsset = z.infer<typeof mediaAssetSchema>;
export type HomeFeatureCard = HomePageContent["features"]["items"][number];
export type HomeHowItWorksStep = HomePageContent["howItWorks"]["steps"][number];
export type HomeTestimonial = HomePageContent["testimonials"]["items"][number];
