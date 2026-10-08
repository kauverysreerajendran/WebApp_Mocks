/** Category shortcuts shown on the home page. Slugs match backend/app/seed_data.py. */
export const CATEGORY_LINKS = [
  { label: "Blouse Stitching", slug: "blouse-stitching" },
  { label: "Kurti / Kurta", slug: "kurti-kurta" },
  { label: "Saree Services", slug: "saree-services" },
  { label: "Men’s Wear", slug: "mens-wear" },
  { label: "Alterations & Repairs", slug: "alterations" },
] as const;

/**
 * Home "Popular Services" from the client brief, shown if the catalogue API can't be reached
 * so the section never disappears. Live prices from the API take precedence.
 */
export const POPULAR_FALLBACK = [
  {
    slug: "blouse-stitching",
    title: "Designer Blouse",
    description: "Made-to-measure blouses with the neckline, sleeves and back you choose.",
    startingPrice: 499,
  },
  {
    slug: "kurti-kurta",
    title: "Kurti Stitching",
    description: "Everyday and festive kurtis tailored to your fit and style.",
    startingPrice: 699,
  },
  {
    slug: "alterations",
    title: "Alterations",
    description: "Fitting fixes, hemming and resizing for clothes you already own.",
    startingPrice: 49,
  },
] as const;
