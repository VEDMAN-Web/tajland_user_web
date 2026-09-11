export const marketingModules = ["home", "explore-map", "blog", "contact"] as const;

export type MarketingModuleName = (typeof marketingModules)[number];
