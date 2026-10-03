// Demo content for the plot detail panel (Figma "Added to cart / rei calc").
// Every plot opens this for now; replace with `GET /explore/plots/{plotId}`.
export const plotDetailMock = {
  plotNumber: "PH-1024",
  tier: "ICON",
  name: "Seaview Ridge Plot",
  location: "Phuket City, Phuket",
  zoneLabel: "Icon Zone 03",
  coordinatesLabel: "7°53'17.4\"N 98°23'51.2\"E",
  imageUrl: "/images/explore/phuket.jpg",
  status: "AVAILABLE",
  sizeRai: 25,
  sizeSqm: 40_000,
  pricePerRai: 0.1,
  zoneType: "Standard",
  nearBy: "Kathu",
  totalInvestment: 2.5,
  currency: "USD",
  // Cart progress toward the minimum purchase.
  cartRai: 25,
  minimumRai: 100,
};

export type PlotDetail = typeof plotDetailMock;
