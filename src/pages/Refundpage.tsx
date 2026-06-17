import LegalLayout from '../components/Legallayout'

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="StageCheck is currently free to use. Here's everything you need to know about our refund policy, now and as we grow."
      lastUpdated="17 June 2025"
    >

      <div className="legal-section">
        <div className="legal-highlight">
          <p className="legal-p" style={{ marginBottom: 0 }}>
            <strong style={{ color: '#22C55E' }}>StageCheck is currently free.</strong> All features are available at no cost, so there is nothing to refund at this time. This policy explains our commitments as we introduce paid plans in the future.
          </p>
        </div>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">1. Current Plan: Free</h2>
        <p className="legal-p">
          StageCheck is currently offered as a free platform. You can create an account, manage events, invite participants, and access all available features without any payment. As a result, no charges are made and no refunds are applicable under the current plan.
        </p>
        <p className="legal-p">
          We reserve the right to introduce paid plans in the future. When we do, this Refund Policy will be updated to reflect the specific terms that apply to those plans. You will be notified of any changes in advance.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">2. Future Paid Plans</h2>
        <p className="legal-p">
          When paid plans become available, StageCheck intends to operate on a subscription-based model (monthly or annual billing). The following principles will guide our refund approach:
        </p>
        <ul className="legal-ul">
          <li className="legal-li">Annual subscriptions that are cancelled within 14 days of payment will be eligible for a full refund if the plan has not been meaningfully used</li>
          <li className="legal-li">Monthly subscriptions will generally not be refunded once the billing period has started, unless required by applicable law</li>
          <li className="legal-li">Refunds for exceptional circumstances (such as accidental purchases or platform-wide outages) will be assessed on a case-by-case basis</li>
        </ul>
        <p className="legal-p">
          These are intended guidelines. The exact refund terms will be clearly stated when paid plans are launched.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">3. No Obligation to Continue</h2>
        <p className="legal-p">
          You are never obligated to pay for StageCheck. You can stop using the platform at any time and delete your account through your account settings. We will not charge you for anything you have not explicitly agreed to purchase.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">4. Platform-Side Issues</h2>
        <p className="legal-p">
          If StageCheck ever experiences a significant outage or technical failure that prevents you from running an event or accessing your data — and you are on a paid plan at the time — we will review the situation and provide appropriate compensation, which may include account credit or a pro-rated refund for the affected period.
        </p>
        <p className="legal-p">
          We will not be liable for losses, damages, or costs incurred by you as a result of platform unavailability beyond what is described in this policy and our Terms of Service.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">5. Third-Party Services</h2>
        <p className="legal-p">
          StageCheck does not process payments directly at this time. If any third-party payment processor is used in the future (such as Stripe or Paystack), refunds processed through those services will be subject to the processor's own policies and timelines in addition to ours.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">6. Contact Us</h2>
        <p className="legal-p">
          If you have any questions about this Refund Policy, or if you believe a charge has been made in error, please reach out to us at:{' '}
          <a href="mailto:hello@stagecheck.app" className="legal-link">hello@stagecheck.app</a>
        </p>
        <p className="legal-p">
          We aim to respond to all billing-related queries within 2 business days.
        </p>
      </div>

    </LegalLayout>
  )
}