import { Navigate, Route, Routes } from 'react-router'
import NavBar from './components/NavBar'
import { useAuth } from './lib/authContext'
import AffordPage from './pages/AffordPage'
import AuthPage from './pages/AuthPage'
import BudgetsPage from './pages/BudgetsPage'
import GoalsPage from './pages/GoalsPage'
import HomePage from './pages/HomePage'
import TransactionsPage from './pages/TransactionsPage'

export default function App() {
  const { user, loading } = useAuth()

  // Wait until we know whether the visitor is logged in
  if (loading) {
    return <p className="p-6 text-muted">Loading...</p>
  }

  return (
    // Laptops: the page is exactly one screen tall. Phones scroll normally.
    <div className={user ? 'flex min-h-screen flex-col md:h-screen' : ''}>
      {user && <NavBar />}
      {/* Leaves room for the bottom tabs on phones */}
      <div className={user ? 'min-h-0 flex-1 pb-24 md:px-14 md:pb-6' : ''}>
        {/* On laptops every page sits inside one bordered box under the folder tabs */}
        <div
          className={
            user
              ? 'mx-auto h-full max-w-[65rem] md:overflow-y-auto md:rounded-b-[10px] md:rounded-tr-[10px] md:border-2 md:border-edge md:bg-paper'
              : ''
          }
        >
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />}
            />
            <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace />} />
            <Route
              path="/transactions"
              element={user ? <TransactionsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/budgets"
              element={user ? <BudgetsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/goals"
              element={user ? <GoalsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/afford"
              element={user ? <AffordPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}