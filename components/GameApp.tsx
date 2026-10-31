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
  const [searching, setSearching] = useState<{ category: Category; entry: number; prize: number; since: number } | null>(null);
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

    s.on("match:question", (q: Question) => {
      setMatch((m) => (m ? { ...m, question: q, reveal: null, myChoice: null, oppAnswered: false } : m));
      setScreen("match");
    });

    s.on("match:opponentAnswered", () => setMatch((m) => (m ? { ...m, oppAnswered: true } : m)));

    s.on("match:reveal", (r: Reveal) => {
      const ok = r.you.choice === r.answerIndex;
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

    s.on("queue:cancelled", ({ reason }: { reason: string }) => {
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
        if (d.status === "searching") notify("Pichli talaash cancel ho gayi");
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
    const tier = config!.tiers.find((t) => t.entry === entry)!;
    setLastPlay({ category, entry });
    socketRef.current?.emit("queue:join", { category: category.id, entry }, (res: { error?: string; waiting?: boolean }) => {
      if (res?.error) return notify(res.error, "error");
      setSheet(null);
      if (res?.waiting) {
        setSearching({ category, entry, prize: tier.prize, since: Date.now() });
        setScreen("searching");
      }
    });
  };

  const startPractice = (category: Category) => {
    setLastPlay({ category, entry: null });
    socketRef.current?.emit("practice:start", { category: category.id }, (res: { error?: string }) => {
      if (res?.error) notify(res.error, "error");
      else setSheet(null);
    });
  };

  const startHouse = () => {
    if (!searching) return;
    socketRef.current?.emit("house:start", { category: searching.category.id, entry: searching.entry }, (res: { error?: string }) => {
      if (res?.error) notify(res.error, "error");
    });
  };

  const cancelSearch = () => {
    socketRef.current?.emit("queue:leave", null, () => {
      setSearching(null);
      setScreen("home");
    });
  };

  const answer = (choice: number) => {
    if (!match?.question || match.myChoice !== null || match.reveal) return;
    sfx.tap();
    setMatch({ ...match, myChoice: choice });
    socketRef.current?.emit("match:answer", { matchId: match.found.matchId, index: match.question.index, choice });
  };

  const playAgain = () => {
    if (!lastPlay) return go("home");
    if (lastPlay.entry === null) startPractice(lastPlay.category);
    else joinQueue(lastPlay.category, lastPlay.entry);
  };

  const openPlaySheet = (category: Category) => {
    sfx.tap();
    setSheet(
      <PlaySheet
        category={category}
        config={config!}
        balance={user!.balance}
        onPlay={(entry) => joinQueue(category, entry)}
        onPractice={() => startPractice(category)}
        onAddMoney={() => {
          setSheet(null);
          go("wallet");
        }}
      />,
    );
  };

  // ---------- render ----------
  if (booting) return <div className="spinner" />;

  const showNav = !!user && NAV_SCREENS.includes(screen);

  return (
    <>
      <main className={`app ${showNav ? "" : "no-nav"}`}>
        {screen === "login" && <Login onLoggedIn={onLoggedIn} notify={notify} />}
        {user && config && (
          <>
            {screen === "home" && <Home user={user} config={config} go={go} />}
            {screen === "play" && <Play config={config} onPick={openPlaySheet} />}
            {screen === "searching" && searching && (
              <Searching
                info={searching} name={user.name} avatar={user.avatar}
                houseMaxEntry={config.houseMaxEntry} houseWaitSeconds={config.houseWaitSeconds}
                onCancel={cancelSearch} onPlayComputer={startHouse}
              />
            )}
            {screen === "versus" && match && <Versus found={match.found} />}
            {screen === "match" && match && <Match state={match} onAnswer={answer} />}
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
