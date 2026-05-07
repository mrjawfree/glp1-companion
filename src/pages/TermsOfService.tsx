import { Link } from 'react-router-dom'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 mb-8 inline-block">&larr; Back to app</Link>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 6, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">What This Service Is</h2>
            <p>The GLP-1 Companion App is a personal health tracking tool designed to help users manage GLP-1 medication schedules, log meals and body measurements, and track progress over time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">User Responsibilities</h2>
            <p>By using this app, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide accurate information when logging data</li>
              <li>Keep your account credentials secure and not share them</li>
              <li>Use the app only for lawful, personal purposes</li>
              <li>Not attempt to access other users' data or reverse-engineer the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Health Disclaimer — Not Medical Advice</h2>
            <p>This app does not provide medical advice. Nothing in this app — including medication reminders, dosage logs, or any content — should be interpreted as medical advice, diagnosis, or treatment recommendations.</p>
            <p className="mt-3">Always consult a qualified healthcare provider before making decisions about your medication, diet, or health regimen. Do not use this app as a substitute for professional medical care.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, the GLP-1 Companion App and its developers are not liable for any indirect, incidental, or consequential damages arising from your use of the app, including reliance on any health-related content or features within it.</p>
            <p className="mt-3">The app is provided "as is" without warranty of any kind.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the app after changes are posted constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:legal@yourdomain.com" className="text-blue-600 hover:underline">legal@yourdomain.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
