import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAppDispatch } from './store/store'
import { initAuth, setLoading } from './store/slices/authSlice'
import api from './services/api'

import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import DashboardRouter from './components/DashboardRouter'

// Pages
import HomePage from './pages/HomePage'
import PropertyListPage from './pages/PropertyListPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import SellerDashboard from './pages/Dashboard/SellerDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import BuyerDashboard from './pages/Dashboard/BuyerDashboard'
import ProfilePage from './pages/Profile/ProfilePage'
import NewPropertyPage from './pages/Dashboard/NewPropertyPage'
import EditPropertyPage from './pages/Dashboard/EditPropertyPage'
import ChatPage from './pages/Chat/ChatPage'
import WalletPage from './pages/Wallet/WalletPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(setLoading(true))
      // Verify token and get user data
      api.get('/users/profile')
        .then(response => {
          if (response.data.success) {
            // Initialize auth with both user and token
            dispatch(initAuth({ 
              user: response.data.data, 
              token: token 
            }))
          }
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('token')
          dispatch(setLoading(false))
        })
    }
  }, [dispatch])
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertyListPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/dashboard/new-property" element={<NewPropertyPage />} />
          <Route path="/dashboard/edit-property/:id" element={<EditPropertyPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/wallet" element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
      
      <Footer />
    </Box>
  )
}

export default App
