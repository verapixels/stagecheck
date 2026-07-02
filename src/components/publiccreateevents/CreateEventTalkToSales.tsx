import { useEffect, useRef, useState } from "react";
import { RiArrowRightLine, RiCheckLine, RiArrowDownSLine } from "react-icons/ri";

const SALES_FUNCTION_URL = "https://us-central1-stagecheck.cloudfunctions.net/sendSalesInquiry";
// ↑ replace "stagecheck" with your actual Firebase project ID if different

const EVENT_TYPES = ["Corporate Event", "Conference & Seminar", "Festival or Concert", "Private / Exclusive Event", "Other"];

function CustomDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="ce-dropdown" ref={ref}>
      <button type="button" className="ce-dropdown-trigger" onClick={() => setOpen((v) => !v)}>
        <span className={value ? "" : "ce-dropdown-placeholder"}>{value || "Event Type"}</span>
        <RiArrowDownSLine size={16} className={`ce-dropdown-chevron ${open ? "ce-dropdown-chevron-open" : ""}`} />
      </button>
      <div className={`ce-dropdown-menu ${open ? "ce-dropdown-menu-open" : ""}`}>
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`ce-dropdown-item ${value === t ? "ce-dropdown-item-active" : ""}`}
            onClick={() => { onChange(t); setOpen(false); }}
          >
            {t}
            {value === t && <RiCheckLine size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateEventTalkToSales() {
  const [form, setForm] = useState({ firstName: "", lastName: "", workEmail: "", eventType: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.workEmail.trim()) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(SALES_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          workEmail: form.workEmail,
          eventType: form.eventType,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setForm({ firstName: "", lastName: "", workEmail: "", eventType: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="ce-section ce-sales-section" id="talk-to-sales">
      <div className="ce-sales-grid">
        <div className="ce-sales-left">
          <img src="/images/create-event-talk-sales.jpg" alt="Stage lights" className="ce-sales-bg" />
          <div className="ce-sales-overlay" />
          <div className="ce-sales-left-content">
            <h3>Need help with a large or complex event?</h3>
            <p>Our event specialists can help you with custom setups, integrations and everything in between.</p>
            <ul>
              <li><RiCheckLine size={15} /> Corporate events</li>
              <li><RiCheckLine size={15} /> Conferences &amp; Seminars</li>
              <li><RiCheckLine size={15} /> Festivals &amp; Concerts</li>
              <li><RiCheckLine size={15} /> Private &amp; Exclusive Events</li>
            </ul>
          </div>
        </div>

        <div className="ce-sales-right">
          <h3>Talk to Sales</h3>
          <p>Fill out the form below and our team will get back to you.</p>

          <div className="ce-form-row">
            <input
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
            <input
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>

          <input
            placeholder="Work Email"
            type="email"
            value={form.workEmail}
            onChange={(e) => handleChange("workEmail", e.target.value)}
            style={{ marginBottom: 10, width: "100%" }}
          />

          <CustomDropdown value={form.eventType} onChange={(v) => handleChange("eventType", v)} />

          <textarea
            placeholder="Tell us about your event..."
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
            rows={3}
            style={{ marginTop: 10 }}
          />

          <button
            className={`ce-btn-sales-submit ${status === "loading" ? "ce-btn-sales-loading" : ""}`}
            onClick={handleSubmit}
            disabled={status === "loading"}
          >
            <span className="ce-btn-sales-label">
              {status === "loading" ? "" : "Send Request"}
            </span>
            {status === "loading" ? (
              <span className="ce-btn-spinner" />
            ) : (
              <RiArrowRightLine size={15} className="ce-btn-sales-arrow" />
            )}
          </button>

          {status === "success" && (
            <p className="ce-form-status ce-form-status-success">
              Thanks! We've received your request — check your email for confirmation.
            </p>
          )}
          {status === "error" && (
            <p className="ce-form-status ce-form-status-error">
              Please fill in your first name, last name and work email, then try again.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}