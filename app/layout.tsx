import type { Metadata, Viewport } from "next";
import { Poppins, Noto_Nastaliq_Urdu } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["500", "700"], variable: "--font-urdu" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — 1v1 quiz muqabla, inaam jeeto`, template: `%s | ${SITE.name}` },
  description:
    "Pakistan ka 1v1 skill quiz game. Asli players ke saath live muqabla karein — Pakistan GK, cricket, science, math — aur sahi aur tez jawab de kar inaam jeetein.",
  openGraph: {
    siteName: SITE.name,
    type: "website",
    locale: "en_PK",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.jpg"] },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Dimagh Lagao", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${urdu.variable}`}>
      <body>
        <div className="bg-orbs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {children}
      </body>
    </html>
  );
}
