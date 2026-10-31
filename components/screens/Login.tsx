"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type Props = { onLoggedIn: (token: string, user: User) => void; notify: (t: string, k?: "error" | "success") => void };

export default function Login({ onLoggedIn, notify }: Props) {
  const [step, setStep] = useState<"phone" | "login" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (step === "phone") {
        const { exists } = await api<{ exists: boolean }>("/api/check-phone", { phone });
        setStep(exists ? "login" : "signup");
      } else {
        const res = await api<{ token: string; user: User }>("/api/login", { phone, pin, name });
        onLoggedIn(res.token, res.user);
      }
    } catch (err) {
      notify((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="screen login-wrap">
      <div className="logo">
        <div className="logo-mark">
          <Brain size={48} strokeWidth={1.8} />
        </div>
        <h1>
          Dimagh <span>Lagao</span>
        </h1>
        <p className="urdu">دماغ لگاؤ، انعام جیتو</p>
      </div>

      <form className="card glass login-card" onSubmit={submit}>
        <label className="field">
          <span>Mobile number</span>
          <input
            type="tel" inputMode="numeric" placeholder="03xx xxxxxxx" maxLength={14} required autoFocus
            value={phone} disabled={step !== "phone"}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        {step === "signup" && (
          <label className="field">
            <span>Aap ka naam</span>
            <input type="text" placeholder="e.g. Ali Khan" maxLength={18} required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}

        {step !== "phone" && (
          <label className="field">
            <span>{step === "signup" ? "Naya 4-digit PIN banayein" : "Apna 4-digit PIN daalein"}</span>
            <input
              className="pin-input" type="password" inputMode="numeric" maxLength={4} placeholder="••••" required
              autoFocus={step === "login"} value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        )}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "..." : step === "phone" ? "Aage barhein" : step === "signup" ? "Account banayein" : "Login"}
        </button>

        {step !== "phone" ? (
          <button type="button" className="fine" onClick={() => { setStep("phone"); setPin(""); }}>
            ← Number badlein
          </button>
        ) : (
          <p className="fine">Account banane ke liye sirf number aur PIN chahiye.</p>
        )}
      </form>
    </section>
  );
}
