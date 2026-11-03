"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { GAME_LIVE } from "@/lib/site";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", topic: "general", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GAME_LIVE) return setError("Abhi message nahi bhej sakte — thori der baad try karein.");
    setState("busy");
    setError("");
    try {
      await api("/api/contact", form);
      setState("sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Message nahi gaya — thori der baad try karein.");
      setState("idle");
    }
  };

  if (state === "sent")
    return (
      <div className="contact-done">
        <CheckCircle2 size={40} />
        <h3>Message mil gaya!</h3>
        <p>Hum jald aap se rabta karenge.</p>
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
          <option value="sponsor">Sponsor banna hai</option>
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
