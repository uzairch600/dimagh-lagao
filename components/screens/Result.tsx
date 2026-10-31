import { Handshake, RotateCcw, Trophy, type LucideIcon } from "lucide-react";
import { rs } from "@/lib/api";
import type { MatchEnd, MatchFound, User } from "@/lib/types";
import Avatar from "../Avatar";
import Confetti from "../Confetti";

type Props = { end: MatchEnd; user: User; found: MatchFound | null; onAgain: () => void; onHome: () => void };

const COPY: Record<MatchEnd["outcome"], { icon: LucideIcon; title: string; cls: string }> = {
  win: { icon: Trophy, title: "Jeet gaye!", cls: "win" },
  loss: { icon: RotateCcw, title: "Agli baar pakka!", cls: "loss" },
  draw: { icon: Handshake, title: "Barabar!", cls: "draw" },
};

export default function Result({ end, user, found, onAgain, onHome }: Props) {
  const c = COPY[end.outcome];
  const Icon = c.icon;
  const paid = end.mode !== "practice";
  let amount = "Practice match";
  let amountCls = "";
  if (paid && end.outcome === "win") { amount = `+ ${rs(end.prize)}`; amountCls = "plus"; }
  if (paid && end.outcome === "loss") { amount = `− ${rs(end.entry)}`; amountCls = "minus"; }
  if (paid && end.outcome === "draw") amount = "Entry wapas";

  const youTop = end.you.score >= end.opponent.score;

  return (
    <section className="screen center-col result">
      {end.outcome === "win" && <Confetti />}
      <div className={`result-badge ${c.cls}`}>
        <Icon size={56} strokeWidth={1.8} />
      </div>
      <h1>{c.title}</h1>
      <p className={`result-amount ${amountCls}`}>{amount}</p>

      <div className="r-board card glass">
        <div className={`r-row ${youTop ? "top" : ""}`}>
          <Avatar name={user.name} avatar={user.avatar} size="sm" />
          <b>Aap</b>
          <span className="r-correct">{end.you.correct}/{end.total} sahi</span>
          <span className="r-score">{end.you.score}</span>
        </div>
        <div className={`r-row ${!youTop ? "top" : ""}`}>
          <Avatar name={end.opponent.name} avatar={found?.opponent.avatar} size="sm" />
          <b>{end.opponent.name}</b>
          <span className="r-correct">{end.opponent.correct}/{end.total} sahi</span>
          <span className="r-score">{end.opponent.score}</span>
        </div>
      </div>

      <p className="muted">
        Wallet: <b className="gold">{rs(end.balance)}</b>
      </p>
      <div className="btn-row">
        <button className="btn btn-gold" onClick={onAgain}>
          Dobara khelo
        </button>
        <button className="btn btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </section>
  );
}
