"use client";

import { useState } from "react";
import { DoorClosed, Eye, Gauge, ShieldAlert, Timer, Wifi } from "lucide-react";
import { rs } from "@/lib/api";
import type { Config } from "@/lib/types";

type Props = {
  categoryName: string;
  entry: number | null; // null = free practice
  prize: number;
  seconds: number;
  rake: number;
  scoring: Config["scoring"];
  onStart: () => void;
  onBack: () => void;
};

// Shown before every match. The player must agree before they can start.
export default function RulesSheet({ categoryName, entry, prize, seconds, rake, scoring, onStart, onBack }: Props) {
  const [agree, setAgree] = useState(false);
  const fullSecs = scoring.fullMs / 1000;
  const rules = [
    {
      icon: DoorClosed,
      ur: entry ? `Start dabane ke baad wapsi nahi. Lobby ya match chhora to ${rs(entry)} entry wapas nahi milegi aur muqabil jeet jayega.` : "Start dabane ke baad wapsi nahi. Match chhora to aap haar jayenge.",
      en: entry ? "No leaving after Start. Leave the lobby or match and you lose the entry; the opponent wins." : "No leaving after Start. Leaving counts as a loss.",
    },
    { icon: Timer, ur: `Har sawal ke liye sirf ${seconds} second.`, en: `${seconds} seconds per question.` },
    {
      icon: Gauge,
      ur: `Jitna tez sahi jawab, utne zyada points: ${fullSecs} second tak ${scoring.max}, phir kam hote hote aakhri second par ${scoring.min}. Ghalat jawab = 0.`,
      en: `Faster right answers score more: ${scoring.max} points up to ${fullSecs}s, falling to ${scoring.min} at the last second. Wrong = 0.`,
    },
    {
      icon: Eye,
      ur: "Tab ya window badalna, full screen se nikalna, devtools kholna ya extensions chalana cheating hai.",
      en: "Switching tab or window, leaving full screen, devtools and browser extensions count as cheating.",
    },
    {
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
      {entry ? (
        <div className="fee-box">
          <div><span>Pot (dono entries)</span><b>{rs(entry * 2)}</b></div>
          <div><span>Platform fee {Math.round(rake * 100)}%</span><b>− {rs(entry * 2 - prize)}</b></div>
          <div className="fee-win"><span>Jeetne wale ko ({Math.round((1 - rake) * 100)}%)</span><b>{rs(prize)}</b></div>
        </div>
      ) : null}
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
