"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, Banknote, Gamepad2, Plus, Trophy, Undo2, type LucideIcon } from "lucide-react";
import { api, rs } from "@/lib/api";
import type { Config, Transaction, User, Withdrawal } from "@/lib/types";

type Notify = (t: string, k?: "error" | "success") => void;
type Props = {
  user: User;
  config: Config;
  setSheet: (n: React.ReactNode) => void;
  notify: Notify;
  refreshMe: () => Promise<unknown>;
};

const TX_ICON: Record<Transaction["type"], LucideIcon> = {
  deposit: ArrowDownLeft,
  withdraw: Banknote,
  entry: Gamepad2,
  prize: Trophy,
  refund: Undo2,
};
const TX_LABEL: Record<Transaction["type"], string> = { deposit: "Deposit", withdraw: "Withdraw", entry: "Match entry", prize: "Inaam", refund: "Refund" };

const when = (t: number) =>
  new Date(t).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function Wallet({ user, config, setSheet, notify, refreshMe }: Props) {
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [wds, setWds] = useState<Withdrawal[]>([]);

  const load = useCallback(async () => {
    const d = await api<{ transactions: Transaction[]; withdrawals: Withdrawal[] }>("/api/wallet");
    setTxs(d.transactions);
    setWds(d.withdrawals);
  }, []);

  useEffect(() => {
    load().catch(() => setTxs([]));
  }, [load]);

  const done = async (msg: string) => {
    setSheet(null);
    notify(msg, "success");
    await Promise.all([refreshMe(), load()]);
  };

  const pending = new Set(wds.filter((w) => w.status === "pending").map((w) => w.txId));

  return (
    <section className="screen">
      <h2 className="page-title">Wallet</h2>
      <div className="wallet-card">
        <small>Kul balance</small>
        <div className="wallet-amount">{rs(user.balance)}</div>
        <div className="wallet-actions">
          <button className="btn btn-light" onClick={() => setSheet(<DepositSheet demo={config.demoMode} notify={notify} onDone={done} />)}>
            <Plus size={18} strokeWidth={3} /> Paise daalein
          </button>
          <button
            className="btn btn-outline-light"
            onClick={() => setSheet(<WithdrawSheet balance={user.balance} min={config.minWithdraw} defaultAccount={user.phone} notify={notify} onDone={done} />)}
          >
            Nikalwayein
          </button>
        </div>
        {config.demoMode && <span className="demo-badge">DEMO MODE</span>}
      </div>

      <h3 className="section-sub">History</h3>
      <div className="tx-list">
        {txs === null && <div className="empty">Load ho raha hai…</div>}
        {txs?.length === 0 && <div className="empty">Abhi koi transaction nahi. Paise daal kar pehla match khelein!</div>}
        {txs?.map((t) => {
          const Icon = TX_ICON[t.type];
          return (
          <div className="tx" key={t.id}>
            <span className={`ic ${t.type}`}>
              <Icon size={18} />
            </span>
            <span className="info">
              <b>
                {TX_LABEL[t.type]}
                {t.type === "withdraw" && pending.has(t.id) && <span className="status-pill">PENDING</span>}
              </b>
              <small>
                {t.note} • {when(t.at)}
              </small>
            </span>
            <span className={`amt ${t.amount >= 0 ? "plus" : "minus"}`}>
              {t.amount >= 0 ? "+" : "−"}
              {Math.abs(t.amount).toLocaleString("en-PK")}
            </span>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function DepositSheet({ demo, notify, onDone }: { demo: boolean; notify: Notify; onDone: (m: string) => void }) {
  const [amount, setAmount] = useState(500);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/wallet/deposit", { amount });
      onDone(`${rs(amount)} wallet mein aa gaye`);
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <h3>Paise daalein</h3>
      <p className="sub">{demo ? "Demo mode: ye asli paise nahi hain, sirf game test karne ke liye." : "Amount chunein"}</p>
      <div className="amount-grid">
        {[100, 250, 500, 1000].map((a) => (
          <button key={a} className={a === amount ? "sel" : ""} onClick={() => setAmount(a)}>
            {rs(a)}
          </button>
        ))}
      </div>
      <button className="btn btn-gold btn-block" disabled={busy} onClick={submit}>
        {busy ? "..." : `${rs(amount)} add karein`}
      </button>
    </>
  );
}

function WithdrawSheet(props: { balance: number; min: number; defaultAccount: string; notify: Notify; onDone: (m: string) => void }) {
  const { balance, min, defaultAccount, notify, onDone } = props;
  const [method, setMethod] = useState("easypaisa");
  const [account, setAccount] = useState(defaultAccount);
  const [amount, setAmount] = useState(String(Math.max(min, Math.min(balance, 1000))));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/wallet/withdraw", { method, account, amount: Number(amount) });
      onDone("Withdraw request bhej di gayi");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h3>Paise nikalwayein</h3>
      <p className="sub">
        Available: <b className="gold">{rs(balance)}</b> • Kam az kam {rs(min)}
      </p>
      <div className="method-row">
        {[
          ["easypaisa", "Easypaisa"],
          ["jazzcash", "JazzCash"],
          ["bank", "Bank"],
        ].map(([id, label]) => (
          <button key={id} className={method === id ? "sel" : ""} onClick={() => setMethod(id)}>
            {label}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{method === "bank" ? "IBAN / Account number" : "Mobile account number"}</span>
        <input value={account} onChange={(e) => setAccount(e.target.value)} />
      </label>
      <label className="field">
        <span>Amount (Rs)</span>
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
      </label>
      <button className="btn btn-primary btn-block" disabled={busy || balance < min} onClick={submit}>
        {balance < min ? `Kam az kam ${rs(min)} chahiye` : busy ? "..." : "Request bhejein"}
      </button>
    </>
  );
}
