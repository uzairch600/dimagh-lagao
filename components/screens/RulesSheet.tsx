"use client";

import { useState } from "react";
import { DoorClosed, Eye, Gauge, ShieldAlert, Timer, Users, Wifi } from "lucide-react";
import PuzzleGuide from "./PuzzleGuide";
import { isPuzzleKind } from "../puzzles/registry";
import type { Config } from "@/lib/types";

type Props = {
  categoryId: string;
  categoryName: string;
  seconds: number; // per question for a quiz, for the whole board for a puzzle
  opponentWaitSeconds: number;
  scoring: Config["scoring"];
  onStart: () => void;
  onBack: () => void;
};

// Shown before every match. The player must agree before they can start. Every match is free.
export default function RulesSheet({ categoryId, categoryName, seconds, opponentWaitSeconds, scoring, onStart, onBack }: Props) {
  const [agree, setAgree] = useState(false);
  const fullSecs = scoring.fullMs / 1000;
  const puzzle = isPuzzleKind(categoryId);
  const rules = puzzle
    ? [
        { icon: Timer, ur: `1 puzzle, ${seconds} second. Koi muqabil nahi — sirf aap aur ghari.`, en: `One puzzle, ${seconds} seconds. No opponent: just you against the clock.` },
        { icon: Gauge, ur: "Waqt par hal kiya to leaderboard par aap ka ek puzzle aur jud jata hai.", en: "Solve it in time and it counts on the leaderboard." },
      ]
    : [
        {
          icon: Users,
          ur: `Asli player se 1v1 muqabla. ${opponentWaitSeconds} second mein koi na mila to computer ke saath khelenge.`,
          en: `A 1v1 against a real player. Nobody in ${opponentWaitSeconds} seconds and you play the computer.`,
        },
        { icon: Timer, ur: `Har sawal ke liye sirf ${seconds} second.`, en: `${seconds} seconds per question.` },
        {
          icon: Gauge,
          ur: `Jitna tez sahi jawab, utne zyada points: ${fullSecs} second tak ${scoring.max}, phir kam hote hote aakhri second par ${scoring.min}. Ghalat jawab = 0.`,
          en: `Faster right answers score more: ${scoring.max} points up to ${fullSecs}s, falling to ${scoring.min} at the last second. Wrong = 0.`,
        },
        { icon: DoorClosed, ur: "Match beech mein chhora to aap haar jayenge.", en: "Leaving a match counts as a loss." },
      ];
  rules.push(
    {
      icon: Eye,
      ur: "Tab ya window badalna, full screen se nikalna, devtools kholna ya extensions chalana cheating hai.",
      en: "Switching tab or window, leaving full screen, devtools and browser extensions count as cheating.",
    },
    { icon: ShieldAlert, ur: "Cheating pakdi gayi to aap foran haar jayenge.", en: "If you are caught cheating, you lose at once." },
    { icon: Wifi, ur: "Internet chala jaye to 10 second mein wapas aayein, warna match haar jayenge.", en: "If you disconnect, you have 10 seconds to come back or you lose." },
  );

  return (
    <>
      <h3>Match ke qawaid · Match rules</h3>
      <p className="sub">{categoryName} • Bilkul free</p>
      {isPuzzleKind(categoryId) && <PuzzleGuide kind={categoryId} />}
      <div className="rules">
        {rules.map(({ icon: Icon, ur, en }) => (
          <div key={en} className="rule">
            <Icon size={20} />
            <span>
              <b>{ur}</b>
              <small>{en}</small>
            </span>
          </div>
        ))}
      </div>
      <label className="agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          Main qawaid se ittefaq karta hoon · <i>I agree to the rules</i>
        </span>
      </label>
      <button className="btn btn-gold btn-block" disabled={!agree} onClick={onStart}>
        Start
      </button>
      <button className="btn btn-ghost btn-block rules-back" onClick={onBack}>
        Wapas · Back
      </button>
    </>
  );
}
