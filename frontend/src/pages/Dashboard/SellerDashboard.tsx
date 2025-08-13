import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../store/store';
import api from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    premiumProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    monthlyRevenue: 0
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [properties, setProperties] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPremiumPackage, setSelectedPremiumPackage] = useState<string>('');

  // Check if user is SELLER or ADMIN
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    // Check if we have a token but no user yet (still loading)
    const token = localStorage.getItem('token');
    if (token && !user) {
      // Still loading user data, don't redirect yet
      return;
    }
    
    // Now we can check user role
    if (!user || (user.role !== 'SELLER' && user.role !== 'ADMIN')) {
      navigate('/');
    } else {
      loadDashboardData();
    }
  }, [user, navigate, authLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadProperties(),
        loadAnalytics(),
        loadWalletBalance()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/properties/user/${user?.id}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await api.get(`/properties/user/${user?.id}`);
      setProperties(response.data.data);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/seller/${user?.id}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await api.get('/wallet/balance');
      if (response.data.success) {
        setWalletBalance(response.data.data.balance);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;
    try {
      const response = await api.delete(`/properties/${selectedProperty.id}`);
      if (response.data.success) {
        loadProperties();
        loadStats();
        setDeleteDialogOpen(false);
        setSelectedProperty(null);
      }
    } catch (error: any) {
      console.error('Error deleting property:', error);
      alert(error.response?.data?.message || 'Lỗi khi xóa bất động sản');
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!selectedProperty || !selectedPremiumPackage) return;
    
    try {
      const response = await api.post('/premium/upgrade', {
        propertyId: selectedProperty.id,
        duration: selectedPremiumPackage
      });
      if (response.data.success) {
        loadProperties();
        loadStats();
        loadWalletBalance();
        setPremiumDialogOpen(false);
        setSelectedProperty(null);
        setSelectedPremiumPackage('');
        alert('Nâng cấp Premium thành công!');
      }
    } catch (error: any) {
      console.error('Error upgrading to premium:', error);
      alert(error.response?.data?.message || 'Lỗi khi nâng cấp Premium');
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'PENDING': return 'warning';
      case 'SOLD': return 'error';
      case 'RENTED': return 'info';
      default: return 'default';
    }
  };

  // Show loading state while checking authentication
  if (authLoading || (localStorage.getItem('token') && !user)) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard Người Bán
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý bất động sản và theo dõi hiệu suất
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Card sx={{ px: 3, py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Số dư ví
            </Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(walletBalance)}
            </Typography>
          </Card>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<MoneyIcon />}
            onClick={() => navigate('/wallet')}
          >
            Quản lý ví
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress />}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.main'
                }}>
                  <HomeIcon />
                </Box>
                <Chip 
                  label={`${stats.activeProperties} active`} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>
                {stats.totalProperties}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng bất động sản
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: 'warning.light',
                  color: 'warning.main'
                }}>
                  <StarIcon />
                </Box>
                <Chip 
                  label="Premium" 
                  size="small" 
                  color="warning"
                  icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>
                {stats.premiumProperties}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tin nổi bật
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: 'info.light',
                  color: 'info.main'
                }}>
                  <ViewIcon />
                </Box>
                <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                  +15%
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>
                {stats.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng lượt xem
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Main Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Tổng quan" />
          <Tab label="Danh sách BĐS" />
          <Tab label="Phân tích" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Recent Properties */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                BĐS mới đăng
              </Typography>
              <List>
                {properties.slice(0, 3).map((property) => (
                  <React.Fragment key={property.id}>
                    <ListItem>
                      <ListItemIcon>
                        <HomeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={property.title}
                        secondary={`${formatCurrency(Number(property.price))} - ${property.area}m²`}
                      />
                      <Chip
                        label={property.status}
                        size="small"
                        color={getStatusColor(property.status)}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
              <Button fullWidth onClick={() => setTabValue(1)}>
                Xem tất cả
              </Button>
            </Paper>
          </Grid>


          {/* Analytics Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Lượt xem theo tháng
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" name="Lượt xem" />
                  <Line type="monotone" dataKey="inquiries" stroke="#82ca9d" name="Liên hệ" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Properties Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Danh sách bất động sản</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/new-property')}
          >
            Đăng tin mới
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Diện tích</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>Lượt xem</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{property.title}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>{formatCurrency(Number(property.price))}</TableCell>
                  <TableCell>{property.area}m²</TableCell>
                  <TableCell>
                    <Chip
                      label={property.status}
                      size="small"
                      color={getStatusColor(property.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {property.premiumStatus === 'PREMIUM' ? (
                      <Chip label="Premium" size="small" color="warning" icon={<StarIcon />} />
                    ) : property.status === 'AVAILABLE' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          setSelectedProperty(property);
                          setPremiumDialogOpen(true);
                        }}
                      >
                        Nâng cấp
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Chưa duyệt
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{property.views || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedProperty(property);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Phân tích chi tiết
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#8884d8" name="Lượt xem" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Click" />
                  <Bar dataKey="inquiries" fill="#ffc658" name="Liên hệ" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>


      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate(`/property/${selectedProperty?.id}`)}>
          <ViewIcon sx={{ mr: 1 }} /> Xem
        </MenuItem>
        <MenuItem onClick={() => navigate(`/dashboard/edit-property/${selectedProperty?.id}`)}>
          <EditIcon sx={{ mr: 1 }} /> Sửa
        </MenuItem>
        <MenuItem onClick={() => {
          setDeleteDialogOpen(true);
          setAnchorEl(null);
        }}>
          <DeleteIcon sx={{ mr: 1 }} /> Xóa
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa bất động sản "{selectedProperty?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={handleDeleteProperty}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premium Upgrade Dialog */}
      <Dialog open={premiumDialogOpen} onClose={() => setPremiumDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="warning" />
            Nâng cấp Premium
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Nâng cấp BĐS "{selectedProperty?.title}" lên Premium để tăng khả năng hiển thị
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Chọn gói Premium:
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedPremiumPackage === '7_DAYS' ? 2 : 1,
                  borderColor: selectedPremiumPackage === '7_DAYS' ? 'warning.main' : 'divider'
                }}
                onClick={() => setSelectedPremiumPackage('7_DAYS')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">7 Ngày</Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(50000)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedPremiumPackage === '30_DAYS' ? 2 : 1,
                  borderColor: selectedPremiumPackage === '30_DAYS' ? 'warning.main' : 'divider',
                  position: 'relative'
                }}
                onClick={() => setSelectedPremiumPackage('30_DAYS')}
              >
                <Chip 
                  label="Phổ biến" 
                  size="small" 
                  color="warning"
                  sx={{ position: 'absolute', top: -10, right: 10 }}
                />
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">30 Ngày</Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(150000)}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Tiết kiệm 20%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedPremiumPackage === '90_DAYS' ? 2 : 1,
                  borderColor: selectedPremiumPackage === '90_DAYS' ? 'warning.main' : 'divider'
                }}
                onClick={() => setSelectedPremiumPackage('90_DAYS')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">90 Ngày</Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(400000)}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Tiết kiệm 30%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Số dư ví hiện tại: <strong>{formatCurrency(walletBalance)}</strong>
          </Alert>
          
          {selectedPremiumPackage && walletBalance < (
            selectedPremiumPackage === '7_DAYS' ? 50000 :
            selectedPremiumPackage === '30_DAYS' ? 150000 : 400000
          ) && (
            <Alert severity="warning">
              Số dư không đủ. Vui lòng nạp thêm tiền vào ví.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPremiumDialogOpen(false);
            setSelectedPremiumPackage('');
          }}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleUpgradeToPremium}
            disabled={!selectedPremiumPackage || walletBalance < (
              selectedPremiumPackage === '7_DAYS' ? 50000 :
              selectedPremiumPackage === '30_DAYS' ? 150000 : 400000
            )}
          >
            Nâng cấp
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default SellerDashboard;