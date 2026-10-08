/**
 * Editorial photography. Brand images live in /public/media (cut from the design mock —
 * swap for full-resolution shoots); a few secondary placeholders are hotlinked from Unsplash.
 * Every page reads from here.
 */
const unsplash = (id: string) => `https://images.unsplash.com/${id}`;
const local = (name: string) => `/media/${name}.jpg`;

export interface MediaImage {
  src: string;
  alt: string;
}

export const media = {
  hero: { src: "/media/hero-studio-v2.webp", alt: "Tailoring studio with folded silks, a sewing machine and design sketches" },
  fabric: { src: local("fabric"), alt: "Rolls of pink silk with a measuring tape" },
  tape: { src: local("tape"), alt: "Measuring tape on pink fabric" },
  stitching: { src: local("stitching"), alt: "Hands hand-stitching pink fabric" },
  orderBlouse: { src: local("order-blouse"), alt: "Pink designer blouse" },
  orderKurti: { src: local("order-kurti"), alt: "Blue embroidered kurti" },
  customDesign: { src: "/media/svc-custom.webp", alt: "Design sketches with fabric swatches" },
  workshop: { src: unsplash("photo-1780504863009-5fad6e8e91f8"), alt: "Tailor at work in a busy workshop" },
  craft: { src: unsplash("photo-1517840545241-b491010a8af4"), alt: "Fabric being stitched on a sewing machine" },
  tailorSidebar: { src: "/media/tailor-sidebar.webp", alt: "" },
  tailorBanner: { src: "/media/tailor-dash-banner.webp", alt: "" },
  tailorLogin: { src: "/media/tailor-login.webp", alt: "Folded embroidered silks, measuring tape and gold scissors on a marble table" },
  howStudio: { src: "/media/how-studio.webp", alt: "Sewing machine with thread spools and a pincushion in a sunlit studio" },
  howFabric: { src: "/media/how-fabric.webp", alt: "Folded embroidered silks with a measuring tape and gold scissors" },
  aboutBanner: { src: "/media/about-banner.webp", alt: "Sewing machine, thread spools and silks on a sunlit studio table" },
  aboutFabric: { src: "/media/about-fabric.webp", alt: "Stack of embroidered silks with flowers and gold scissors" },
  aboutThreads: { src: "/media/about-threads.webp", alt: "Thread spools on a page of outfit sketches" },
  aboutEmbroidery: { src: "/media/about-embroidery.webp", alt: "Close-up of floral embroidery on rose silk" },
  careTailors: { src: "/media/care-tailors.webp", alt: "Tailor hand-stitching embroidery" },
  careTracking: { src: "/media/care-tracking.webp", alt: "Measuring tape over an order notebook" },
  careDelivery: { src: "/media/care-delivery.webp", alt: "Gift-wrapped parcel tied with a silk ribbon" },
  contactBanner: { src: "/media/contact-banner.webp", alt: "Gold scissors resting on pink embroidered fabric" },
  contactSide: { src: "/media/contact-side.webp", alt: "Thread spools, measuring tape and a pincushion" },
  hands: { src: unsplash("photo-1745847655362-fc86d76584b2"), alt: "Hands guiding fabric through a sewing machine" },
  measure: { src: unsplash("photo-1523901839036-a3030662f220"), alt: "Measuring tape close-up" },
  tools: { src: unsplash("photo-1536867520774-5b4f2628a69b"), alt: "Tape measure and tailoring scissors" },
  rack: { src: unsplash("photo-1633655442432-620aa55d7ac1"), alt: "Finished garments on a rack" },
  tailorPortrait: { src: unsplash("photo-1755076348454-7c1424c111de"), alt: "Tailor working with a vintage sewing machine" },
} satisfies Record<string, MediaImage>;

/** One HD image per service slug (backend/app/seed_data.py): booking tiles, catalogue and order thumbnails. */
const hd = (name: string) => `/media/${name}.webp`;
export const serviceMedia: Record<string, MediaImage> = {
  "blouse-stitching": { src: hd("svc-blouse"), alt: "Folded embroidered silk blouses with a thread spool" },
  "kurti-kurta": { src: hd("svc-kurti"), alt: "Embroidered kurtis hanging on a rail" },
  "mens-wear": { src: hd("svc-mens"), alt: "Folded cream bandhgala and kurtas for men" },
  "saree-services": { src: hd("svc-saree"), alt: "Stack of silk sarees with a zari border" },
  alterations: { src: hd("svc-alterations"), alt: "Scissors, thread spools and measuring tape on fabric" },
};

/** A second HD set per service, so Explore Services and Popular Services don't repeat the tile photos. */
export const serviceAltMedia: Record<string, MediaImage> = {
  "blouse-stitching": { src: hd("about-embroidery"), alt: "Close-up of floral embroidery on rose silk" },
  "kurti-kurta": { src: hd("alt-kurti-sketch"), alt: "Kurta design sketches with a measuring tape" },
  "mens-wear": { src: hd("svc-mens"), alt: "Folded cream bandhgala and kurtas for men" },
  "saree-services": { src: hd("about-fabric"), alt: "Stack of embroidered silks with flowers and gold scissors" },
  alterations: { src: hd("contact-banner"), alt: "Gold scissors resting on pink embroidered fabric" },
  custom: { src: hd("about-threads"), alt: "Thread spools on a page of outfit sketches" },
};

/** Portrait (≈4:5) art for the home "Our Services" tiles, keyed by service slug plus "custom". */
const tile = (name: string) => `/media/svc-${name}.webp`;
export const serviceTileMedia: Record<string, MediaImage> = {
  "blouse-stitching": { src: tile("blouse"), alt: "Folded embroidered silk blouses with a thread spool" },
  "kurti-kurta": { src: tile("kurti"), alt: "Embroidered kurtis hanging on a rail" },
  "saree-services": { src: tile("saree"), alt: "Stack of silk sarees with a zari border" },
  "mens-wear": { src: tile("mens"), alt: "Folded cream bandhgala and kurtas for men" },
  alterations: { src: tile("alterations"), alt: "Scissors, thread spools and measuring tape on fabric" },
  custom: { src: tile("custom"), alt: "Design sketches with fabric swatches" },
};

export const fallbackMedia = media.craft;
