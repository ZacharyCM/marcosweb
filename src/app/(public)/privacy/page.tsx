export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What We Collect</h2>
        <p>We collect your name, email address, and account status (pending, approved, or denied) when you register for access to this site.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Why We Collect It</h2>
        <p>This information is used solely to manage access to the Pure Pressure product menu. We do not sell, share, or use your data for marketing purposes.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How Long We Retain It</h2>
        <p>Your account information is retained until you request deletion. To request deletion of your account and associated data, contact us directly.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cookies</h2>
        <p>We use a single age-verification cookie (valid for 365 days) to remember that you have confirmed you are 21 or older. We use a session cookie to keep you logged in. No third-party tracking cookies are used.</p>
      </section>
    </main>
  )
}
