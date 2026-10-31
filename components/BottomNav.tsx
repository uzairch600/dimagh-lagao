import Link from "next/link";
import { ArrowLeft, House, Trophy, User, Wallet, type LucideIcon } from "lucide-react";
import type { Screen } from "@/lib/types";

const ITEMS: { id: Screen; icon: LucideIcon; label: string }[] = [
  { id: "home", icon: House, label: "Home" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "leaderboard", icon: Trophy, label: "Top" },
  { id: "profile", icon: User, label: "Profile" },
];

// Bottom tab bar on phones; turns into a left sidebar on desktop (see globals.css).
export default function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      <Link href="/" className="nav-brand">
        <img className="site-logo-mark" src="/images/app-icon.webp" alt="" width={40} height={40} />
        <span>
          Dimagh <b>Lagao</b>
        </span>
      </Link>
      {ITEMS.map(({ id, icon: Icon, label }) => (
        <button key={id} className={screen === id ? "active" : ""} onClick={() => go(id)}>
          <span className="nav-icon">
            <Icon size={22} strokeWidth={screen === id ? 2.4 : 1.8} />
          </span>
          {label}
        </button>
      ))}
      <Link href="/" className="nav-site-link">
        <ArrowLeft size={16} /> Website par wapas
      </Link>
    </nav>
  );
}
