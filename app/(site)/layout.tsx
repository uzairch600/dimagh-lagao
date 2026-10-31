import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import "./site.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
