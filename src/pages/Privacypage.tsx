import LegalLayout from '../components/Legallayout'

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We take your privacy seriously. This policy explains what data StageCheck collects, how we use it, and the choices you have."
      lastUpdated="17 June 2026"
    >

      <div className="legal-section">
        <div className="legal-highlight">
          <p className="legal-p" style={{ marginBottom: 0 }}>
            StageCheck is built to help event organizers run great events — not to monetize your data. We collect only what we need to make the platform work, and we never sell your personal information to third parties.
          </p>
        </div>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">1. Who This Policy Applies To</h2>
        <p className="legal-p">
          This Privacy Policy applies to all users of the StageCheck platform, including event organizers who create and manage events, and event participants who submit information through organizer-created registration forms.
        </p>
        <p className="legal-p">
          If you are a participant submitting information through an event form, the event organizer is also a data controller for your information. Please contact your event organizer directly for questions about how they handle your data.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">2. Information We Collect</h2>
        <p className="legal-p"><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Account information:</strong> When you create a StageCheck account, we collect your name (or display name), email address, and authentication data. If you sign in via a third-party provider (such as Google), we receive basic profile data from that provider.</p>
        <p className="legal-p"><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Event data:</strong> Information you enter when creating events — including event name, type, date, location, join codes, and enabled modules.</p>
        <p className="legal-p"><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Submission data:</strong> Information submitted by event participants through your event registration forms — such as names, email addresses, song titles, photos, bios, audio files, and any other fields you have enabled.</p>
        <p className="legal-p"><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Usage data:</strong> Technical data about how you interact with the platform, including browser type, device type, pages visited, actions taken, and general location data (country/region level). This helps us improve the platform.</p>
        <p className="legal-p"><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Communications:</strong> If you contact us via email or through the platform, we retain those communications to help resolve your queries.</p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">3. How We Use Your Information</h2>
        <p className="legal-p">We use the information we collect to:</p>
        <ul className="legal-ul">
          <li className="legal-li">Create and manage your StageCheck account</li>
          <li className="legal-li">Provide the platform's event management features and services</li>
          <li className="legal-li">Send transactional emails (such as event submission notifications and account alerts)</li>
          <li className="legal-li">Improve platform performance, fix bugs, and develop new features</li>
          <li className="legal-li">Respond to your support queries and communications</li>
          <li className="legal-li">Ensure platform security and prevent fraudulent activity</li>
          <li className="legal-li">Comply with legal obligations</li>
        </ul>
        <p className="legal-p">We do not use your data to serve third-party advertising, and we do not sell or rent your personal information to any third party.</p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">4. Legal Basis for Processing</h2>
        <p className="legal-p">We process your personal data on the following legal bases:</p>
        <ul className="legal-ul">
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Contract:</strong> Processing necessary to provide the services you've signed up for</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Legitimate interests:</strong> Improving the platform, ensuring security, and communicating platform updates</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Legal obligation:</strong> Where we are required to process data to comply with applicable law</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Consent:</strong> For optional cookies and analytics (see Section 7)</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">5. Data Sharing</h2>
        <p className="legal-p">We share your data only in limited circumstances:</p>
        <ul className="legal-ul">
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Service providers:</strong> We use trusted third-party services to operate the platform, including Firebase (Google) for database and authentication, and Resend for transactional email. These providers process data only as instructed by us.</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Legal requirements:</strong> We may disclose data if required by law, court order, or governmental authority.</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Business transfers:</strong> If StageCheck is ever acquired or merged with another entity, your data may be transferred as part of that transaction. We will notify you before this happens.</li>
        </ul>
        <p className="legal-p">We never share your data with advertisers or data brokers.</p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">6. Data Retention</h2>
        <p className="legal-p">
          We retain your account data for as long as your account is active. Event data and participant submissions are retained for as long as the associated event exists in your account.
        </p>
        <p className="legal-p">
          When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required by law to retain it for longer.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">7. Cookies and Tracking</h2>
        <p className="legal-p">StageCheck uses cookies and similar technologies for the following purposes:</p>
        <ul className="legal-ul">
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Essential cookies:</strong> Required to keep you logged in and the platform functioning correctly. These cannot be disabled.</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Analytics cookies:</strong> Help us understand how the platform is used so we can improve it. You can opt out of these via the cookie banner.</li>
        </ul>
        <p className="legal-p">You can manage your cookie preferences at any time through the cookie banner shown on your first visit, or by updating your browser settings.</p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">8. Your Rights</h2>
        <p className="legal-p">Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul className="legal-ul">
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Correction:</strong> Request that we correct inaccurate or incomplete data</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Deletion:</strong> Request that we delete your personal data</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Portability:</strong> Request a copy of your data in a portable format</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Objection:</strong> Object to our processing of your data for legitimate interests</li>
          <li className="legal-li"><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Withdraw consent:</strong> Withdraw any consent you have previously given at any time</li>
        </ul>
        <p className="legal-p">
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:hello@stagecheck.com" className="legal-link">hello@stagecheck.com</a>. We will respond within 30 days.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">9. Data Security</h2>
        <p className="legal-p">
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, or misuse. This includes encrypted data transmission (HTTPS), secure authentication via Firebase Auth, and strict access controls on our systems.
        </p>
        <p className="legal-p">
          While we take security seriously, no system is perfectly secure. If you become aware of any security vulnerability affecting the platform, please notify us immediately at{' '}
          <a href="mailto:hello@stagecheck.com" className="legal-link">hello@stagecheck.com</a>.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">10. International Transfers</h2>
        <p className="legal-p">
          StageCheck is a global platform. Your data may be stored and processed in countries outside your own, including the United States where our infrastructure providers (Firebase/Google) operate. We ensure appropriate safeguards are in place for any such transfers.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">11. Children's Privacy</h2>
        <p className="legal-p">
          StageCheck is not intended for use by children under 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has submitted data through the platform, please contact us and we will delete it promptly.
        </p>
        <p className="legal-p">
          For events involving minors as participants, event organizers are responsible for obtaining appropriate parental consent before collecting any participant data.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">12. Changes to This Policy</h2>
        <p className="legal-p">
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Your continued use of StageCheck after the changes take effect constitutes your acceptance of the updated policy.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">13. Contact Us</h2>
        <p className="legal-p">
          For any privacy-related questions, requests, or concerns, contact us at:{' '}
          <a href="mailto:hello@stagecheck.com" className="legal-link">hello@stagecheck.com</a>
        </p>
      </div>

    </LegalLayout>
  )
}