import { Bot } from "lucide-react";
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
  return (
    <>
      <h3 className="sheet-title">
        <CategoryIcon id={category.id} name={category.name} /> {category.name}
      </h3>
      <p className="sub">Entry fee chunein — jeetne wala poora inaam le jata hai</p>
      <div className="tiers">
        {config.tiers.map((t, i) => {
          const locked = balance < t.entry;
          return (
            <button
              key={t.entry}
              className={`tier ${i === 1 ? "hot" : ""} ${locked ? "locked" : ""}`}
              onClick={() => (locked ? onAddMoney() : onPlay(t.entry))}
            >
              <span className="entry">
                <small>Entry</small>
                <b>{rs(t.entry)}</b>
                {i === 1 && <span className="badge">POPULAR</span>}
              </span>
              <span className="win">
                <small>{locked ? "Balance kam hai — add karein" : "Jeeto"}</small>
                <b>{rs(t.prize)}</b>
              </span>
            </button>
          );
        })}
      </div>
      <div className="divider">ya</div>
      <button className="btn btn-ghost btn-block" onClick={onPractice}>
        <Bot size={18} /> Free practice (computer ke saath)
      </button>
    </>
  );
}
