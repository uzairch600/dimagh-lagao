"use client";

import { useEffect, useState } from "react";
import { api, rs } from "@/lib/api";
import { Check, Handshake, LogOut, Pencil, Trophy, X } from "lucide-react";
import type { Config, MatchSummary, User } from "@/lib/types";
import Avatar, { ANIMALS, AnimalArt } from "../Avatar";

type Props = {
  user: User;
  config: Config;
  setUser: (u: User) => void;
  notify: (t: string, k?: "error" | "success") => void;
  onLogout: () => void;
};

export default function Profile({ user, config, setUser, notify, onLogout }: Props) {
  const [name, setName] = useState(user.name);
  const [picking, setPicking] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  useEffect(() => {
    api<{ matches: MatchSummary[] }>("/api/matches")
      .then((d) => setMatches(d.matches))
      .catch(() => setMatches([]));
  }, []);

  const save = async (patch: { name?: string; avatar?: string }) => {
    try {
      const d = await api<{ user: User }>("/api/profile", patch);
      setUser(d.user);
      notify("Profile update ho gayi", "success");
    } catch (e) {
      notify((e as Error).message, "error");
      setName(user.name);
    }
  };

  const played = user.wins + user.losses + user.draws;
  const rate = played ? Math.round((user.wins / played) * 100) : 0;

  return (
    <section className="screen">
      <h2 className="page-title">Profile</h2>
      <div className="profile-card card glass">
        <button className="avatar-btn" title="Avatar badlein" onClick={() => setPicking((p) => !p)}>
          <Avatar name={user.name} avatar={user.avatar} size="xl" />
          <span className="edit-badge">
            <Pencil size={13} />
          </span>
        </button>
        <input
          className="name-input" maxLength={18} value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() !== user.name && save({ name })}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
        <p className="muted">{user.phone}</p>
        <div className="stats">
          <div><b>{user.wins}</b><small>Jeet</small></div>
          <div><b>{user.losses}</b><small>Haar</small></div>
          <div><b>{rate}%</b><small>Win rate</small></div>
          <div><b className={user.earnings >= 0 ? "gold" : ""}>{user.earnings}</b><small>Kamai</small></div>
        </div>
      </div>

      {picking && (
        <div className="avatar-picker">
          {config.avatars.filter((a) => ANIMALS[a]).map((a) => {
            const [c1, c2] = ANIMALS[a].bg;
            return (
              <button
                key={a} aria-label={a} className={a === user.avatar ? "sel" : ""}
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                onClick={() => { setPicking(false); save({ avatar: a }); }}
              >
                <AnimalArt animal={a} />
                {a === user.avatar && (
                  <span className="sel-check">
                    <Check size={12} strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <h3 className="section-sub">Pichle matches</h3>
      <div className="tx-list">
        {matches === null && <div className="empty">Load ho raha hai…</div>}
        {matches?.length === 0 && <div className="empty">Abhi koi match nahi khela</div>}
        {matches?.map((m) => {
          const me = m.players.find((p) => p.userId === user.id);
          const opp = m.players.find((p) => p.userId !== user.id);
          const outcome = !m.winner ? "draw" : m.winner === user.id ? "win" : "loss";
          const cat = config.categories.find((c) => c.id === m.category);
          return (
            <div className="tx" key={m.id}>
              <span className={`ic ${outcome}`}>
                {outcome === "win" ? <Trophy size={18} /> : outcome === "loss" ? <X size={18} /> : <Handshake size={18} />}
              </span>
              <span className="info">
                <b>vs {opp?.name}</b>
                <small>
                  {cat?.name} • {me?.score} – {opp?.score}
                  {m.mode === "practice" ? " • practice" : ""}
                </small>
              </span>
              {m.mode !== "practice" && (
                <span className={`amt ${outcome === "win" ? "plus" : outcome === "loss" ? "minus" : ""}`}>
                  {outcome === "win" ? `+${rs(m.prize)}` : outcome === "loss" ? `−${rs(m.entry)}` : "±0"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-ghost btn-block" style={{ marginTop: 20 }} onClick={onLogout}>
        <LogOut size={18} /> Logout
      </button>
    </section>
  );
}
