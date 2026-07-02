import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiArrowRightLine,
  RiArrowRightUpLine,
  RiCheckboxMultipleLine,  
  RiLightbulbLine,         
  RiVideoLine,
  RiLayoutGridLine,
} from "react-icons/ri";

const TOOLS = [
  {
    to: "/create-event/checklist",
    img: "/images/tools-checklist.jpg",
    icon: <RiCheckboxMultipleLine size={22} />,   
    iconBg: "#0dc75e",
    label: "PLANNING",
    title: "Event Checklist",
    desc: "A step-by-step checklist to help you plan the perfect event from start to finish.",
    cta: "View Checklist",
  },
  {
    to: "/create-event/best-practices",
    img: "/images/tools-best-practices.jpg",
    icon: <RiLightbulbLine size={22} />,       
    iconBg: "#f59e0b",
    label: "TIPS",
    title: "Best Practices",
    desc: "Learn what top event organizers do differently to consistently sell out their events.",
    cta: "Explore Tips",
  },
  {
    to: "/create-event/video-tutorials",
    img: "/images/tools-video-tutorials.jpg",
    icon: <RiVideoLine size={22} />,
    iconBg: "#7c3aed",
    label: "VIDEO",
    title: "Video Tutorials",
    desc: "Watch short, focused videos that walk you through every feature on StageCheck.",
    cta: "Watch Now",
  },
  {
    to: "/create-event/templates",
    img: "/images/tools-templates.jpg",
    icon: <RiLayoutGridLine size={22} />,
    iconBg: "#0891b2",
    label: "TEMPLATES",
    title: "Templates",
    desc: "Pre-built event templates — pick one, customize it, and go live in under 10 minutes.",
    cta: "Browse Templates",
  },
];

function ToolCard({ tool, delay, inView }: { tool: typeof TOOLS[0]; delay: number; inView: boolean }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`ce-tool-card ${inView ? "ce-tool-card-in" : ""}`}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(tool.to)}
    >
      {/* Image area */}
      <div className="ce-tool-img-wrap">
        <img
          src={tool.img}
          alt={tool.title}
          className={`ce-tool-img ${hovered ? "ce-tool-img-zoomed" : ""}`}
          loading="lazy"
          decoding="async"
        />
        <div className="ce-tool-img-gradient" />

        {/* Category label top-left */}
        <span className="ce-tool-label" style={{ background: `${tool.iconBg}22`, border: `1px solid ${tool.iconBg}55`, color: tool.iconBg }}>
          {tool.label}
        </span>

        {/* Icon badge center-bottom of image */}
        <div className="ce-tool-icon-badge" style={{ background: tool.iconBg }}>
          {tool.icon}
        </div>
      </div>

      {/* Text body */}
      <div className="ce-tool-body">
        <h5 className="ce-tool-title">{tool.title}</h5>
        <p className="ce-tool-desc">{tool.desc}</p>
        <div className={`ce-tool-cta ${hovered ? "ce-tool-cta-in" : ""}`}>
          <span>{tool.cta}</span>
          <RiArrowRightLine size={14} />
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="ce-tool-accent-bar"
        style={{
          background: tool.iconBg,
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
        }}
      />
    </div>
  );
}

export default function CreateEventToolsResources() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="ce-section" ref={sectionRef}>
      <div className="ce-tools-header">
        <div>
          <h2 className="ce-section-title">Tools &amp; Resources</h2>
          <p className="ce-section-sub">Everything you need to plan and run a successful event.</p>
        </div>
        <button className="ce-link-purple" onClick={() => navigate("/create-event/resources")}>
          Browse All Resources <RiArrowRightUpLine size={13} />
        </button>
      </div>

      <div className="ce-tools-grid">
        {TOOLS.map((t, i) => (
          <ToolCard key={t.to} tool={t} delay={i * 0.1} inView={inView} />
        ))}
      </div>
    </section>
  );
}