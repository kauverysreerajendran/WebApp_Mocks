/** Single source of truth for paths — no string literals for routes in components. */
export const routes = {
  home: "/",
  services: "/services",
  howItWorks: "/how-it-works",
  about: "/about",
  contact: "/contact",
  book: "/book",
  bookService: (slug: string) => `/book?service=${encodeURIComponent(slug)}`,
  confirmation: (id: number) => `/book/confirmed/${id}`,
  /** Login is a popup over the home page (SiteHeader reads `?login=`), never a screen of its own. */
  login: "/?login=customer",
  loginNext: (next: string) => `/?login=customer&next=${encodeURIComponent(next)}`,
  account: "/account",
  accountOrder: (id: number) => `/account/orders/${id}`,
  track: "/track",
  /** Prefills the order number only — the phone is never put in the URL. */
  trackOrder: (id: number) => `/track?order=${id}`,

  tailor: {
    root: "/tailor",
    login: "/?login=tailor",
    register: "/tailor#register",
    onboarding: "/tailor/onboarding",
    status: "/tailor/status",
    dashboard: "/tailor/dashboard",
    orders: "/tailor/orders",
    order: (id: number) => `/tailor/orders/${id}`,
    orderStatus: (id: number) => `/tailor/orders/${id}/status`,
    completed: "/tailor/completed",
    availability: "/tailor/availability",
    pricing: "/tailor/pricing",
    wallet: "/tailor/wallet",
    profile: "/tailor/profile",
  },

  admin: {
    root: "/admin",
    login: "/admin/login",
    orders: "/admin/orders",
    assignVendor: "/admin/assign-vendor",
    assignExecutive: "/admin/assign-executive",
    updateStatus: "/admin/update-status",
    payments: "/admin/payments",
    verification: "/admin/verification",
    executives: "/admin/executives",
  },
} as const;
