import { ArrowRight } from "lucide-react";
import type { Category, Config } from "@/lib/types";
import CategoryIcon from "../CategoryIcon";

type Props = { config: Config; onPick: (c: Category) => void };

const BLURB: Record<string, string> = {
  world: "Pakistan aur duniya",
  cricket: "Records aur legends",
  science: "Jism, space, tech",
  math: "Sab se tez hisaab",
  it: "Computer aur internet",
  ai: "Robots aur machine learning",
  entertainment: "Films, dramas, music",
  puzzle: "Janwar, ghar aur suragh — dimagh lagao",
};

// "Khelein": just the categories.
export default function Play({ config, onPick }: Props) {
  return (
    <section className="screen">
      <div className="section-head play-head">
        <h2 className="page-title">Categories</h2>
        <span className="muted small">{config.categories.length} maidan</span>
      </div>
      <div className="cat-grid2">
        {config.categories.map((c) => (
          <button key={c.id} className="cat2" onClick={() => onPick(c)}>
            <CategoryIcon id={c.id} name={c.name} className="cat2-art" />
            <span className="cat2-body">
              <b>{c.name}</b>
              <small>{BLURB[c.id] ?? ""}</small>
            </span>
            <span className="cat2-go">
              Khelein <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
