import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowRightUpLine, RiPlayCircleLine } from "react-icons/ri";

const HERO_IMAGES = [
  "/images/create-event-hero-1.jpg",
  "/images/create-event-hero-2.jpg",
  "/images/create-event-hero-3.jpg",
];

// All phrases grammatically complete: "Create an [phrase] in Minutes"
const TYPED_PHRASES = [
  "Amazing Event",
  "Unforgettable Night",
  "Epic Festival",
  "Incredible Conference",
];

function useTypewriter(phrases: string[], typeSpeed = 70, pause = 2000, deleteSpeed = 40) {
  const [text, setText] = useState(phrases[0]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Delay starting so the page renders first (performance)
    const startDelay = setTimeout(() => setStarted(true), 1200);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!started) return;
    const current = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
    } else if (!deleting && text.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed);
    } else if (deleting && text.length === 0) {
      setDeleting(false);
      setPhraseIndex((i) => i + 1);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, typeSpeed, pause, deleteSpeed, started]);

  return text;
}

export default function CreateEventHero() {
  const navigate = useNavigate();
  const typed = useTypewriter(TYPED_PHRASES);
  const [activeImg, setActiveImg] = useState(0);
  const [prevImg, setPrevImg] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveImg((i) => {
        setPrevImg(i);
        return (i + 1) % HERO_IMAGES.length;
      });
    }, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <section className="ce-hero">
      <div className="ce-hero-left">
        {/* 
          Sentence structure: "Create an [TYPED] in Minutes"
          All on separate lines but grammatically one sentence.
          Fixed heights prevent layout shift.
        */}
        <h1 className="ce-hero-title">
          <span className="ce-title-static">Create an</span>
          <span className="ce-title-typed-row" aria-label="animated phrase">
            <span className="ce-accent">{typed}</span>
            <span className="ce-typed-cursor" aria-hidden="true">|</span>
          </span>
          <span className="ce-title-static">in Minutes</span>
        </h1>

        <p className="ce-hero-sub">
          From setup to sell-out, StageCheck gives you everything you need to create, manage and grow events people love.
        </p>

        <div className="ce-hero-actions">
          <button className="ce-btn-solid" onClick={() => navigate("/signup")}>
            Get Started Now <RiArrowRightUpLine size={15} />
          </button>
          <button className="ce-btn-text" onClick={() => navigate("/create-event/quick-tour")}>
            <RiPlayCircleLine size={17} /> Watch Quick Tour
          </button>
        </div>
      </div>

      <div className="ce-hero-right">
        <div className="ce-hero-img-stack">
          {prevImg !== null && (
            <img
              key={`prev-${prevImg}`}
              src={HERO_IMAGES[prevImg]}
              alt=""
              className="ce-hero-img ce-hero-img-fading"
              loading="lazy"
              decoding="async"
            />
          )}
          <img
            key={`active-${activeImg}`}
            src={HERO_IMAGES[activeImg]}
            alt="Live event crowd on stage"
            className="ce-hero-img ce-hero-img-active"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="ce-hero-badge">
          <div className="ce-hero-badge-avatars">
            <span className="ce-avatar-dot" style={{ background: "rgba(13,199,94,0.7)" }} />
            <span className="ce-avatar-dot" style={{ background: "rgba(13,199,94,0.45)" }} />
            <span className="ce-avatar-dot" style={{ background: "rgba(13,199,94,0.25)" }} />
          </div>
          <div className="ce-hero-badge-text">
            <strong>Join 10,000+ organizers</strong>
            <span>who've created unforgettable events on StageCheck</span>
          </div>
        </div>
      </div>
    </section>
  );
}