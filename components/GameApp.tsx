"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api, getToken, setToken } from "@/lib/api";
import { sfx } from "@/lib/sound";
import type { Category, Config, MatchEnd, MatchFound, Question, Reveal, Screen, User } from "@/lib/types";
import BottomNav from "./BottomNav";
import Sheet from "./Sheet";
import Toast, { type ToastState } from "./Toast";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Play from "./screens/Play";
import PlaySheet from "./screens/PlaySheet";
import Searching from "./screens/Searching";
import Versus from "./screens/Versus";
import Match from "./screens/Match";
import Result from "./screens/Result";
import Wallet from "./screens/Wallet";
import Leaderboard from "./screens/Leaderboard";
import Profile from "./screens/Profile";
import RulesSheet from "./screens/RulesSheet";
import { enterFullscreen, startAntiCheat } from "@/lib/anticheat";

export type MatchState = {
  found: MatchFound;
  question: Question | null;
  reveal: Reveal | null;
  myChoice: number | null;
  oppAnswered: boolean;
  results: ("ok" | "bad")[];
  scores: { you: number; opp: number };
};

type LastPlay = { category: Category; entry: number | null }; // entry null = practice

const NAV_SCREENS: Screen[] = ["home", "play", "wallet", "leaderboard", "profile"];

export default function GameApp() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [screen, setScreen] = useState<Screen>("login");
  const [sheet, setSheet] = useState<React.ReactNode>(null);
  const [toast, setToastState] = useState<ToastState>(null);
  const [searching, setSearching] = useState<{ category: Category; entry: number; prize: number; since: number; practice?: boolean } | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [end, setEnd] = useState<MatchEnd | null>(null);
  const [lastPlay, setLastPlay] = useState<LastPlay | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((text: string, kind: "error" | "success" | "info" = "info") => {
    setToastState({ text, kind, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 2800);
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await api<{ user: User; config: Config; status: string }>("/api/me");
    setUser(data.user);
    setConfig(data.config);
    return data;
  }, []);

  const logout = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setToken(null);
    setUser(null);
    setScreen("login");
  }, []);

  // ---------- realtime ----------
  const connectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    const s = io({ auth: { token: getToken() } });
    socketRef.current = s;

    s.on("connect_error", (err) => {
      if (err.message === "unauthorized") logout();
    });

    s.on("match:found", (f: MatchFound) => {
      sfx.found();
      setSearching(null);
      setEnd(null);
      setSheet(null);
      setUser((u) => (u ? { ...u, balance: f.balance } : u));
      setMatch({
        found: f, question: null, reveal: null, myChoice: null, oppAnswered: false, results: [],
        scores: { you: f.you.score ?? 0, opp: f.opponent.score ?? 0 },
      });
      setScreen(f.resumed ? "match" : "versus");
    });

    s.on("match:cancelled", ({ reason, balance }: { reason: string; balance: number }) => {
      setMatch(null);
      setUser((u) => (u ? { ...u, balance } : u));
      setScreen("play");
      notify(reason, "error");
    });

    s.on("match:question", (q: Question) => {
      setMatch((m) => (m ? { ...m, question: q, reveal: null, myChoice: null, oppAnswered: false } : m));
      setScreen("match");
    });

    s.on("match:opponentAnswered", () => setMatch((m) => (m ? { ...m, oppAnswered: true } : m)));

    s.on("match:reveal", (r: Reveal) => {
      const ok = r.you.points > 0;
      if (ok) sfx.correct();
      else sfx.wrong();
      setMatch((m) => {
        if (!m) return m;
        const results = [...m.results];
        results[r.index] = ok ? "ok" : "bad";
        return { ...m, reveal: r, results, scores: { you: r.you.score, opp: r.opponent.score } };
      });
    });

    s.on("match:end", (e: MatchEnd) => {
      if (e.outcome === "win") sfx.win();
      else if (e.outcome === "loss") sfx.lose();
      setEnd(e);
      setScreen("result");
      refreshMe().catch(() => {});
    });

    // back in the lobby after a refresh or reconnect
    s.on("queue:resume", (q: { category: string; entry: number; prize: number; since: number }) => {
      setConfig((cfg) => {
        const category = cfg?.categories.find((c) => c.id === q.category);
        if (category) {
          setSearching({ category, entry: q.entry, prize: q.prize, since: q.since });
          setScreen("searching");
        }
        return cfg;
      });
    });

    s.on("match:opponentLeft", ({ seconds }: { seconds: number }) => notify(`Muqabil ka connection gaya — ${seconds} second mein wapas na aaya to aap jeet jayenge`));
    s.on("match:opponentBack", () => notify("Muqabil wapas aa gaya"));

    s.on("queue:cancelled", ({ reason, balance }: { reason: string; balance?: number }) => {
      if (typeof balance === "number") setUser((u) => (u ? { ...u, balance } : u));
      setSearching(null);
      setScreen("home");
      notify(reason, "error");
    });
  }, [logout, notify, refreshMe]);

  // ---------- boot ----------
  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      api<Config>("/api/config").then(setConfig).catch(() => {});
      return;
    }
    refreshMe()
      .then((d) => {
        setScreen("home");
        connectSocket();
      })
      .catch(() => logout())
      .finally(() => setBooting(false));
    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoggedIn = (token: string, u: User) => {
    setToken(token);
    setUser(u);
    refreshMe().catch(() => {});
    connectSocket();
    setScreen("home");
    notify(`Khush aamdeed, ${u.name}!`, "success");
  };

  // ---------- actions ----------
  const go = (s: Screen) => {
    sfx.tap();
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  const joinQueue = (category: Category, entry: number) => {
    const tier = [...config!.tiers, ...config!.puzzleTiers].find((t) => t.entry === entry)!;
    setLastPlay({ category, entry });
    socketRef.current?.emit("queue:join", { category: category.id, entry }, (res: { error?: string; balance?: number }) => {
      if (res?.error) return notify(res.error, "error");
      setSheet(null);
      if (typeof res.balance === "number") setUser((u) => (u ? { ...u, balance: res.balance! } : u));
      setSearching({ category, entry, prize: tier.prize, since: Date.now() });
      setScreen("searching");
    });
  };

  const startPractice = (category: Category) => {
    setLastPlay({ category, entry: null });
    socketRef.current?.emit("practice:start", { category: category.id }, (res: { error?: string }) => {
      if (res?.error) return notify(res.error, "error");
      setSheet(null);
      setSearching({ category, entry: 0, prize: 0, since: Date.now(), practice: true });
      setScreen("searching");
    });
  };

  const startChallenge = () => {
    if (!searching) return;
    socketRef.current?.emit("challenge:start", { category: searching.category.id, entry: searching.entry }, (res: { error?: string }) => {
      if (res?.error) notify(res.error, "error");
    });
  };

  // puzzle rounds: the server checks the board and says whether it is solved
  const solve = (solution: number[]) =>
    new Promise<boolean>((resolve) => {
      if (!match?.question) return resolve(false);
      const { matchId } = match.found;
      socketRef.current?.emit("match:solve", { matchId, index: match.question.index, solution }, (res: { ok: boolean }) => {
        if (res?.ok) {
          sfx.correct();
          setMatch((m) => (m ? { ...m, myChoice: 0 } : m));
        }
        resolve(!!res?.ok);
      });
    });

  const answer = (choice: number) => {
    if (!match?.question || match.myChoice !== null || match.reveal) return;
    sfx.tap();
    setMatch({ ...match, myChoice: choice });
    socketRef.current?.emit("match:answer", { matchId: match.found.matchId, index: match.question.index, choice });
  };

  const playAgain = () => {
    if (!lastPlay) return go("home");
    showRules(lastPlay.category, lastPlay.entry);
  };

  // Every match starts from the rules screen; the player must tick "I agree".
  const showRules = (category: Category, entry: number | null) => {
    const prize = entry ? [...config!.tiers, ...config!.puzzleTiers].find((t) => t.entry === entry)?.prize ?? 0 : 0;
    setSheet(
      <RulesSheet
        categoryId={category.id}
        categoryName={category.name}
        entry={entry}
        prize={prize}
        seconds={config!.seconds}
        rake={config!.rake}
        challengeMaxEntry={config!.challengeMaxEntry}
        refundSeconds={config!.noOpponentRefundSeconds}
        scoring={config!.scoring}
        onBack={() => openPlaySheet(category)}
        onStart={() => {
          enterFullscreen();
          if (entry === null) startPractice(category);
          else joinQueue(category, entry);
        }}
      />,
    );
  };

  const openPlaySheet = (category: Category) => {
    sfx.tap();
    setSheet(
      <PlaySheet
        category={category}
        config={config!}
        balance={user!.balance}
        onPlay={(entry) => showRules(category, entry)}
        onPractice={() => showRules(category, null)}
        onAddMoney={() => {
          setSheet(null);
          go("wallet");
        }}
      />,
    );
  };

  const matchId = match?.found.matchId;
  const inMatch = !!matchId && (screen === "versus" || screen === "match");
  useEffect(() => {
    if (!inMatch) return;
    return startAntiCheat((reason) => socketRef.current?.emit("match:strike", { matchId, reason }));
  }, [inMatch, matchId]);

  // ---------- render ----------
  if (booting) return <div className="spinner" />;

  const showNav = !!user && NAV_SCREENS.includes(screen);

  return (
    <>
      <main className={`app ${showNav ? "" : "no-nav"}`} data-app>
        {screen === "login" && <Login onLoggedIn={onLoggedIn} notify={notify} />}
        {user && config && (
          <>
            {screen === "home" && <Home user={user} config={config} go={go} />}
            {screen === "play" && <Play config={config} onPick={openPlaySheet} />}
            {screen === "searching" && searching && (
              <Searching
                info={searching} name={user.name} avatar={user.avatar}
                houseWaitSeconds={config.houseWaitSeconds}
                challengeMaxEntry={config.challengeMaxEntry}
                refundSeconds={config.noOpponentRefundSeconds}
                onStartChallenge={startChallenge}
              />
            )}
            {screen === "versus" && match && <Versus found={match.found} />}
            {screen === "match" && match && <Match state={match} onAnswer={answer} onSolve={solve} />}
            {screen === "result" && end && <Result end={end} user={user} found={match?.found ?? null} onAgain={playAgain} onHome={() => go("home")} />}
            {screen === "wallet" && <Wallet user={user} config={config} setSheet={setSheet} notify={notify} refreshMe={refreshMe} />}
            {screen === "leaderboard" && <Leaderboard me={user} />}
            {screen === "profile" && <Profile user={user} config={config} setUser={setUser} notify={notify} onLogout={logout} />}
          </>
        )}
      </main>
      {showNav && <BottomNav screen={screen} go={go} />}
      <Sheet onClose={() => setSheet(null)}>{sheet}</Sheet>
      <Toast state={toast} />
    </>
  );
}
