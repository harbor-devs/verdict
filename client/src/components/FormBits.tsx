import type { ReactNode } from 'react'

type FieldProps = { id: string; label: string; error?: string; children: ReactNode }

export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-receipt text-xs tracking-widest text-muted uppercase"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-no">{error}</p>}
    </div>
  )
}

type ChipsProps = { ideas: string[]; value: string; onPick: (idea: string) => void }

// Small tags to click instead of the browser's own dropdown list.
export function CategoryChips({ ideas, value, onPick }: ChipsProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Category ideas">
      {ideas.map((idea) => {
        const active = value.trim().toLowerCase() === idea
        return (
          <button
            key={idea}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(idea)}
            className={`rounded-sm border-2 border-edge px-2 py-1 font-receipt text-xs uppercase transition ${
              active ? 'bg-highlight' : 'bg-card hover:bg-highlight/50'
            }`}
          >
            {idea}
          </button>
        )
      })}
    </div>
  )
}