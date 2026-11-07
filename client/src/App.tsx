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
    <>
      {user && <NavBar />}
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
        <Route path="/goals" element={user ? <GoalsPage /> : <Navigate to="/login" replace />} />
        <Route
          path="/afford"
          element={user ? <AffordPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}