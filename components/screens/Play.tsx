import { ArrowRight, Brain, Puzzle as PuzzleIcon, Swords } from "lucide-react";
import type { Category, Config } from "@/lib/types";
import CategoryIcon from "../CategoryIcon";
import CrownsBoard from "../puzzles/CrownsBoard";
import PathBoard from "../puzzles/PathBoard";
import SunMoonBoard from "../puzzles/SunMoonBoard";

type Props = { config: Config; onPick: (c: Category) => void };

const BLURB: Record<string, string> = {
  world: "Pakistan aur duniya",
  cricket: "Records aur legends",
  science: "Jism, space, tech",
  math: "Sab se tez hisaab",
  it: "Computer aur internet",
  ai: "Robots aur machine learning",
  entertainment: "Films, dramas, music",
  crowns: "Har row, column aur rang mein ek taaj",
  sunmoon: "Suraj aur chaand ka sahi jor",
  path: "1, 2, 3… jorein, har khana bharein",
  maze: "Rocket ko jhande tak pohanchayein",
};

// A small solved board as the card picture for each puzzle.
const PUZZLE_ART: Record<string, React.ReactNode> = {
  crowns: <CrownsBoard n={4} regions={[0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 1, 2, 2, 3, 3]} marks={[0, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 2, 0]} />,
  sunmoon: <SunMoonBoard n={4} givens={new Array(16).fill(-1)} hints={[]} values={[0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0]} />,
  path: <PathBoard n={3} numbers={[[0, 1], [2, 2], [8, 3]]} path={[0, 1, 2, 5, 4, 3, 6, 7, 8]} />,
  maze: <PathBoard n={4} open={[1, 1, 1, 2, 3, 1, 1, 0, 3, 1, 1, 0, 1, 1, 1, 0]} start={0} end={15} path={[0, 1, 2, 3, 7, 6, 5, 4, 8, 12, 13, 14, 15]} />,
};

function Card({ c, onPick }: { c: Category; onPick: (c: Category) => void }) {
  return (
    <button className="cat2" onClick={() => onPick(c)}>
      {c.group === "puzzle" ? (
        <span className="cat2-art pz-art" aria-hidden="true">{PUZZLE_ART[c.id]}</span>
      ) : (
        <CategoryIcon id={c.id} name={c.name} className="cat2-art" />
      )}
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
      <div className="section-head play-head">
        <h2 className="page-title">
          <Brain size={22} /> Quiz
        </h2>
        <span className="muted small">{quiz.length} categories</span>
      </div>
      <div className="cat-grid2">
        {quiz.map((c) => (
          <Card key={c.id} c={c} onPick={onPick} />
        ))}
      </div>

      <div className="pz-banner card">
        <div className="pz-banner-copy">
          <span className="tag">NAYA</span>
          <h2>
            <PuzzleIcon size={26} /> Puzzles
          </h2>
          <p>
            Dono players ko bilkul same puzzle milta hai. <b>Jo pehle hal kare, wohi aage.</b> 3 puzzles, chhote se bade.
          </p>
          <span className="pz-banner-chip">
            <Swords size={14} /> Live 1v1 race
          </span>
        </div>
        <div className="pz-banner-art" aria-hidden="true">
          {PUZZLE_ART.crowns}
          {PUZZLE_ART.sunmoon}
        </div>
      </div>
      <div className="cat-grid2">
        {puzzles.map((c) => (
          <Card key={c.id} c={c} onPick={onPick} />
        ))}
      </div>
    </section>
  );
}
