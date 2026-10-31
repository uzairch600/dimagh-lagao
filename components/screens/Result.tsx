import { rs } from "@/lib/api";
import type { MatchEnd, MatchFound, User } from "@/lib/types";
import Avatar from "../Avatar";
import Confetti from "../Confetti";

type Props = { end: MatchEnd; user: User; found: MatchFound | null; onAgain: () => void; onHome: () => void };

const COPY: Record<MatchEnd["outcome"], { title: string; cls: string }> = {
  win: { title: "Jeet gaye!", cls: "win" },
  loss: { title: "Agli baar pakka!", cls: "lose" },
  draw: { title: "Barabar!", cls: "draw" },
};

// Why the match ended early, if it did.
function forfeitNote(end: MatchEnd): string | null {
  const f = end.forfeit;
  if (end.void) return "Match void ho gaya — entry wapas kar di gayi.";
  if (!f) return null;
  const cheat = f.reason === "cheating";
  if (f.by === "both") return cheat ? "Dono players ki cheating pakdi gayi — dono haar gaye, inaam kisi ko nahi." : "Dono players match chhor gaye — inaam kisi ko nahi.";
  if (f.by === "you") return cheat ? "Cheating pakdi gayi (tab/window badla ya extension) — is liye aap haar gaye." : "Aap waqt par wapas nahi aaye — match haar gaye.";
  return cheat ? "Muqabil ki cheating pakdi gayi — aap jeet gaye." : "Muqabil match chhor gaya — aap jeet gaye.";
}

export default function Result({ end, user, found, onAgain, onHome }: Props) {
  const c = COPY[end.outcome];
  const note = forfeitNote(end);

  const paid = end.mode !== "practice";
  let amount = "Practice match";
  let amountCls = "";
  if (paid && end.outcome === "win") { amount = end.held ? `${rs(end.prize)} review mein` : `+ ${rs(end.prize)}`; amountCls = end.held ? "" : "plus"; }
  if (paid && end.outcome === "loss") { amount = `− ${rs(end.entry)}`; amountCls = "minus"; }
  if (paid && (end.outcome === "draw" || end.void)) { amount = "Entry wapas"; amountCls = ""; }

  const youTop = end.you.score >= end.opponent.score;

  return (
    <section className="screen center-col result">
      {end.outcome === "win" && <Confetti />}
      <img className={`result-art ${c.cls}`} src={`/images/result-${c.cls}.webp`} alt="" width={480} height={480} />
      <h1>{c.title}</h1>
      <p className={`result-amount ${amountCls}`}>{amount}</p>
      {paid && end.outcome === "win" && (
        <p className="fee-line">
          Pot {rs(end.entry * 2)} − platform fee {Math.round((end.rake ?? 0.3) * 100)}% ({rs(end.entry * 2 - end.prize)}) = {rs(end.prize)}
        </p>
      )}
      {end.held && (
        <p className="result-note bad">
          Aap ke jawabon ka pattern ghair-mamooli tha, is liye inaam review ke baad wallet mein aayega. Sab theek hua to poora inaam milega.
        </p>
      )}
      {note && <p className={`result-note ${end.forfeit?.by === "opponent" ? "good" : "bad"}`}>{note}</p>}

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
