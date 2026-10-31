/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  env: {
    // Vercel (and other static hosts) can't run server.js, so the game shows "coming soon" there
    // unless NEXT_PUBLIC_GAME_LIVE is set explicitly.
    NEXT_PUBLIC_GAME_LIVE: process.env.NEXT_PUBLIC_GAME_LIVE ?? (process.env.VERCEL ? "false" : "true"),
  },
};

export default nextConfig;
