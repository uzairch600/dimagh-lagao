import Link from "next/link";
import { ArrowLeft, Brain, CircleDot, FlaskConical, Globe, Landmark, Zap } from "lucide-react";
import { SITE } from "@/lib/site";

const CATS = [
  { icon: Landmark, name: "Pakistan GK", color: "#2ff0b0" },
  { icon: CircleDot, name: "Cricket", color: "#ff6b85" },
  { icon: Globe, name: "Duniya GK", color: "#5fd3ff" },
  { icon: FlaskConical, name: "Science", color: "#b79bff" },
  { icon: Zap, name: "Math Speed", color: "#ffd36e" },
];

// Shown at /play while the game server isn't deployed yet.
export default function ComingSoon() {
  return (
    <main className="app no-nav">
      <section className="screen center-col coming-soon">
        <div className="logo-mark">
          <Brain size={48} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">Launching soon</p>
        <h1>
          Game jald <span className="gold">live</span> ho rahi hai
        </h1>
        <p className="muted">
          {SITE.name} ki 1v1 quiz battles payment setup mukammal hote hi shuru ho jayengi. Tab tak dekhiye kaise khelna hai
          aur kaunsi categories hongi.
        </p>
        <div className="cs-cats">
          {CATS.map(({ icon: Icon, name, color }) => (
            <span key={name} className="cs-cat">
              <span className="cat-icon" style={{ color, background: `${color}1f`, borderColor: `${color}40` }}>
                <Icon size={20} />
              </span>
              {name}
            </span>
          ))}
        </div>
        <div className="btn-row">
          <Link href="/how-to-play" className="btn btn-gold">
            Kaise khelein?
          </Link>
          <Link href="/" className="btn btn-ghost">
            <ArrowLeft size={18} /> Website
          </Link>
        </div>
        <p className="fine">
          Sawal? <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </section>
    </main>
  );
}
