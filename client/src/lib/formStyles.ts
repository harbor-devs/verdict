// Shared look for form inputs and the main button. Only classes, no logic.

export function inputClass(hasError: boolean): string {
  return `mt-0.5 w-full border-0 border-b-2 bg-transparent px-0 py-1.5 font-receipt text-lg outline-none transition focus:bg-highlight/30 ${
    hasError ? 'border-no' : 'border-edge focus:border-yes'
  }`
}

export const primaryButtonClass =
  'h-12 w-full rounded-sm bg-ink font-receipt text-sm font-bold tracking-widest text-paper uppercase transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60'