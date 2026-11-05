// The shapes of data the backend sends to the Home screen.

export type SummaryResponse = {
  summary: {
    month: string // like "2026-11"
    balance: string // rupees as text, like "1234.50"
    monthIncome: string
    monthExpenses: string
  }
}

export type ScoreBand = 'solid' | 'okay' | 'shaky' | 'rough'

export type ScoreParts = {
  savings: number
  budgets: number
  goals: number
  cushion: number
}

export type ScoreResponse = {
  score:
    | { status: 'not_enough_data'; message: string }
    | {
        status: 'ok'
        score: number
        band: ScoreBand
        parts: ScoreParts
        maxPoints: ScoreParts
        hasBudgets: boolean
        hasGoals: boolean
        message: string
        tips: string[]
      }
}