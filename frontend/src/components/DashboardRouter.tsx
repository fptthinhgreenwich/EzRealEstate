import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/store';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import BuyerDashboard from '../pages/Dashboard/BuyerDashboard';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import { CircularProgress, Box, Container } from '@mui/material';

const DashboardRouter = () => {
  const { user, loading } = useAppSelector((state) => state.auth);
  
  // Show loading while checking auth
  if (loading || (localStorage.getItem('token') && !user)) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Route based on user role
  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SELLER':
      return <SellerDashboard />;
    case 'BUYER':
      return <BuyerDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default DashboardRouter;