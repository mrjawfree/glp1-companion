import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 mb-8 inline-block">&larr; Back to app</Link>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 6, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">What We Collect</h2>
            <p>When you use the GLP-1 Companion App, we collect:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Account information: Your name and email address</li>
              <li>Health &amp; medication data: Medication name, dosage, injection logs, and schedules</li>
              <li>Body measurements: Weight and other measurements you log</li>
              <li>Nutrition data: Meal logs you enter</li>
              <li>Device data: Push notification subscription token</li>
            </ul>
            <p className="mt-3">We collect only the information you actively provide. We do not use advertising SDKs, analytics trackers, or sell your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Why We Collect It</h2>
            <p>We use your data solely to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Power the app's core features (logging, reminders, progress tracking)</li>
              <li>Send push notifications you've opted into</li>
              <li>Store your data so it's available across sessions and devices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">How It's Stored and Secured</h2>
            <p>Your data is stored in Supabase, a cloud database service hosted in the United States. All data is encrypted in transit (TLS) and at rest. Access is restricted to your account — we do not have routine access to your personal health data.</p>
            <p className="mt-3">We do not share, sell, or license your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access your data at any time within the app</li>
              <li>Export your data using the built-in data export feature</li>
              <li>Delete your account and all associated data by contacting us or using the in-app delete option</li>
            </ul>
            <p className="mt-3">We will fulfill access and deletion requests within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Children</h2>
            <p>This app is not intended for users under 18. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Changes to This Policy</h2>
            <p>We will notify you within the app if we make material changes to this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Contact</h2>
            <p>For privacy questions or requests, contact us at: <a href="mailto:privacy@yourdomain.com" className="text-blue-600 hover:underline">privacy@yourdomain.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
