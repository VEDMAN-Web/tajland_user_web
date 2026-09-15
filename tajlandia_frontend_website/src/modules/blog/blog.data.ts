export type BlogSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  description: string;
  image: string;
  alt: string;
  sections: readonly BlogSection[];
  relatedSlugs: readonly string[];
};

export const blogPosts: readonly BlogPost[] = [
  {
    slug: "most-beautiful-places-in-thailand",
    title: "Discover the Most Beautiful Places in Thailand",
    category: "Destinations",
    date: "Sep 03, 2026",
    author: "Tajlandia.pl",
    description: "Thailand is a country of quiet temples, lively streets, tropical coastlines, and landscapes that reward you for taking the slower road. Discover the places that make every region feel distinct.",
    image: "/images/blog/blog-01.jpg",
    alt: "Beautiful temple grounds in Thailand",
    sections: [
      { heading: "A country made for discovery", paragraphs: ["Thailand brings together an unusual variety of experiences in one journey. You can begin the morning among ornate temple roofs, spend the afternoon beside a river, and finish the day with local food in a neighbourhood market.", "The most memorable places are often the ones that leave room for curiosity. Look beyond the best-known landmarks and you will find communities, viewpoints, and small rituals that reveal the character of a region."] },
      { heading: "Start with a sense of place", paragraphs: ["Bangkok gives you energy and contrast, while Chiang Mai offers a gentler rhythm shaped by mountains, craft, and centuries-old traditions. In the south, islands and coastal towns add a completely different pace to the same country.", "Wherever you go, allow time to walk without a strict itinerary. The details between destinations are often where Thailand becomes most personal."] },
      { heading: "Make the journey your own", paragraphs: ["A meaningful collection of places does not need to follow a checklist. Choose the landscapes, streets, and moments that resonate with your own story, then let each visit become a reason to return."] },
    ],
    relatedSlugs: ["your-journey-through-thailand-starts-here", "thailand-beyond-the-tourist-trail"],
  },
  {
    slug: "owning-your-piece-of-thailand",
    title: "A Guide to Owning Your Piece of Thailand",
    category: "Tajlandia Guide",
    date: "Aug 27, 2026",
    author: "Tajlandia.pl",
    description: "Understanding how Tajlandia works, from discovering a location to selecting and collecting your own piece of Thailand.",
    image: "/images/blog/blog-02.jpg",
    alt: "Bangkok street at night",
    sections: [
      { heading: "Begin with exploration", paragraphs: ["Every Tajlandia journey begins on the map. Explore regions at your own pace and learn what makes each location special before choosing the place that feels right for you.", "The map is designed to make discovery feel open and inviting. Follow a coastline, compare cities, or simply choose a place because its story caught your attention."] },
      { heading: "Choose a meaningful place", paragraphs: ["Collecting a place is about creating a connection with Thailand. Consider the landscapes you return to in your memories, the culture you want to understand better, or the destination you hope to visit next.", "Your selection can be personal, shared as a gift, or kept as a reminder of a journey that matters to you."] },
      { heading: "Keep the story with you", paragraphs: ["Once you have chosen your place, your certificate becomes a simple way to mark that connection. It is a piece of your Thailand story, ready to revisit whenever you want to plan the next chapter."] },
    ],
    relatedSlugs: ["the-art-of-collecting-places", "most-beautiful-places-in-thailand"],
  },
  {
    slug: "why-phuket-captivates-the-world",
    title: "Why Phuket Continues to Captivate the World",
    category: "Destinations",
    date: "Sep 03, 2026",
    author: "Tajlandia.pl",
    description: "Phuket is more than turquoise water and beautiful beaches. From quiet coastal landscapes and vibrant local communities to world-famous destinations, the island brings together many different sides of Thailand in one place. Whether you are visiting for the first time or returning again, Phuket has a way of making familiar places feel new.",
    image: "/images/blog/blog-03.jpg",
    alt: "Mountain temple at sunset",
    sections: [
      { heading: "More than a beach destination", paragraphs: ["Phuket’s appeal begins with its coastline, but it does not end there. The island moves naturally between lively waterfronts, quiet viewpoints, historic streets, and neighbourhoods where daily life continues away from the crowds.", "That contrast gives Phuket a sense of scale. One day can include a sunrise by the sea, a long lunch in the old town, and a late afternoon looking across the hills."] },
      { heading: "The rhythm of the coast", paragraphs: ["The best coastal experiences are rarely rushed. Find a quieter stretch of shore, watch the light change across the water, and make space for the small details that turn a visit into a memory.", "Local food, longtail boats, and the changing colours of the Andaman Sea all add layers to the island’s story."] },
      { heading: "A place worth returning to", paragraphs: ["Phuket rewards repeat visits because the island changes with the season, the time of day, and the route you take through it. Its familiar landmarks become starting points for discovering something new."] },
    ],
    relatedSlugs: ["your-journey-through-thailand-starts-here", "most-beautiful-places-in-thailand"],
  },
  {
    slug: "thailand-beyond-the-tourist-trail",
    title: "Thailand Beyond the Tourist Trail",
    category: "Slow Travel",
    date: "Aug 20, 2026",
    author: "Tajlandia.pl",
    description: "Discover lesser-known places, local experiences, and unique corners of Thailand worth exploring.",
    image: "/images/blog/blog-04.jpg",
    alt: "Buddha statue in Thailand",
    sections: [
      { heading: "Leave room for the unexpected", paragraphs: ["Thailand’s famous sights deserve their place, but some of the strongest memories come from turning down a smaller road or staying one more day in a place you did not plan to visit.", "A local market, a family-run café, or a temple outside the main route can offer a more intimate understanding of the area around you."] },
      { heading: "Travel with attention", paragraphs: ["Slow travel is less about seeing fewer things and more about noticing more of them. Learn a few local phrases, take time to observe everyday routines, and let the people of a place guide your experience.", "These choices help travel feel more respectful, more comfortable, and more connected to the communities that make Thailand special."] },
      { heading: "The reward of going further", paragraphs: ["Beyond the tourist trail, Thailand feels wonderfully varied. Each quiet stop adds another layer to your understanding of the country and gives you a story that could not have been found on a standard itinerary."] },
    ],
    relatedSlugs: ["most-beautiful-places-in-thailand", "the-art-of-collecting-places"],
  },
  {
    slug: "the-art-of-collecting-places",
    title: "The Art of Collecting Places",
    category: "Tajlandia Guide",
    date: "Aug 13, 2026",
    author: "Tajlandia.pl",
    description: "Explore a new way of experiencing Thailand through meaningful places, memories, and digital ownership.",
    image: "/images/blog/blog-05.jpg",
    alt: "Forest lake in Thailand",
    sections: [
      { heading: "Why places stay with us", paragraphs: ["Some destinations stay in your mind because of a view. Others remain because of a conversation, a meal, or the feeling of being exactly where you needed to be.", "Collecting places gives those memories a shape. It allows a map to become personal rather than simply geographical."] },
      { heading: "A collection with meaning", paragraphs: ["A meaningful collection does not need to be large. It can be a handful of places connected by a season of life, a shared journey, or a promise to return.", "Each selection becomes a small invitation to remember what drew you there in the first place."] },
      { heading: "From memory to next adventure", paragraphs: ["The best collections keep moving. Let the places you have chosen inspire your next route, introduce you to a new region, and make Thailand feel a little more familiar each time you visit."] },
    ],
    relatedSlugs: ["owning-your-piece-of-thailand", "thailand-beyond-the-tourist-trail"],
  },
  {
    slug: "your-journey-through-thailand-starts-here",
    title: "Your Journey Through Thailand Starts Here",
    category: "Travel Inspiration",
    date: "Aug 06, 2026",
    author: "Tajlandia.pl",
    description: "From Phuket to Chiang Mai, discover the regions, stories, and landscapes waiting to become part of your Tajlandia collection.",
    image: "/images/blog/blog-06.jpg",
    alt: "Tropical beach in Thailand",
    sections: [
      { heading: "There is no single way to see Thailand", paragraphs: ["Thailand can be a first adventure, a place to return to, or a collection of destinations gathered over many years. Each route reveals a different balance of food, landscape, culture, and everyday life.", "Start with the destination that feels most familiar, then allow your curiosity to take you somewhere new."] },
      { heading: "From the south to the north", paragraphs: ["The islands and beaches of the south offer bright water and open horizons. Further north, mountain air, historic towns, and craft traditions create a quieter but equally rich rhythm.", "Between them are cities, rivers, markets, and small communities that make the journey as important as the arrival."] },
      { heading: "Let your collection grow naturally", paragraphs: ["You do not need to plan the whole journey today. Choose one place, learn its story, and let that first choice become the beginning of a collection that feels uniquely yours."] },
    ],
    relatedSlugs: ["why-phuket-captivates-the-world", "most-beautiful-places-in-thailand"],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
