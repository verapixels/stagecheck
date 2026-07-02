import { useNavigate } from "react-router-dom";
import { RiArrowRightSLine, RiLightbulbFlashLine } from "react-icons/ri";

export default function CreateEventHelpCards() {
  const navigate = useNavigate();

  return (
    <section className="ce-section">
      <h2 className="ce-section-title">What do you need help with?</h2>
      <p className="ce-section-sub">Choose an option below and we'll point you in the right direction.</p>

      <div className="ce-help-grid">
        <div className="ce-help-card ce-help-card-purple">
          <img src="/images/create-event-planning-large.jpg" alt="Large event crowd" className="ce-help-card-bg" />
          <div className="ce-help-card-overlay" />
          <div className="ce-help-card-content">
            <h4>Planning a Large Event?</h4>
            <p>Our team can help you plan, set up and execute a successful event.</p>
            <button onClick={() => navigate("/create-event/talk-to-sales")}>
              Talk to Sales <RiArrowRightSLine size={14} />
            </button>
          </div>
        </div>

        <div className="ce-help-card ce-help-card-green">
          <img src="/images/create-event-support-agent.jpg" alt="Support agent" className="ce-help-card-bg" />
          <div className="ce-help-card-overlay" />
          <div className="ce-help-card-content">
            <h4>Need Help?</h4>
            <p>Get support from our team. We're here to help you succeed.</p>
            <button onClick={() => navigate("/create-event/contact-support")}>
              Contact Support <RiArrowRightSLine size={14} />
            </button>
          </div>
        </div>

        <div className="ce-help-card ce-help-card-blue">
          <div className="ce-help-card-icon">
            <RiLightbulbFlashLine size={48} />
          </div>
          <div className="ce-help-card-content">
            <h4>Have Questions?</h4>
            <p>Check our resources or FAQs to find answers instantly.</p>
            <button onClick={() => navigate("/create-event/resources")}>
              Browse Resources <RiArrowRightSLine size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}