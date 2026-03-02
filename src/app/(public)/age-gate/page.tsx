import { confirmAge } from "@/app/actions/age-gate"

export default function AgeGatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Pure Pressure</h1>
        <p className="text-gray-600">
          You must be 21 or older to enter this site.
        </p>
        <p className="text-sm text-gray-500">
          For adults 21+ only. For use where legal.
        </p>
        <form action={confirmAge}>
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-6 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            I am 21 or older — Enter
          </button>
        </form>
        <p className="text-xs text-gray-400">
          By entering, you confirm you are of legal age in your jurisdiction.
        </p>
      </div>
    </main>
  )
}
