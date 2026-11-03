import type { Metadata } from "next";
import { Clock, MessageCircle } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import ContactForm from "@/components/site/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rabta karein",
  description: "Dimagh Lagao support se rabta — account, match, sponsor ya business ke liye.",
};

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Support" title="Rabta karein" sub="Account, match ka masla ya business — hum madad ke liye haazir hain." />
      <section className="site-section">
        <div className="site-container prose-grid">
          <div className="card glass">
            <ContactForm />
          </div>
          <aside className="side-cards">
            {SITE.whatsapp && (
              <div className="side-card">
                <MessageCircle size={22} />
                <b>WhatsApp</b>
                <p>{SITE.whatsapp}</p>
              </div>
            )}
            <div className="side-card">
              <Clock size={22} />
              <b>Jawab ka waqt</b>
              <p>Aam taur par 24 ghante ke andar, kaam ke dinon mein.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
