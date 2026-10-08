import { media, serviceMedia, type MediaImage } from "@/config/media";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Garment photo for an order thumbnail, picked from the service name. */
export function orderThumbImage(serviceName: string): MediaImage {
  const name = serviceName.toLowerCase();
  const image = name.includes("blouse")
    ? media.orderBlouse
    : name.includes("kurt")
      ? media.orderKurti
      : (serviceMedia[slugify(serviceName)] ?? media.orderBlouse);
  return { ...image, alt: serviceName };
}
