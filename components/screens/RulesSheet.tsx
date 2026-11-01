"use client";

import { useState } from "react";
import { DoorClosed, Eye, Gauge, Hourglass, ShieldAlert, Timer, Wifi } from "lucide-react";
import PuzzleGuide from "./PuzzleGuide";
import { isPuzzleKind } from "../puzzles/registry";
import { rs } from "@/lib/api";
import type { Config, Puzzle } from "@/lib/types";

type Props = {
  categoryId: string;
  categoryName: string;
  entry: number | null; // null = free practice
  prize: number;
  seconds: number;
  rake: number;
  scoring: Config["scoring"];
  challengeMaxEntry: number;
  refundSeconds: number;
  onStart: () => void;
  onBack: () => void;
};

// Shown before every match. The player must agree before they can start.
export default function RulesSheet({ categoryId, categoryName, entry, prize, seconds, rake, scoring, challengeMaxEntry, refundSeconds, onStart, onBack }: Props) {
  const [agree, setAgree] = useState(false);
  const fullSecs = scoring.fullMs / 1000;
  const puzzle = isPuzzleKind(categoryId);
  const rules = [
    puzzle
      ? {
          icon: DoorClosed,
          ur: entry ? `Start dabane ke baad wapsi nahi. Match chhora to ${rs(entry)} entry wapas nahi milegi.` : "Start dabane ke baad wapsi nahi.",
          en: entry ? "No leaving after Start. Leave the match and you lose the entry." : "No leaving after Start.",
        }
      : {
          icon: DoorClosed,
          ur: entry ? `Start dabane ke baad wapsi nahi. Lobby ya match chhora to ${rs(entry)} entry wapas nahi milegi aur muqabil jeet jayega.` : "Start dabane ke baad wapsi nahi. Match chhora to aap haar jayenge.",
          en: entry ? "No leaving after Start. Leave the lobby or match and you lose the entry; the opponent wins." : "No leaving after Start. Leaving counts as a loss.",
        },
    puzzle
      ? { icon: Timer, ur: "1 puzzle, 100 second. Koi muqabil nahi — sirf aap aur ghari.", en: "One puzzle, 100 seconds. No opponent: just you against the clock." }
      : { icon: Timer, ur: `Har sawal ke liye sirf ${seconds} second.`, en: `${seconds} seconds per question.` },
    puzzle
      ? {
          icon: Gauge,
          ur: entry ? `Waqt par hal kiya to ${rs(prize)} aap ke. Hal na hua to entry gayi.` : "Free practice: koi paisa nahi, sirf seekhna.",
          en: entry ? `Solve it in time and win ${rs(prize)}. Not solved: you lose the entry.` : "Free practice: no money, just learning.",
        }
      : {
          icon: Gauge,
          ur: `Jitna tez sahi jawab, utne zyada points: ${fullSecs} second tak ${scoring.max}, phir kam hote hote aakhri second par ${scoring.min}. Ghalat jawab = 0.`,
          en: `Faster right answers score more: ${scoring.max} points up to ${fullSecs}s, falling to ${scoring.min} at the last second. Wrong = 0.`,
        },
    ...(!puzzle && entry && entry > challengeMaxEntry
      ? [{
          icon: Hourglass,
          ur: `Is entry par sirf asli muqabil se match hota hai. ${Math.round(refundSeconds / 60)} minute mein muqabil na mila to entry wapas.`,
          en: `At this entry you only play a real opponent. No opponent in ${Math.round(refundSeconds / 60)} minutes and your entry is refunded.`,
        }]
      : []),
    ...(!puzzle && entry && entry <= challengeMaxEntry
      ? [{
          icon: Hourglass,
          ur: `30 second mein muqabil na mila to Puzzle Challenge milega: ek puzzle, 100 second. Waqt par hal kiya to ${rs(prize)}, warna entry gayi.`,
          en: `No opponent in 30s? You get a Puzzle Challenge: one puzzle, 100 seconds. Solve it in time to win ${rs(prize)}, otherwise you lose the entry.`,
        }]
      : []),
    {
      icon: Eye,
      ur: "Tab ya window badalna, full screen se nikalna, devtools kholna ya extensions chalana cheating hai.",
      en: "Switching tab or window, leaving full screen, devtools and browser extensions count as cheating.",
    },
    puzzle
      ? {
          icon: ShieldAlert,
          ur: "Cheating pakdi gayi to aap foran haar jayenge aur entry gayi. Shak wale nateejay ka inaam review ke baad milta hai.",
          en: "If you are caught cheating you lose at once, along with the entry. A suspicious win is paid after a review.",
        }
      : {
          icon: ShieldAlert,
          ur: "Cheating pakdi gayi to aap foran haar jayenge aur muqabil jeet jayega. Dono ne ki to dono haarenge, inaam kisi ko nahi. Shak wale nateejay ka inaam review ke baad milta hai.",
          en: "A cheater loses at once and the opponent wins. If both cheat, both lose and nobody gets the prize. A suspicious win is paid after a review.",
        },
    {
      icon: Wifi,
      ur: "Internet chala jaye to 10 second mein wapas aayein, warna match haar jayenge.",
      en: "If you disconnect, you have 10 seconds to come back or you lose.",
    },
  ];

  return (
    <>
      <h3>Match ke qawaid · Match rules</h3>
      <p className="sub">{categoryName} • {entry ? `Entry ${rs(entry)}` : "Free practice"}</p>
      {entry && puzzle ? (
        <div className="fee-box">
          <div><span>Entry</span><b>{rs(entry)}</b></div>
          <div className="fee-win"><span>Waqt par hal kiya to</span><b>{rs(prize)}</b></div>
        </div>
      ) : entry ? (
        <div className="fee-box">
          <div><span>Pot (dono entries)</span><b>{rs(entry * 2)}</b></div>
          <div><span>Platform fee {Math.round(rake * 100)}%</span><b>− {rs(entry * 2 - prize)}</b></div>
          <div className="fee-win"><span>Jeetne wale ko ({Math.round((1 - rake) * 100)}%)</span><b>{rs(prize)}</b></div>
        </div>
      ) : null}
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
