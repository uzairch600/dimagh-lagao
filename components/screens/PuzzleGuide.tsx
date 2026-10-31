import type { Puzzle } from "@/lib/types";
import CrownsBoard from "../puzzles/CrownsBoard";
import PathBoard from "../puzzles/PathBoard";
import SunMoonBoard from "../puzzles/SunMoonBoard";

// How each puzzle works, with a small solved example. Shown on the rules screen before a puzzle match.
const GUIDES: Record<Puzzle["kind"], { rules: string[]; how: string; example: React.ReactNode }> = {
  crowns: {
    rules: [
      "Har row mein sirf ek taaj.",
      "Har column mein sirf ek taaj.",
      "Har rang ke hisse mein sirf ek taaj.",
      "Do taaj aapas mein nahi chhoo sakte — kone (diagonal) se bhi nahi.",
    ],
    how: "Khane par ek tap = ✕ (yahan taaj nahi ho sakta), doosra tap = taaj, teesra tap = khaali. Qawaid toote to khana laal ho jata hai.",
    example: (
      <CrownsBoard n={4} regions={[0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 1, 2, 2, 3, 3]} marks={[0, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 2, 0]} />
    ),
  },
  sunmoon: {
    rules: [
      "Har khane mein suraj ya chaand.",
      "Har row aur har column mein aadhe suraj, aadhe chaand.",
      "Ek line mein 3 suraj ya 3 chaand saath saath nahi.",
      "= ka matlab dono khane same, × ka matlab dono alag.",
    ],
    how: "Khaali khane par tap: suraj → chaand → khaali. Halke rang wale khane pehle se bhare hain, badle nahi ja sakte.",
    example: (
      <SunMoonBoard
        n={4}
        givens={new Array(16).fill(-1)}
        hints={[[0, 1, false], [5, 6, true]]}
        values={[0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0]}
      />
    ),
  },
  path: {
    rules: [
      "Raasta 1 se shuru ho kar aakhri number par khatam ho.",
      "Numbers tarteeb se aayein: 1, phir 2, phir 3…",
      "Har khane se raasta sirf ek dafa guzre — koi khana khaali na rahe.",
      "Raasta sirf upar, neeche, daayen, baayen chalta hai (tircha nahi).",
    ],
    how: "1 par ungli rakhein aur kheenchte jayein. Peechhe le jaane se raasta mit jata hai. Kisi purane khane par tap karein to raasta wahin tak reh jata hai.",
    example: <PathBoard n={3} numbers={[[0, 1], [2, 2], [8, 3]]} path={[0, 1, 2, 5, 4, 3, 6, 7, 8]} />,
  },
  maze: {
    rules: ["Rocket se shuru karein aur jhande tak pohanchein.", "Deewaron ke aar paar nahi ja sakte."],
    how: "Rocket se ungli kheenchte hue raasta banayein. Ghalat gali mein gaye to peechhe kheench lein.",
    example: (
      <PathBoard
        n={4}
        open={[1, 1, 1, 2, 3, 1, 1, 0, 3, 1, 1, 0, 1, 1, 1, 0]}
        start={0}
        end={15}
        path={[0, 1, 2, 3, 7, 6, 5, 4, 8, 12, 13, 14, 15]}
      />
    ),
  },
};

export default function PuzzleGuide({ kind }: { kind: Puzzle["kind"] }) {
  const g = GUIDES[kind];
  return (
    <details className="puzzle-guide" open>
      <summary>Kaise khelein · Guide</summary>
      <div className="guide-body">
        <div>
          <p className="guide-label">Qawaid</p>
          <ol className="guide-steps">
            {g.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="guide-label">Khelna</p>
          <p className="guide-how">{g.how}</p>
          <p className="guide-how">Board poora sahi hote hi khud check ho jata hai. Jo pehle hal kare, us ke zyada points.</p>
        </div>
        <div className="guide-example">
          <p className="ex-head">Misaal (hal kiya hua)</p>
          {g.example}
        </div>
      </div>
    </details>
  );
}
