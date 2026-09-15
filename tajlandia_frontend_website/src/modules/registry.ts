export const marketingModules = ["home", "explore-map", "blog", "contact"] as const;
export const authModules = ["login", "signup", "forgot-password", "otp", "reset-password", "auth"] as const;

export type MarketingModuleName = (typeof marketingModules)[number];
export type AuthModuleName = (typeof authModules)[number];
