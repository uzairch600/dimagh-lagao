export default function PageHero({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <section className="page-hero">
      <div className="site-container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="page-hero-sub">{sub}</p>}
      </div>
    </section>
  );
}
