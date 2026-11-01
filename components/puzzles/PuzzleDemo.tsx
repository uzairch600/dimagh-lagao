"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Eye, Pause, Play, Pointer, RotateCcw, Shuffle, SkipBack, SkipForward, Sparkles, Undo2 } from "lucide-react";
import { checkPuzzle } from "@/lib/puzzle-rules";
import type { PuzzleKind } from "@/lib/types";
import { PUZZLES, samplesFor } from "./registry";
import type { Step } from "./types";

type Props = { kind: PuzzleKind; name?: string; compact?: boolean; onPlay?: () => void };

// "Kaise khelein": a hand plays a small board step by step with a caption for each move, then the player tries
// small boards of their own (checked right here, nothing is sent).
export default function PuzzleDemo({ kind, name, compact, onPlay }: Props) {
  const def = PUZZLES[kind];
  const [tab, setTab] = useState<"watch" | "try">("watch");
  return (
    <div className={`pzd ${compact ? "compact" : ""}`}>
      <div className="pzd-head">
        {name && (
          <h3 className="pzd-title">
            {name} <small>Kaise khelein</small>
          </h3>
        )}
        <div className="pzd-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "watch"} className={tab === "watch" ? "on" : ""} onClick={() => setTab("watch")}>
            <Eye size={15} /> Dekhiye
          </button>
          <button role="tab" aria-selected={tab === "try"} className={tab === "try" ? "on" : ""} onClick={() => setTab("try")}>
            <Pointer size={15} /> Khud try karein
          </button>
        </div>
      </div>
      <div className="pzd-body">
        {tab === "watch" ? <Watch kind={kind} onTry={() => setTab("try")} /> : <Practice kind={kind} onPlay={onPlay} />}
        <div className="pzd-rules">
          <p className="guide-label">Qawaid</p>
          <ol className="pzd-rule-list">
            {def.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="guide-label">Khelna</p>
          <p className="pzd-how">{def.how}</p>
          <p className="pzd-how">Board sahi hote hi khud check ho jata hai. Match mein 1 puzzle, 100 second — waqt par hal kiya to inaam aap ka.</p>
        </div>
      </div>
    </div>
  );
}

function Watch({ kind, onTry }: { kind: PuzzleKind; onTry: () => void }) {
  const def = PUZZLES[kind];
  const sample = samplesFor(kind)[0];
  const steps = useMemo<Step<unknown>[]>(
    () => [{ state: def.init(sample.puzzle), say: `Dekhiye — ${def.rules[0]}` }, ...def.demo(sample.puzzle, sample.solution)],
    [kind],
  );
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hand, setHand] = useState<{ x: number; y: number; taps: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  // centre of a cell or button inside the stage, for the hand
  const spot = (at: Step<unknown>["at"]) => {
    const box = stage.current;
    const el = at === undefined ? null : box?.querySelector<HTMLElement>(`[data-cell="${at}"]`);
    if (!box || !el) return null;
    const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
  };
  const moveHand = (at: Step<unknown>["at"]) => {
    const p = spot(at);
    if (p) setHand((h) => ({ ...p, taps: h?.taps ?? 0 }));
  };

  // each step: let the caption be read, move the hand to the next target, then tap (the board changes)
  useEffect(() => {
    if (!playing) return;
    if (k >= last) { setPlaying(false); return; }
    const next = steps[k + 1];
    const read = k === 0 ? 2400 : steps[k].say ? 1800 : 260;
    const travel = next.at === undefined ? 0 : 420;
    const t1 = setTimeout(() => moveHand(next.at), read);
    const t2 = setTimeout(() => {
      setK(k + 1);
      if (next.at !== undefined) setHand((h) => h && { ...h, taps: h.taps + 1 });
    }, read + travel);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [k, playing]);

  const jump = (to: number) => {
    setPlaying(false);
    const t = Math.max(0, Math.min(last, to));
    setK(t);
    // the hand goes to the step's own target once the board has drawn it
    requestAnimationFrame(() => moveHand(steps[t].at));
  };
  const restart = () => {
    setHand(null);
    setK(0);
    setPlaying(true);
  };

  const caption = steps.slice(0, k + 1).reverse().find((s) => s.say)?.say;
  const Board = def.Board;
  return (
    <div className="pzd-watch">
      <div className="pzd-stage" ref={stage}>
        <div className={`pzd-board pz-${kind}`}>
          <Board puzzle={sample.puzzle} state={steps[k].state} />
        </div>
        {hand && (
          <span className="pzd-hand" style={{ transform: `translate(${hand.x}px, ${hand.y}px)` }} aria-hidden="true">
            <span className="pzd-ripple" key={hand.taps} />
            <Pointer size={34} strokeWidth={1.6} />
          </span>
        )}
        {k === last && (
          <div className="pzd-done">
            <Sparkles size={26} />
            <b>Hal ho gaya!</b>
            <button className="btn btn-gold btn-sm" onClick={onTry}>
              Ab aap ki baari <ArrowRight size={15} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={restart}>
              <RotateCcw size={14} /> Dobara dekhein
            </button>
          </div>
        )}
      </div>
      <p className="pzd-caption" key={caption}>{caption}</p>
      <div className="pzd-controls">
        <button onClick={() => jump(k - 1)} disabled={k === 0} aria-label="Peechhe">
          <SkipBack size={16} />
        </button>
        <button className="main" onClick={() => (k >= last ? restart() : setPlaying(!playing))} aria-label={playing ? "Rokein" : "Chalayein"}>
          {playing ? <Pause size={18} /> : k >= last ? <RotateCcw size={18} /> : <Play size={18} />}
        </button>
        <button onClick={() => jump(k + 1)} disabled={k >= last} aria-label="Aage">
          <SkipForward size={16} />
        </button>
        <span className="pzd-progress">
          <i style={{ width: `${(k / last) * 100}%` }} />
        </span>
      </div>
    </div>
  );
}

function Practice({ kind, onPlay }: { kind: PuzzleKind; onPlay?: () => void }) {
  const boards = samplesFor(kind).slice(1);
  const [pick, setPick] = useState(0);
  return <PracticeBoard key={pick} kind={kind} sample={boards[pick % boards.length]} onNext={() => setPick(pick + 1)} onPlay={onPlay} />;
}

function PracticeBoard({ kind, sample, onNext, onPlay }: { kind: PuzzleKind; sample: ReturnType<typeof samplesFor>[number]; onNext: () => void; onPlay?: () => void }) {
  const def = PUZZLES[kind];
  const { puzzle, solution } = sample;
  const [state, setState] = useState(() => def.init(puzzle));
  const [history, setHistory] = useState<unknown[]>([]);
  const [peek, setPeek] = useState(false);
  const attempt = def.attempt(puzzle, state);
  const won = !peek && !!attempt && checkPuzzle(puzzle, attempt);
  const wrong = !peek && !!attempt && !won;
  const Board = def.Board;
  const set = (next: unknown) => {
    setHistory((h) => [...h.slice(-300), state]);
    setState(next);
  };
  return (
    <div className="pzd-watch">
      <div className="pzd-stage">
        <div className={`pzd-board pz-${kind}`}>
          <Board puzzle={puzzle} state={peek ? def.shown(puzzle, solution) : state} set={won || peek ? undefined : set} />
        </div>
        {won && (
          <div className="pzd-done win">
            <Sparkles size={26} />
            <b>Shabash! Aap tayyar hain</b>
            {onPlay && (
              <button className="btn btn-gold btn-sm" onClick={onPlay}>
                Match khelein <ArrowRight size={15} />
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onNext}>
              <Shuffle size={14} /> Naya puzzle
            </button>
          </div>
        )}
      </div>
      <p className={`pzd-caption ${wrong ? "bad" : ""}`}>
        {peek ? "Ye raha hal. Naya puzzle le kar khud try karein." : wrong ? "Abhi sahi nahi — laal khane aur qawaid dekhein." : "Chhota sa puzzle — yahan koi waqt ya points nahi. Araam se seekhein."}
      </p>
      <div className="pzd-controls">
        <button onClick={() => { setState(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); }} disabled={!history.length || peek} aria-label="Wapas">
          <Undo2 size={16} />
        </button>
        <button onClick={() => { setState(def.init(puzzle)); setHistory([]); setPeek(false); }} aria-label="Dobara">
          <RotateCcw size={16} />
        </button>
        <button className="wide" onClick={() => setPeek(!peek)}>
          <Eye size={15} /> {peek ? "Chhupayein" : "Hal dikhayein"}
        </button>
        <button className="wide" onClick={onNext}>
          <Shuffle size={15} /> Naya
        </button>
      </div>
    </div>
  );
}
