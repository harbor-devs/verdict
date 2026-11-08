import type { ScoreBand, ScoreResponse } from '../api/types'
import { StampPlate } from './Receipt'

type Props = { score: ScoreResponse['score'] }

// Each band gets a stamp colour. The words come from the server, only the look lives here.
const BAND_STYLE: Record<ScoreBand, { label: string; tone: 'yes' | 'risky' | 'no' }> = {
  solid: { label: 'Solid', tone: 'yes' },
  okay: { label: 'Okay', tone: 'yes' },
  shaky: { label: 'Shaky', tone: 'risky' },
  rough: { label: 'Rough', tone: 'no' },
}

const PARTS = [
  { key: 'savings', label: 'Savings' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'goals', label: 'Goals' },
  { key: 'cushion', label: 'Cushion' },
] as const

const CARD =
  'relative rounded-[10px] border-2 border-edge bg-roast px-6 pt-8 pb-6 text-paper shadow-hard-yellow'

export default function ScoreCard({ score }: Props) {
  // No income this month: the server refuses to invent a number, so we show its message.
  if (score.status === 'not_enough_data') {
    return (
      <section className={CARD}>
        <p className="font-receipt text-xs font-bold tracking-widest text-highlight uppercase">
          The verdict
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
          {score.message}
        </h2>
      </section>
    )
  }

  const band = BAND_STYLE[score.band]
  // Display only: how many of the 10 boxes to fill
  const filled = Math.round(Number(score.score) / 10)

  return (
    <section className={CARD}>
      <StampPlate tone={band.tone}>{band.label}</StampPlate>

      <p className="font-receipt text-xs font-bold tracking-widest text-highlight uppercase">
        The verdict
      </p>

      <h2 className="mt-3 font-display text-3xl leading-[1.05] font-extrabold tracking-tight md:text-5xl">
        {score.message}
      </h2>

      <div className="mt-5 flex items-end gap-4">
        <p className="font-display text-5xl leading-none font-extrabold">
          {score.score}
          <span className="ml-1 text-xl text-roast-muted">/ 100</span>
        </p>
        <div className="mb-1.5 flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className={`h-3.5 flex-1 ${index < filled ? 'bg-highlight' : 'bg-paper/15'}`}
            />
          ))}
        </div>
      </div>

      <p className="mt-5 font-receipt text-xs tracking-widest text-roast-muted uppercase">
        How the court scored it
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        {PARTS.map((part) => (
          <div key={part.key} className="rounded border-2 border-paper/30 px-2.5 py-1.5">
            <dt className="font-receipt text-xs tracking-wider text-roast-muted uppercase">
              {part.label}
            </dt>
            <dd className="font-receipt font-bold">
              {score.parts[part.key]}/{score.maxPoints[part.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}