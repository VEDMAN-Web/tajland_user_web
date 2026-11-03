import { routes } from "@/lib/constants/routes";

/**
 * One step of a guided tutorial. The tour finds the page element carrying
 * `data-tour="<name>"`, lights it up and shows a tooltip beside it.
 */
export type TutorialStep = {
  /**
   * `data-tour` names. The first is the real target (clicking it moves on); the others are
   * helpers shown only while the first isn't visible (e.g. the phone's menu button, which
   * opens the drawer that holds the target).
   */
  target: string | string[];
  /** The step only shows on this page (path prefix); on another page the tour waits. */
  path?: string;
  title: string;
  body: string;
  /** "click": the user clicks the lit element. "next": a Next button. `when`: moves on by itself. */
  advance: "click" | "next" | { when: () => boolean };
  /** Runs when the step is reached; true skips it (the user already did it). */
  skipIf?: () => boolean;
  /**
   * The rest of the page stays usable (only dimmed a little), for steps where the user
   * works outside the lit element, e.g. picking a search result.
   */
  free?: boolean;
  /** Put the tooltip beside the lit element (not below it), when something opens under it. */
  tipBeside?: boolean;
  /** No Next button: the user has to press the lit element themselves. */
  manual?: boolean;
};

export type Tutorial = {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
};

const has = (name: string) => document.querySelector(`[data-tour="${name}"]`) !== null;
const onPage = (path: string) => window.location.pathname.startsWith(path);

export const TUTORIALS: Tutorial[] = [
  {
    id: "buy-plot",
    title: "How to buy a plot",
    description: "From finding a plot to checkout, with a guided tour of the real buttons.",
    steps: [
      {
        target: ["nav-explore", "nav-menu"],
        title: "Open Explore Map",
        body: "Click Explore Map to see the plots on the map.",
        advance: "click",
        skipIf: () => onPage(routes.dashboardExplore),
      },
      {
        target: "explore-search",
        path: routes.dashboardExplore,
        title: "Search a region, city or plot",
        body: "Type a region, city or plot number (for example Phuket or PH-0001) and pick it from the list.",
        advance: { when: () => has("plot-card") || has("plot-detail") },
        skipIf: () => has("plot-card") || has("plot-detail"),
        free: true,
        // The region list opens right under the search box, so the tooltip goes beside it.
        tipBeside: true,
      },
      {
        target: "plot-card",
        path: routes.dashboardExplore,
        title: "Pick a plot",
        body: "Click an available plot to see its details: price, size and photos.",
        advance: "click",
        skipIf: () => has("plot-detail"),
      },
      {
        target: "add-to-cart",
        path: routes.dashboardExplore,
        title: "Add it to your cart",
        body: "Press Add to Cart. The plot is held for you for 10 minutes.",
        advance: "click",
        // Already in the cart: the next step shows that instead.
        skipIf: () => has("in-cart-actions"),
      },
      {
        target: "in-cart-actions",
        path: routes.dashboardExplore,
        title: "Added to your cart",
        body: "This plot is held for you for 10 minutes. View Cart opens your cart, Remove takes it out again.",
        advance: "next",
      },
      {
        target: "cart-button",
        title: "Open your cart",
        body: "Your cart lists every plot you added. Click the cart button.",
        advance: "click",
        manual: true,
        skipIf: () => onPage(routes.cart),
      },
      {
        target: "cart-progress",
        path: routes.cart,
        title: "Reach {min} Rai",
        body: "You need at least {min} Rai in total to check out. Add more plots until the bar is full.",
        advance: "next",
      },
      {
        target: "checkout",
        path: routes.cart,
        title: "Proceed to checkout",
        body: "At {min} Rai this button turns on. Then you pay and your certificate is issued.",
        advance: "next",
      },
    ],
  },
];

export function getTutorial(id: string): Tutorial | undefined {
  return TUTORIALS.find((tutorial) => tutorial.id === id);
}
