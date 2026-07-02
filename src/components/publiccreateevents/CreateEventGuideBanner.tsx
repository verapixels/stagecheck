import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowRightUpLine } from "react-icons/ri";

export default function CreateEventGuideBanner() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={`ce-guide-banner ${inView ? "ce-guide-banner-in" : ""}`}>
      {/* Full cover background image */}
      <img src="/images/create-event-guide-banner.jpg" alt="" className="ce-guide-banner-img" />
      {/* Tint — sits exactly on top of image, below content */}
      <div className="ce-guide-banner-tint" />
      {/* Content */}
      <div className="ce-guide-text">
        <h3>New to event planning?</h3>
        <p>We'll walk you through every step to help you create your first event with ease.</p>
        <button className="ce-btn-ghost-sm" onClick={() => navigate("/how-it-works")}>
          Learn How It Works <RiArrowRightUpLine size={13} />
        </button>
      </div>
      <div className="ce-guide-stamp">STEP BY<br />GUIDE</div>
    </section>
  );
}