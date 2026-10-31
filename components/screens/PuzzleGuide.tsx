import type { PuzzleKind } from "@/lib/types";
import PuzzleDemo from "../puzzles/PuzzleDemo";

// How a puzzle works, shown on the rules screen before a puzzle match: a played-out example and a practice board.
export default function PuzzleGuide({ kind }: { kind: PuzzleKind }) {
  return (
    <div className="puzzle-guide">
      <p className="guide-label">Kaise khelein</p>
      <PuzzleDemo kind={kind} compact />
    </div>
  );
}
