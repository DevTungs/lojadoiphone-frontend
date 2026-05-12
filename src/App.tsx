import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import { getSettings } from './services/api'
import { buildApiUrl } from './services/api'
import { assetUrl } from './utils/assetUrl'
import Home from './pages/Home'
import OrderTracking from './pages/OrderTracking'
import AdminLogin from './pages/Admin/Login'
import Dashboard from './pages/Admin/Dashboard'
import AdminProducts from './pages/Admin/Products'
import AdminOrders from './pages/Admin/Orders'
import AdminSellers from './pages/Admin/Sellers'
import AdminSettings from './pages/Admin/Settings'
import AdminCustomers from './pages/Admin/Customers/AdminCustomers'
import AdminPromotions from './pages/Admin/Promotions/AdminPromotions'
import AdminDeposits from './pages/Admin/Deposits/AdminDeposits'
import Products from './pages/Products/Products'
import SellerPage from './pages/SellerPage/SellerPage'
import Checkout from './pages/Checkout/Checkout'
import Register from './pages/Register/Register'
import CustomerLogin from './pages/CustomerLogin/CustomerLogin'
import CustomerAccount from './pages/CustomerAccount/CustomerAccount'
import MaintenancePage from './pages/MaintenancePage/MaintenancePage'
import './design-system/global.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth()
  
  // Mostra nada enquanto está carregando a autenticação do localStorage
  if (isLoading) return null
  
  if (!isAuthenticated) return <Navigate to="/admin/login" />
  if (user?.role !== 'admin') return <Navigate to="/" />
  return <>{children}</>
}

function AppMeta() {
  useEffect(() => {
    getSettings().then((res) => {
      const { store_name, favicon_url } = res.data
      if (store_name) document.title = store_name
      if (favicon_url) {
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null
        if (favicon) favicon.href = assetUrl(favicon_url)
      }
    }).catch(() => {})
  }, [])
  return null
}

function AppContent() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppMeta />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pedido" element={<OrderTracking />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/vendedor/:slug" element={<SellerPage />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/minha-conta" element={<CustomerAccount />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/produtos"
              element={
                <ProtectedRoute>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pedidos"
              element={
                <ProtectedRoute>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendedores"
              element={
                <ProtectedRoute>
                  <AdminSellers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <ProtectedRoute>
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promocoes"
              element={
                <ProtectedRoute>
                  <AdminPromotions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/depositos"
              element={
                <ProtectedRoute>
                  <AdminDeposits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracoes"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  )
}

export default function App() {
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    // Check server health on app load
    const checkServerHealth = async () => {
      try {
        const response = await fetch(buildApiUrl('/health'), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const data = await response.json()
          setServerHealthy(data.status === 'ok')
        } else {
          setServerHealthy(false)
        }
      } catch (error) {
        console.error('Health check failed:', error)
        setServerHealthy(false)
      }
    }

    checkServerHealth()
    
    // Check health every 30 seconds to detect when server comes back online
    const interval = setInterval(checkServerHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Show loading state while checking health
  if (serverHealthy === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Carregando...</h2>
        </div>
      </div>
    )
  }

  // Show maintenance page if server is not healthy
  if (!serverHealthy) {
    return <MaintenancePage />
  }

  // Show app if server is healthy
  return <AppContent />
}
