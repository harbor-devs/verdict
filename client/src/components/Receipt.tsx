import type { ReactNode } from 'react'
import { currentCase } from '../lib/caseNumber'
import './Receipt.css'

// Always place rows inside a <dl> element
export function LedgerRow({
  label,
  value,
  valueClassName = '',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="ledger-row text-base">
      <dt>{label}</dt>
      <dd className={`font-receipt font-bold ${valueClassName}`}>{value}</dd>
    </div>
  )
}

type Tone = 'yes' | 'risky' | 'no'
type Size = 'sm' | 'md' | 'lg'

const TONE_CLASS: Record<Tone, string> = {
  yes: 'text-yes border-yes',
  risky: 'text-risky border-risky',
  no: 'text-no border-no',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'm-1 border-2 px-2 text-sm',
  md: 'm-1.5 border-[3px] px-3 py-0.5 text-xl',
  lg: 'm-1.5 border-4 px-4 py-1 text-3xl',
}

export function Stamp({
  tone,
  size = 'md',
  children,
}: {
  tone: Tone
  size?: Size
  children: ReactNode
}) {
  return (
    <div
      className={`stamp font-receipt font-bold tracking-widest whitespace-nowrap uppercase ${SIZE_CLASS[size]} ${TONE_CLASS[tone]}`}
    >
      {children}
    </div>
  )
}

// A cream plate so the stamp stays readable when it hangs over a dark card.
// Put it inside a card that has "relative".
export function StampPlate({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className="absolute -top-7 right-6 rotate-[4deg] rounded-md bg-paper p-1">
      <Stamp tone={tone} size="lg">
        {children}
      </Stamp>
    </div>
  )
}

// A white till receipt with torn zigzag edges. On laptops it fills the height it is
// given, and the content you put inside scrolls inside the paper if it is too long.
export function ReceiptPaper({ title, children }: { title: string; children: ReactNode }) {
  const today = new Date().toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="receipt-shadow h-full min-h-0">
      <section className="receipt flex h-full min-h-0 flex-col px-5 py-7 text-ink">
        <p className="text-center font-receipt text-base font-bold tracking-widest uppercase">
          {title}
        </p>
        <p className="text-center font-receipt text-xs text-muted uppercase">
          No. {currentCase()} · {today}
        </p>
        <div className="my-2 shrink-0 border-t-2 border-dashed border-line" />

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        <div className="receipt-barcode mx-auto mt-3 h-6 w-4/5 shrink-0" aria-hidden="true" />
      </section>
    </div>
  )
}