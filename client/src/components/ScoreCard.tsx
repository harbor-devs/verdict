import type { ScoreBand, ScoreResponse } from '../api/types'

type Props = { score: ScoreResponse['score'] }

// Each band gets a stamp colour. The words come from the server, only the look lives here.
const BAND_STYLE: Record<ScoreBand, { label: string; text: string; border: string }> = {
  solid: { label: 'Solid', text: 'text-yes', border: 'border-yes' },
  okay: { label: 'Okay', text: 'text-yes', border: 'border-yes' },
  shaky: { label: 'Shaky', text: 'text-risky', border: 'border-risky' },
  rough: { label: 'Rough', text: 'text-no', border: 'border-no' },
}

const PARTS = [
  { key: 'savings', label: 'Savings rate' },
  { key: 'budgets', label: 'Budget discipline' },
  { key: 'goals', label: 'Goals progress' },
  { key: 'cushion', label: 'Cushion' },
] as const

export default function ScoreCard({ score }: Props) {
  // No income this month: the server refuses to invent a number, so we show its message.
  if (score.status === 'not_enough_data') {
    return (
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Money score</h2>
        <p className="mt-2 text-muted">{score.message}</p>
      </section>
    )
  }

  const band = BAND_STYLE[score.band]

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Money score</h2>
          <p className="mt-0.5 text-sm text-muted">This month</p>
        </div>
        <div
          className={`-rotate-6 rounded-md border-2 px-2.5 py-1 font-display text-sm font-bold tracking-wider uppercase ${band.text} ${band.border}`}
        >
          {band.label}
        </div>
      </div>

      <p className="mt-4 font-mono text-5xl font-medium">
        {score.score}
        <span className="text-xl text-muted">/100</span>
      </p>
      <p className="mt-2">{score.message}</p>

      <dl className="mt-5 divide-y divide-dashed divide-line border-y border-dashed border-line">
        {PARTS.map((part) => (
          <div key={part.key} className="flex items-center justify-between py-2.5 text-sm">
            <dt>{part.label}</dt>
            <dd className="font-mono">
              {score.parts[part.key]}/{score.maxPoints[part.key]}
            </dd>
          </div>
        ))}
      </dl>

      {score.tips.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          {score.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </section>
  )
}