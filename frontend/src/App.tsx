import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireAuth } from './components/RouteGuard'
import AdminConsolePage from './pages/AdminConsolePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SubscriptionMessagesPage from './pages/SubscriptionMessagesPage'
import SubscribersPage from './pages/SubscribersPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <RequireAuth>
          <DashboardPage />
        </RequireAuth>
      }
    />
    <Route
      path="/console"
      element={
        <RequireAuth>
          <AdminConsolePage mode="workspace" />
        </RequireAuth>
      }
    />
    <Route
      path="/subscriptions"
      element={
        <RequireAuth>
          <SubscriptionsPage />
        </RequireAuth>
      }
    />
    <Route
      path="/messages"
      element={
        <RequireAuth>
          <SubscriptionMessagesPage />
        </RequireAuth>
      }
    />
    <Route
      path="/subscribers"
      element={
        <RequireAuth>
          <SubscribersPage />
        </RequireAuth>
      }
    />
    <Route
      path="/admin"
      element={
        <RequireAdmin>
          <AdminConsolePage mode="admin" />
        </RequireAdmin>
      }
    />
    <Route path="/forbidden" element={<UnauthorizedPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default App
