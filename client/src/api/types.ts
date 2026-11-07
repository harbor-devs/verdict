// The shapes of data the backend sends to the screens.

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

export type TransactionKind = 'income' | 'expense'

export type Budget = {
  id: string
  category: string
  monthlyLimit: string // rupees as text, like "5000.00"
  spentThisMonth: string // spent in this category this month, as text
}

export type BudgetsResponse = { budgets: Budget[] }

export type Transaction = {
  id: string
  kind: TransactionKind
  amount: string // rupees as text, like "1200.00"
  category: string
  note: string | null
  occurredOn: string // like "2026-11-05"
  createdAt: string
}

export type TransactionsResponse = { transactions: Transaction[] }