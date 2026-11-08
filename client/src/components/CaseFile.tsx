import type { ReactNode } from 'react'
import { currentCase } from '../lib/caseNumber'

type HeaderProps = { label: string; title: string; note?: string }

export function PageHeader({ label, title, note }: HeaderProps) {
  return (
    <header className="mb-5 md:mb-6">
      <p className="font-receipt text-xs tracking-widest text-muted uppercase">
        Case no. {currentCase()} · {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        {note && (
          <span className="inline-block -rotate-3 font-hand text-2xl text-no md:text-3xl">
            {note}
          </span>
        )}
      </div>
    </header>
  )
}

type CardProps = { tab?: string; className?: string; children: ReactNode }

export function Card({ tab, className = '', children }: CardProps) {
  return (
    <section
      className={`relative rounded-[10px] border-2 border-edge bg-card p-5 shadow-hard ${
        tab ? 'pt-7' : ''
      } ${className}`}
    >
      {tab && (
        <div className="absolute -top-[15px] left-4 border-2 border-edge bg-highlight px-2.5 py-0.5 font-receipt text-xs font-bold tracking-widest uppercase">
          {tab}
        </div>
      )}
      {children}
    </section>
  )
}