import { Bot, Clock } from "lucide-react";
import { rs } from "@/lib/api";
import type { Category, Config } from "@/lib/types";
import CategoryIcon from "../CategoryIcon";

type Props = {
  category: Category;
  config: Config;
  balance: number;
  onPlay: (entry: number) => void;
  onPractice: () => void;
  onAddMoney: () => void;
};

export default function PlaySheet({ category, config, balance, onPlay, onPractice, onAddMoney }: Props) {
  const puzzle = category.group === "puzzle";
  // until the payment gateway is connected, paid entries are shown but closed and free practice leads
  const open = config.paymentsOpen;
  const practice = (
    <button className={`btn btn-block ${open ? "btn-ghost" : "btn-gold"}`} onClick={onPractice}>
      <Bot size={18} /> Free practice {puzzle ? "(akele, bina paise)" : "(computer ke saath)"}
    </button>
  );
  return (
    <>
      <h3 className="sheet-title">
        <CategoryIcon id={category.id} name={category.name} /> {category.name}
      </h3>
      {open ? (
        <p className="sub">Entry fee chunein — jeetne wala poora inaam le jata hai</p>
      ) : (
        <>
          <p className="soon-note">
            <Clock size={16} /> Paid matches jald aa rahe hain — abhi free practice khelein.
          </p>
          {practice}
          <div className="divider">jald aa raha hai</div>
        </>
      )}
      <div className="tiers">
        {(puzzle ? config.puzzleTiers : config.tiers).map((t, i) => {
          const locked = balance < t.entry;
          return (
            <button
              key={t.entry}
              className={`tier ${i === 1 && open ? "hot" : ""} ${locked || !open ? "locked" : ""}`}
              disabled={!open}
              onClick={() => (locked ? onAddMoney() : onPlay(t.entry))}
            >
              <span className="entry">
                <small>Entry</small>
                <b>{rs(t.entry)}</b>
                {i === 1 && open && <span className="badge">POPULAR</span>}
              </span>
              <span className="win">
                <small>{!open ? "Jald" : locked ? "Balance kam hai — add karein" : "Jeeto"}</small>
                <b>{rs(t.prize)}</b>
              </span>
            </button>
          );
        })}
      </div>
      {open && (
        <>
          <div className="divider">ya</div>
          {practice}
        </>
      )}
    </>
  );
}
