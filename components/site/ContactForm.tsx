"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { GAME_LIVE, SITE } from "@/lib/site";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", topic: "general", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent" | "mailed">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // Without the game server there is no /api/contact, so hand the message to the visitor's email app.
  const sendByEmail = () => {
    const subject = `[${form.topic}] Message from ${form.name}`;
    const body = `${form.message}\n\nName: ${form.name}\nMobile: ${form.phone}`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setState("mailed");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GAME_LIVE) return sendByEmail();
    setState("busy");
    setError("");
    try {
      await api("/api/contact", form);
      setState("sent");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message);
        setState("idle");
      } else {
        sendByEmail();
      }
    }
  };

  if (state === "sent" || state === "mailed")
    return (
      <div className="contact-done">
        <CheckCircle2 size={40} />
        <h3>{state === "sent" ? "Message mil gaya!" : "Email tayyar hai"}</h3>
        <p>
          {state === "sent"
            ? "Hum jald aap se rabta karenge."
            : `Aap ki email app mein message tayyar hai — bas Send dabayein. Email app na khule to ${SITE.email} par likhein.`}
        </p>
      </div>
    );

  return (
    <form className="contact-form" onSubmit={submit}>
      <label className="field">
        <span>Naam</span>
        <input required maxLength={40} value={form.name} onChange={set("name")} />
      </label>
      <label className="field">
        <span>Mobile number</span>
        <input required type="tel" inputMode="numeric" maxLength={14} placeholder="03xx xxxxxxx" value={form.phone} onChange={set("phone")} />
      </label>
      <label className="field">
        <span>Mauzu</span>
        <select value={form.topic} onChange={set("topic")}>
          <option value="general">Aam sawal</option>
          <option value="payment">Deposit / withdraw</option>
          <option value="match">Match ya sawal mein ghalti</option>
          <option value="account">Account</option>
          <option value="business">Business / partnership</option>
        </select>
      </label>
      <label className="field">
        <span>Message</span>
        <textarea required minLength={10} maxLength={2000} rows={5} value={form.message} onChange={set("message")} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={state === "busy"}>
        <Send size={18} /> {state === "busy" ? "Bhej rahe hain…" : "Message bhejein"}
      </button>
    </form>
  );
}
