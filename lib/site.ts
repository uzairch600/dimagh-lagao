// Business details shown across the website. Update these before going live.
export const SITE = {
  name: "Dimagh Lagao",
  domain: "dimaghlagao.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dimaghlagao.com",
  tagline: "Dimagh lagao, champion bano",
  whatsapp: "", // e.g. "+92 300 0000000" — leave empty to hide
  city: "Pakistan",
  minAge: 18,
  updated: "1 November 2026",
};

// The game and live data need the Node server (server.js). On static hosting such as Vercel,
// set NEXT_PUBLIC_GAME_LIVE=false so the site shows "coming soon" instead of broken screens.
export const GAME_LIVE = process.env.NEXT_PUBLIC_GAME_LIVE !== "false";

export const NAV = [
  { href: "/how-to-play", label: "Kaise khelein" },
  { href: "/winners", label: "Winners" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/fair-play", label: "Fair play" },
  { href: "/faq", label: "FAQ" },
];

export const FOOTER = [
  {
    title: "Game",
    links: [
      { href: "/play", label: "Abhi khelein" },
      { href: "/how-to-play", label: "Kaise khelein" },
      { href: "/winners", label: "Winners" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Hamare baare mein" },
      { href: "/contact", label: "Rabta karein" },
      { href: "/faq", label: "FAQ" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/fair-play", label: "Fair Play" },
    ],
  },
];

export const PAGES = [
  { href: "/", label: "Home" },
  ...FOOTER.flatMap((g) => g.links).filter((l) => l.href !== "/play"),
];
