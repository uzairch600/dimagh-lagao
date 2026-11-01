import { ArrowRight, Brain, Zap } from "lucide-react";
import type { Category, Config } from "@/lib/types";
import CategoryIcon from "../CategoryIcon";
import PuzzleSection from "./PuzzleSection";

type Props = { config: Config; onPick: (c: Category) => void };

const BLURB: Record<string, string> = {
  world: "Pakistan aur duniya",
  cricket: "Records aur legends",
  science: "Jism, space, tech",
  math: "Sab se tez hisaab",
  it: "Computer aur internet",
  ai: "Robots aur machine learning",
  entertainment: "Films, dramas, music",
};

function Card({ c, onPick }: { c: Category; onPick: (c: Category) => void }) {
  return (
    <button className="cat2" onClick={() => onPick(c)}>
      <CategoryIcon id={c.id} name={c.name} className="cat2-art" />
      <span className="cat2-body">
        <b>{c.name}</b>
        <small>{BLURB[c.id] ?? ""}</small>
      </span>
      <span className="cat2-go">
        Khelein <ArrowRight size={14} />
      </span>
    </button>
  );
}

// "Khelein": two sections — Quiz (questions) and Puzzles (boards both players race to solve).
export default function Play({ config, onPick }: Props) {
  const quiz = config.categories.filter((c) => c.group !== "puzzle");
  const puzzles = config.categories.filter((c) => c.group === "puzzle");
  return (
    <section className="screen">
      <div className="pz-banner quiz-banner card">
        <div className="pz-banner-copy">
          <span className="tag">LIVE 1v1</span>
          <h2>
            <Brain size={26} /> Quiz
          </h2>
          <p>
            Asli player ke saath live muqabla — dono ko same 10 sawal. <b>Jo sahi aur sab se tez, wohi jeete.</b>{" "}
            {quiz.length} categories.
          </p>
          <span className="pz-banner-chip">
            <Zap size={14} /> 10 second har sawal
          </span>
        </div>
        <div className="pz-banner-art qz-art" aria-hidden="true">
          <img src="/images/cat-cricket.webp" alt="" width={480} height={480} />
          <img src="/images/cat-world.webp" alt="" width={480} height={480} />
        </div>
      </div>
      <div className="cat-grid2">
        {quiz.map((c) => (
          <Card key={c.id} c={c} onPick={onPick} />
        ))}
      </div>

      <PuzzleSection puzzles={puzzles} seconds={config.puzzleSeconds} onPick={onPick} />
    </section>
  );
}
