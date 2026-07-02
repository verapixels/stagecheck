import { useNavigate } from "react-router-dom";
import { RiHeadphoneLine, RiArrowRightSLine, RiChat3Line } from "react-icons/ri";

export default function CreateEventSupportStrip() {
  const navigate = useNavigate();

  return (
    <section className="ce-support-strip">
      <div className="ce-support-strip-left">
        <div className="ce-support-strip-icon">
          <RiHeadphoneLine size={20} />
        </div>
        <div>
          <h5>Still have questions?</h5>
          <p>Our support team is available 24/7 to help you.</p>
        </div>
      </div>
      <div className="ce-support-strip-right">
        <button className="ce-btn-outline-green" onClick={() => navigate("/create-event/contact-support")}>
          Contact Support <RiArrowRightSLine size={14} />
        </button>
        <button className="ce-icon-btn-green" onClick={() => navigate("/create-event/chat")}>
          <RiChat3Line size={18} />
        </button>
      </div>
    </section>
  );
}