import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import { SITE } from "@/lib/site";

const CATS = [
  { id: "world", name: "World GK" },
  { id: "cricket", name: "Cricket" },
  { id: "science", name: "Science" },
  { id: "math", name: "Math Speed" },
  { id: "it", name: "IT & Computers" },
  { id: "ai", name: "AI" },
  { id: "entertainment", name: "Entertainment" },
];

// Shown at /play while the game server isn't deployed yet.
export default function ComingSoon() {
  return (
    <main className="app no-nav">
      <section className="screen center-col coming-soon">
        <img className="cs-art" src="/images/coming-soon.webp" alt="" width={260} height={260} />
        <p className="eyebrow">Launching soon</p>
        <h1>
          Game jald <span className="gold">live</span> ho rahi hai
        </h1>
        <p className="muted">
          {SITE.name} ki 1v1 quiz battles payment setup mukammal hote hi shuru ho jayengi. Tab tak dekhiye kaise khelna hai
          aur kaunsi categories hongi.
        </p>
        <div className="cs-cats">
          {CATS.map(({ id, name }) => (
            <span key={id} className="cs-cat">
              <CategoryIcon id={id} />
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
