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
  if (!f) return null;
  if (f.reason === "quit") return f.by === "you" ? "Aap ne match chhor diya — is liye haar gaye." : "Muqabil ne match chhor diya — aap jeet gaye.";
  const cheat = f.reason === "cheating";
  if (f.by === "both") return cheat ? "Dono players ki cheating pakdi gayi — dono haar gaye." : "Dono players match chhor gaye.";
  if (f.by === "you") return cheat ? "Cheating pakdi gayi (tab/window badla ya extension) — is liye aap haar gaye." : "Aap waqt par wapas nahi aaye — match haar gaye.";
  return cheat ? "Muqabil ki cheating pakdi gayi — aap jeet gaye." : "Muqabil match chhor gaya — aap jeet gaye.";
}

export default function Result({ end, user, found, onAgain, onHome }: Props) {
  // solo: a puzzle played alone, so there is no opponent to compare with
  const solo = !!end.solo;
  const won = end.outcome === "win";
  const vsComputer = !solo && end.mode === "practice";
  const c = solo && !end.forfeit && end.outcome !== "draw" ? (won ? { title: "Puzzle hal!", cls: "win" } : { title: "Chhu mantar!", cls: "lose" }) : COPY[end.outcome];
  const note = solo && !end.forfeit ? (won ? "Waqt par hal kar liya — leaderboard par ek puzzle aur jud gaya." : "Waqt khatam — demo dekh kar dobara try karein.") : forfeitNote(end);
  // what this match did for the leaderboard
  const counted = solo ? (won ? "+1 puzzle leaderboard par" : "Leaderboard par nahi gina") : vsComputer ? "Computer ke saath — leaderboard par nahi ginta" : won ? "+1 jeet leaderboard par" : "Leaderboard par gina gaya";

  const youTop = end.you.score >= end.opponent.score;

  return (
    <section className="screen center-col result">
      {won && <Confetti />}
      <img className={`result-art ${c.cls}`} src={`/images/result-${c.cls}.webp`} alt="" width={480} height={480} />
      <h1>{c.title}</h1>
      <p className={`result-amount ${won && !vsComputer ? "plus" : ""}`}>{counted}</p>
      {note && <p className={`result-note ${end.forfeit?.by === "opponent" || (solo && won) ? "good" : "bad"}`}>{note}</p>}

      <div className="r-board card glass">
        <div className={`r-row ${youTop ? "top" : ""}`}>
          <Avatar name={user.name} avatar={user.avatar} size="sm" />
          <b>Aap</b>
          <span className="r-correct">{end.you.correct}/{end.total} sahi</span>
          <span className="r-score">{end.you.score}</span>
        </div>
        {!solo && (
          <div className={`r-row ${!youTop ? "top" : ""}`}>
            <Avatar name={end.opponent.name} avatar={found?.opponent.avatar} size="sm" />
            <b>{end.opponent.name}</b>
            <span className="r-correct">{end.opponent.correct}/{end.total} sahi</span>
            <span className="r-score">{end.opponent.score}</span>
          </div>
        )}
      </div>

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
