"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="site-logo" aria-label={SITE.name}>
      <img className="site-logo-mark" src="/images/app-icon.webp" alt="" width={40} height={40} />
      <span>
        Dimagh <b>Lagao</b>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Logo />
        <nav className={`site-nav ${open ? "open" : ""}`}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={path === n.href ? "active" : ""} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link href="/play" className="btn btn-primary site-cta-mobile" onClick={() => setOpen(false)}>
            Abhi khelein
          </Link>
        </nav>
        <div className="site-header-actions">
          <Link href="/play" className="btn btn-ghost site-login">
            Login
          </Link>
          <Link href="/play" className="btn btn-primary">
            Abhi khelein
          </Link>
          <button className="site-menu-btn" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
