import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FOOTER, SITE } from "@/lib/site";
import { Logo } from "./SiteHeader";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Pakistan ka 1v1 skill quiz game. Sahi aur tez jawab do, muqabla jeeto.</p>
          </div>
          {FOOTER.map((g) => (
            <div key={g.title} className="footer-col">
              <h4>{g.title}</h4>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p className="footer-note">
            <ShieldCheck size={16} /> Sirf {SITE.minAge}+ saal ke players ke liye. Ye skill game hai — nateeja aap ke ilm aur
            raftar par hai. Zimmedari se khelein.
          </p>
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
