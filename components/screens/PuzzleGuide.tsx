import { Check, X } from "lucide-react";

// How to solve a logic puzzle, shown on the rules screen before a puzzle match.
const WORDS: [string, string][] = [
  ["House 1, 2, 3…", "Ghar left se right ginay jaate hain. House 1 sab se left hai."],
  ["directly left of", "bilkul saath wala left ghar (Dog directly left of Owl = Dog 2, Owl 3)"],
  ["somewhere left of", "left mein kahin bhi, saath hona zaroori nahi"],
  ["neighbours", "dono saath saath gharon mein"],
  ["between", "dono ke darmiyan kisi ghar mein"],
  ["end houses", "pehla ya aakhri ghar"],
  ["either A or B", "in dono mein se koi ek"],
];

export default function PuzzleGuide() {
  return (
    <details className="puzzle-guide" open>
      <summary>Puzzle kaise hal karein · Guide</summary>
      <ol className="guide-steps">
        <li>Har puzzle mein 4 ya 5 janwar hain. Kuch suragh (clues) diye hote hain — sab sach hain.</li>
        <li>Sirf ek hi tarteeb sab suraghon par poori utarti hai. Usi se sawal ka jawab nikalta hai.</li>
        <li>
          Neeche <b>Notes chart</b> hai: cell par tap karein — <X size={12} strokeWidth={3} /> = ye nahi ho sakta,{" "}
          <Check size={12} strokeWidth={3} /> = pakka. Har row aur column mein sirf ek <Check size={12} strokeWidth={3} /> hota hai.
        </li>
        <li>Pehle seedhe suragh lagayein (&quot;lives in house 2&quot;, &quot;does not eat fish&quot;), phir baqi.</li>
      </ol>

      <div className="guide-words">
        {WORDS.map(([en, ur]) => (
          <div key={en}>
            <b>{en}</b>
            <span>{ur}</span>
          </div>
        ))}
      </div>

      <div className="guide-example">
        <p className="ex-head">Misaal · Example (3 ghar)</p>
        <p>1. The owl does not live in an end house.</p>
        <p>2. The cat lives somewhere left of the dog.</p>
        <p className="ex-q">Who lives in house 3?</p>
        <p className="ex-a">
          Hal: Owl end par nahi, to Owl = House 2. Cat dog ke left mein hai, to Cat = House 1 aur Dog = House 3. Jawab:{" "}
          <b>Dog</b>.
        </p>
      </div>
    </details>
  );
}
