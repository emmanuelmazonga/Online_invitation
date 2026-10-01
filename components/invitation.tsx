"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MapPin } from "lucide-react";

const weddingDate = new Date("2026-11-21T09:00:00+02:00");

function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return useMemo(() => {
    const diff = now === null ? 0 : Math.max(0, weddingDate.getTime() - now);
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [now]);
}

function Countdown() {
  const values = useCountdown();
  return (
    <div className="countdown" aria-live="polite">
      {Object.entries(values).map(([label, value]) => (
        <div className="countdown-unit" key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Ornament() {
  return <span className="ornament" aria-hidden="true"><i /><b>✦</b><i /></span>;
}

function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".scroll-reveal"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("has-scroll-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveal");
    };
  }, []);
}

export function Invitation() {
  const [result, setResult] = useState<{ state: "idle" | "sending" | "success" | "error"; message?: string }>({ state: "idle" });
  useScrollReveal();

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setResult({ state: "sending" });
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.get("fullName"),
        whatsapp: data.get("whatsapp"),
        attendance: data.get("attendance"),
        allocationAccepted: data.get("allocationAccepted") === "on",
        whatsappConsent: data.get("whatsappConsent") === "on",
        website: data.get("website") || "",
      }),
    });
    const payload = await response.json();
    if (!response.ok) return setResult({ state: "error", message: payload.error });
    form.reset();
    setResult({ state: "success", message: payload.firstName });
  }

  return (
    <main className="invitation-page">
      <section className="hero" id="top">
        <Image src="/images/field-walk.jpg" alt="A couple walking hand in hand through a sunlit field" fill priority sizes="100vw" className="hero-photo" />
        <div className="hero-shade" />
        <div className="hero-copy reveal">
          <p className="eyebrow light">Together with their families</p>
          <h1><span>James</span><em>&amp;</em><span>Diana</span></h1>
          <div className="hero-date">21 · 11 · 2026</div>
          <p className="hero-place">Ndola, Zambia</p>
          <a className="button button-light" href="#invitation">View invitation</a>
        </div>
        <a className="scroll-cue" href="#invitation" aria-label="Scroll to the invitation"><span>Discover</span><ChevronDown size={18} /></a>
      </section>

      <section className="intro section" id="invitation">
        <p className="eyebrow scroll-reveal">With joyful hearts</p>
        <div className="scroll-reveal reveal-delay-1"><Ornament /></div>
        <h2 className="scroll-reveal" data-reveal="heading">James Konkola <em>&amp;</em><br />Diana Mazonga</h2>
        <p className="lead scroll-reveal reveal-delay-1">together with their families, invite you to share in the celebration of their marriage.</p>
        <div className="story-block scroll-reveal" data-reveal="scale"><p className="story-kicker">Our Story</p><blockquote className="story-note">We met unexpectedly, loved intentionally, and now we’re building a life together.</blockquote></div>
        <div className="date-lockup scroll-reveal" data-reveal="scale"><span>Saturday</span><strong>21</strong><span>November<br />2026</span></div>
        <p className="place-line scroll-reveal reveal-delay-1">Ndola, Zambia</p>
      </section>

      <section className="countdown-section section dark-section">
        <p className="eyebrow light scroll-reveal">The celebration begins in</p>
        <h2 className="scroll-reveal reveal-delay-1" data-reveal="heading">Until We Say “I Do”</h2>
        <div className="scroll-reveal reveal-delay-2" data-reveal="scale"><Countdown /></div>
        <p className="fine-print scroll-reveal reveal-delay-2">Counting down to 09:00 hrs · Africa/Lusaka time</p>
      </section>

      <section className="venues section">
        <div className="section-heading scroll-reveal" data-reveal="heading">
          <p className="eyebrow">The wedding day</p>
          <h2>Where we’ll gather</h2>
        </div>
        <div className="venue-grid">
          <article className="venue venue-church scroll-reveal" data-reveal="left">
            <span className="venue-number">01</span>
            <p className="eyebrow">Holy Matrimony</p>
            <h3>Catholic Cathedral<br />of Christ the King</h3>
            <dl><div><dt>Date</dt><dd>21 November 2026</dd></div><div><dt>Time</dt><dd>09:00–11:00 hrs</dd></div><div><dt>Place</dt><dd>Ndola, Zambia</dd></div></dl>
            <a className="text-link" href="https://maps.app.goo.gl/1PqmyYesE1EJKpfD7" target="_blank" rel="noreferrer"><MapPin size={16} /> View location</a>
          </article>
          <article className="venue venue-reception scroll-reveal reveal-delay-1" data-reveal="right">
            <span className="venue-number">02</span>
            <p className="eyebrow light">Reception</p>
            <h3>Izu Hotel</h3>
            <dl><div><dt>Date</dt><dd>21 November 2026</dd></div><div><dt>Time</dt><dd>17:00 hrs</dd></div><div><dt>Place</dt><dd>Ndola, Zambia</dd></div></dl>
            <a className="text-link light-link" href="https://maps.app.goo.gl/5s4u83Dk1jzrWwCa8" target="_blank" rel="noreferrer"><MapPin size={16} /> View location</a>
          </article>
        </div>
      </section>

      <section className="programme section">
        <p className="eyebrow scroll-reveal">21 November 2026</p>
        <h2 className="scroll-reveal reveal-delay-1" data-reveal="heading">Order of the day</h2>
        <div className="timeline">
          <article className="scroll-reveal" data-reveal="left"><time>09:00–11:00 hrs</time><span className="timeline-dot" /><div><h3>Holy Matrimony</h3><p>Catholic Cathedral of Christ the King</p></div></article>
          <article className="scroll-reveal reveal-delay-1" data-reveal="left"><time>17:00 hrs</time><span className="timeline-dot" /><div><h3>Reception</h3><p>Izu Hotel</p></div></article>
        </div>
        <aside className="dress-code scroll-reveal" id="dress-code" data-reveal="scale" aria-labelledby="dress-code-title">
          <p className="eyebrow">Dress code</p>
          <div className="dress-palette">
            <div className="dress-black"><h3 id="dress-code-title">Black</h3></div>
            <div className="dress-gold"><span>A touch of</span><strong>Champagne gold</strong></div>
          </div>
        </aside>
      </section>

      <section className="gallery section" aria-label="Couple photo gallery">
        <div className="gallery-copy scroll-reveal" data-reveal="heading"><p className="eyebrow">A little joy</p><h2>Moments held close</h2></div>
        <figure className="gallery-a scroll-reveal" data-reveal="image"><Image src="/images/joyful-portrait.jpg" fill sizes="(max-width: 700px) 92vw, 46vw" alt="A joyful couple embracing outdoors" /></figure>
        <figure className="gallery-b scroll-reveal reveal-delay-1" data-reveal="image"><Image src="/images/detail-hands-1.jpg" fill sizes="(max-width: 700px) 44vw, 22vw" alt="A couple holding hands" /></figure>
        <figure className="gallery-c scroll-reveal reveal-delay-2" data-reveal="image"><Image src="/images/garden-kiss.jpg" fill sizes="(max-width: 700px) 44vw, 22vw" alt="A couple sharing a quiet moment beside the water" /></figure>
        <figure className="gallery-d scroll-reveal" data-reveal="image"><Image src="/images/monochrome-touch.jpg" fill sizes="(max-width: 700px) 92vw, 46vw" alt="A black and white portrait of a couple reaching for one another" /></figure>
        <figure className="gallery-e scroll-reveal reveal-delay-1" data-reveal="image"><Image src="/images/detail-hands-2.jpg" fill sizes="(max-width: 700px) 44vw, 22vw" alt="A close portrait of intertwined hands" /></figure>
        <figure className="gallery-f scroll-reveal reveal-delay-2" data-reveal="image"><Image src="/images/forest-embrace.jpg" fill sizes="(max-width: 700px) 44vw, 22vw" alt="A couple embracing in golden woodland light" /></figure>
      </section>

      <section className="gift section dark-section">
        <div className="gift-inner scroll-reveal" data-reveal="scale">
          <p className="eyebrow light">With love &amp; gratitude</p>
          <h2>Your presence is our greatest gift</h2>
          <p>Your presence on our special day means a great deal to us. For those wishing to present a gift, we kindly request monetary gifts.</p>
          <div className="gift-values"><div><span>Individual</span><strong>K600</strong></div><div><span>Couple</span><strong>K1,200</strong></div></div>
          <div className="policy"><span>Kindly note</span><p>Strictly one person per invitation unless the invitation has specifically been issued for a couple.</p></div>
        </div>
      </section>

      <section className="rsvp section" id="rsvp">
        <div className="rsvp-intro scroll-reveal" data-reveal="left"><p className="eyebrow">Répondez s’il vous plaît</p><h2>Will You Join Us?</h2><p>We would be honoured to celebrate this special day with you. Kindly confirm your attendance below.</p><p className="queries-line">Questions about the wedding?</p><a className="queries-button" href="https://wa.me/260972281240?text=Hello%20Tabo%2C%20I%20have%20a%20question%20about%20James%20%26%20Diana%27s%20wedding." target="_blank" rel="noreferrer">WhatsApp Tabo Maonde · +260 972 281 240</a><Ornament /></div>
        <div className="rsvp-panel scroll-reveal reveal-delay-1" data-reveal="right">
          {result.state === "success" ? (
            <div className="success" role="status"><span className="success-mark">✓</span><h3>Thank you, {result.message}.</h3><p>Your RSVP has been received.</p><p>Once your attendance has been approved, you will receive your unique guest reference via WhatsApp. Please keep it safely, as it will be required for verification at the event entrance.</p></div>
          ) : (
            <form onSubmit={submitRsvp}>
              <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" required minLength={2} placeholder="Your full name" /></div>
              <div className="field"><label htmlFor="whatsapp">WhatsApp number</label><input id="whatsapp" name="whatsapp" autoComplete="tel" inputMode="tel" required placeholder="0971 234 567" /><small>Zambian formats such as 0971234567 or +260971234567</small></div>
              <fieldset><legend>Attendance</legend><label className="choice"><input type="radio" name="attendance" value="accepts" required /><span>Joyfully accepts</span></label><label className="choice"><input type="radio" name="attendance" value="declines" required /><span>Regretfully declines</span></label></fieldset>
              <label className="agreement"><input type="checkbox" name="allocationAccepted" required /><span>I understand that attendance is limited to the number of guests allocated to this invitation.</span></label>
              <label className="agreement whatsapp-consent"><input type="checkbox" name="whatsappConsent" required /><span>I agree to receive my wedding confirmation and important event updates from James &amp; Diana via WhatsApp.</span></label>
              <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              {result.state === "error" && <p className="form-error" role="alert">{result.message}</p>}
              <button className="button button-dark" type="submit" disabled={result.state === "sending"}>{result.state === "sending" ? "Sending…" : "Submit RSVP"}</button>
              <p className="pending-note">All responses are received as pending approval.</p>
            </form>
          )}
        </div>
      </section>

      <section className="closing">
        <Image src="/images/forest-embrace.jpg" fill sizes="100vw" alt="A couple standing together in warm woodland light" />
        <div className="closing-shade" />
        <div className="closing-copy scroll-reveal" data-reveal="scale"><span className="monogram">J <i>&amp;</i> D</span><p>We can’t wait to celebrate with you</p><h2>James &amp; Diana</h2><span>21 November 2026</span></div>
      </section>

      <footer><p>James &amp; Diana · 21 November 2026</p><p>Produced by <a href="https://picturesque-zm.wixsite.com/studios" target="_blank" rel="noreferrer">Picturesque Studios</a></p></footer>
    </main>
  );
}
