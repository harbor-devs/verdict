export default function App() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Verdict<span className="text-yes">.</span>
      </h1>
      <p className="mt-1 text-muted">Money with receipts.</p>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-muted">Can I afford this?</p>
        <p className="mt-1 font-mono text-3xl font-medium">Rs 3,200.00</p>

        <div className="mt-5 flex gap-3">
          <span className="-rotate-6 rounded-md border-2 border-yes px-3 py-1 font-display text-xl font-extrabold tracking-wide text-yes">
            YES
          </span>
          <span className="rotate-3 rounded-md border-2 border-risky px-3 py-1 font-display text-xl font-extrabold tracking-wide text-risky">
            RISKY
          </span>
          <span className="-rotate-3 rounded-md border-2 border-no px-3 py-1 font-display text-xl font-extrabold tracking-wide text-no">
            NO
          </span>
        </div>
      </section>
    </main>
  )
}