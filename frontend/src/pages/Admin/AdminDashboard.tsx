import React, { useState, useEffect } from 'react';
import TransactionManagement from '../../components/Admin/TransactionManagement';
import UserManagement from '../../components/Admin/UserManagement';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Login as LoginIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  AddCircle as AddCircleIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/store';
import api from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDialog, setUserDialog] = useState(false);
  
  // Properties state  
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [propertyPage, setPropertyPage] = useState(0);
  const [propertyRowsPerPage, setPropertyRowsPerPage] = useState(10);
  const [propertyTotal, setPropertyTotal] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyDialog, setPropertyDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  
  // Transaction history state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(10);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  
  // Settings state
  const [premiumPrices, setPremiumPrices] = useState({
    '7_DAYS': 50000,
    '30_DAYS': 150000,
    '90_DAYS': 400000
  });
  const [priceEditMode, setPriceEditMode] = useState(false);
  
  // Dialogs
  const [addMoneyDialog, setAddMoneyDialog] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [premiumUpgradeDialog, setPremiumUpgradeDialog] = useState(false);
  const [selectedPremiumDuration, setSelectedPremiumDuration] = useState('7_DAYS');

  // Check admin permission
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load initial data
  useEffect(() => {
    if (tabValue === 0) {
      loadDashboard();
    } else if (tabValue === 1) {
      loadUsers();
    } else if (tabValue === 2) {
      loadPendingProperties();
    } else if (tabValue === 3) {
      loadAllProperties();
    } else if (tabValue === 4) {
      loadTransactions();
    } else if (tabValue === 5) {
      loadPremiumPrices();
    }
  }, [tabValue, userPage, userRowsPerPage, userSearch, userRoleFilter, propertyPage, propertyRowsPerPage, propertyStatusFilter, propertySearch, transactionPage, transactionRowsPerPage, transactionTypeFilter]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showSnackbar('Lỗi khi tải dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: userPage + 1,
          limit: userRowsPerPage,
          search: userSearch,
          role: userRoleFilter
        }
      });
      setUsers(response.data.data);
      setUserTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Error loading users:', error);
      showSnackbar('Lỗi khi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingProperties = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/properties/pending', {
        params: {
          page: propertyPage + 1,
          limit: propertyRowsPerPage
        }
      });
      setPendingProperties(response.data.data);
      setPropertyTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Error loading properties:', error);
      showSnackbar('Lỗi khi tải danh sách BĐS chờ duyệt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProperties = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/properties/all', {
        params: {
          page: propertyPage + 1,
          limit: propertyRowsPerPage,
          status: propertyStatusFilter,
          search: propertySearch
        }
      });
      setAllProperties(response.data.data || []);
      setPropertyTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading all properties:', error);
      showSnackbar('Lỗi khi tải danh sách BĐS', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/transactions', {
        params: {
          page: transactionPage + 1,
          limit: transactionRowsPerPage,
          type: transactionTypeFilter
        }
      });
      setTransactions(response.data.data || []);
      setTransactionTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showSnackbar('Lỗi khi tải lịch sử giao dịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumPrices = async () => {
    try {
      const response = await api.get('/premium/pricing');
      if (response.data.success) {
        const prices: any = {};
        response.data.data.packages.forEach((pkg: any) => {
          prices[pkg.duration] = pkg.price;
        });
        setPremiumPrices(prices);
      }
    } catch (error) {
      console.error('Error loading premium prices:', error);
    }
  };

  const handleUserStatusChange = async (userId: string, isVerified: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isVerified });
      showSnackbar(`Đã ${isVerified ? 'kích hoạt' : 'khóa'} tài khoản`, 'success');
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showSnackbar('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleUserRoleChange = async (userId: string, role: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      showSnackbar('Đã cập nhật role thành công', 'success');
      loadUsers();
      setUserDialog(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      showSnackbar('Lỗi khi cập nhật role', 'error');
    }
  };

  const handlePropertyApprove = async (propertyId: string) => {
    try {
      await api.patch(`/admin/properties/${propertyId}/approve`);
      showSnackbar('Đã duyệt bất động sản', 'success');
      loadPendingProperties();
      setPropertyDialog(false);
    } catch (error) {
      console.error('Error approving property:', error);
      showSnackbar('Lỗi khi duyệt bất động sản', 'error');
    }
  };

  const handlePropertyReject = async (propertyId: string) => {
    if (!rejectionReason.trim()) {
      showSnackbar('Vui lòng nhập lý do từ chối', 'error');
      return;
    }
    try {
      await api.patch(`/admin/properties/${propertyId}/reject`, {
        reason: rejectionReason
      });
      showSnackbar('Đã từ chối bất động sản', 'success');
      loadPendingProperties();
      setPropertyDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting property:', error);
      showSnackbar('Lỗi khi từ chối bất động sản', 'error');
    }
  };

  const handlePropertyDelete = async (propertyId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa BĐS này?')) {
      try {
        await api.delete(`/properties/${propertyId}`);
        showSnackbar('Đã xóa bất động sản', 'success');
        loadAllProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
        showSnackbar('Lỗi khi xóa bất động sản', 'error');
      }
    }
  };

  const handleLoginAsSeller = async (userId: string) => {
    try {
      // Get seller info
      const seller = users.find(u => u.id === userId);
      if (!seller) {
        showSnackbar('Không tìm thấy thông tin seller', 'error');
        return;
      }
      
      // Simply open seller dashboard in new tab
      // The seller should already have access to their own dashboard
      window.open('/dashboard', '_blank');
      
      showSnackbar(`Đang mở dashboard của ${seller.fullName} trong tab mới`, 'success');
    } catch (error) {
      console.error('Error accessing seller dashboard:', error);
      showSnackbar('Lỗi khi truy cập dashboard seller', 'error');
    }
  };

  const handleAddMoney = async () => {
    if (!selectedUser || !addMoneyAmount) return;
    
    try {
      await api.post('/admin/add-balance', {
        userId: selectedUser.id,
        amount: Number(addMoneyAmount),
        description: `Admin cộng tiền: ${formatCurrency(Number(addMoneyAmount))}`
      });
      showSnackbar(`Đã cộng ${formatCurrency(Number(addMoneyAmount))} cho ${selectedUser.fullName}`, 'success');
      setAddMoneyDialog(false);
      setAddMoneyAmount('');
      loadUsers();
    } catch (error) {
      console.error('Error adding money:', error);
      showSnackbar('Lỗi khi cộng tiền', 'error');
    }
  };

  const handlePremiumUpgrade = async () => {
    if (!selectedProperty) return;
    
    try {
      await api.post('/admin/upgrade-premium', {
        propertyId: selectedProperty.id,
        duration: selectedPremiumDuration
      });
      showSnackbar(`Đã nâng cấp Premium cho BĐS "${selectedProperty.title}"`, 'success');
      setPremiumUpgradeDialog(false);
      loadAllProperties();
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      showSnackbar('Lỗi khi nâng cấp premium', 'error');
    }
  };

  const handleSavePremiumPrices = async () => {
    try {
      await api.post('/admin/premium-prices', premiumPrices);
      showSnackbar('Đã cập nhật giá premium thành công', 'success');
      setPriceEditMode(false);
    } catch (error) {
      console.error('Error saving premium prices:', error);
      showSnackbar('Lỗi khi lưu giá premium', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý hệ thống EZ Real Estate
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<DashboardIcon />} label="Tổng quan" />
          <Tab icon={<PeopleIcon />} label="Quản lý người dùng" />
          <Tab icon={<HomeIcon />} label="Duyệt BĐS" />
          <Tab icon={<HomeIcon />} label="Quản lý BĐS" />
          <Tab icon={<AccountBalanceIcon />} label="Quản lý giao dịch" />
          <Tab icon={<SettingsIcon />} label="Cài đặt" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress />}

      {/* Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        {dashboardStats && (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.totalUsers}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +12% tháng này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng BĐS
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.totalProperties}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      {dashboardStats.pendingProperties} chờ duyệt
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng yêu cầu
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.totalInquiries}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +25% tháng này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Doanh thu tháng
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(
                      dashboardStats.monthlyRevenue?.reduce(
                        (sum: number, item: any) => sum + Number(item._sum?.amount || 0),
                        0
                      ) || 0
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <MoneyIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      Premium listings
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Người dùng theo vai trò
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardStats.usersByRole}
                      dataKey="_count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {dashboardStats.usersByRole?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  BĐS theo loại
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardStats.propertiesByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Recent Payments */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thanh toán gần đây
                </Typography>
                <List>
                  {dashboardStats.recentPayments?.map((payment: any) => (
                    <React.Fragment key={payment.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <MoneyIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${payment.user?.fullName} - ${formatCurrency(Number(payment.amount))}`}
                          secondary={`Premium Listing - ${new Date(payment.createdAt).toLocaleDateString('vi-VN')}`}
                        />
                        <Chip 
                          label={payment.status} 
                          color={payment.status === 'COMPLETED' ? 'success' : 'warning'}
                          size="small"
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Users Management Tab */}
      <TabPanel value={tabValue} index={1}>
        <UserManagement />
      </TabPanel>

      {/* Property Moderation Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell>Người đăng</TableCell>
                <TableCell>Ngày đăng</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{property.id.slice(0, 8)}...</TableCell>
                  <TableCell>{property.title}</TableCell>
                  <TableCell>
                    <Chip label={property.type} size="small" />
                  </TableCell>
                  <TableCell>{formatCurrency(Number(property.price))}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>{property.seller?.fullName}</TableCell>
                  <TableCell>{new Date(property.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setSelectedProperty(property);
                        setPropertyDialog(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="success"
                      onClick={() => handlePropertyApprove(property.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedProperty(property);
                        setPropertyDialog(true);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={propertyTotal}
            rowsPerPage={propertyRowsPerPage}
            page={propertyPage}
            onPageChange={(e, page) => setPropertyPage(page)}
            onRowsPerPageChange={(e) => {
              setPropertyRowsPerPage(parseInt(e.target.value, 10));
              setPropertyPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Properties Management Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tìm kiếm BĐS"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Tiêu đề, địa chỉ..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={propertyStatusFilter}
                  label="Trạng thái"
                  onChange={(e) => setPropertyStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                  <MenuItem value="AVAILABLE">Đã duyệt</MenuItem>
                  <MenuItem value="SOLD">Đã bán</MenuItem>
                  <MenuItem value="RENTED">Đã cho thuê</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth onClick={loadAllProperties}>
                Tìm kiếm
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Diện tích</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell>Người đăng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allProperties.map((property: any) => (
                <TableRow key={property.id}>
                  <TableCell>{property.id.slice(0, 8)}...</TableCell>
                  <TableCell>{property.title}</TableCell>
                  <TableCell>
                    <Chip label={property.type} size="small" />
                  </TableCell>
                  <TableCell>{formatCurrency(Number(property.price))}</TableCell>
                  <TableCell>{property.area}m²</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>{property.seller?.fullName}</TableCell>
                  <TableCell>
                    <Chip
                      label={property.status}
                      size="small"
                      color={
                        property.status === 'AVAILABLE' ? 'success' :
                        property.status === 'PENDING' ? 'warning' :
                        property.status === 'SOLD' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {property.premiumStatus === 'PREMIUM' && (
                      <Chip label="Premium" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => navigate(`/property/${property.id}`)}
                      title="Xem chi tiết"
                    >
                      <ViewIcon />
                    </IconButton>
                    {property.status === 'PENDING' && (
                      <>
                        <IconButton
                          color="success"
                          onClick={() => handlePropertyApprove(property.id)}
                          title="Duyệt"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          color="warning"
                          onClick={() => {
                            setSelectedProperty(property);
                            setPropertyDialog(true);
                          }}
                          title="Từ chối"
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                    {property.premiumStatus !== 'PREMIUM' && (
                      <IconButton
                        color="warning"
                        onClick={() => {
                          setSelectedProperty(property);
                          setPremiumUpgradeDialog(true);
                        }}
                        title="Nâng cấp Premium"
                      >
                        <StarIcon />
                      </IconButton>
                    )}
                    <IconButton
                      color="error"
                      onClick={() => handlePropertyDelete(property.id)}
                      title="Xóa"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={propertyTotal}
            rowsPerPage={propertyRowsPerPage}
            page={propertyPage}
            onPageChange={(e, page) => setPropertyPage(page)}
            onRowsPerPageChange={(e) => {
              setPropertyRowsPerPage(parseInt(e.target.value, 10));
              setPropertyPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Transaction Management Tab */}
      <TabPanel value={tabValue} index={4}>
        <TransactionManagement />
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={tabValue} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Giá gói Premium
                </Typography>
                {!priceEditMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setPriceEditMode(true)}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSavePremiumPrices}
                      sx={{ mr: 1 }}
                    >
                      Lưu
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setPriceEditMode(false);
                        loadPremiumPrices();
                      }}
                    >
                      Hủy
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Gói 7 ngày"
                    type="number"
                    value={premiumPrices['7_DAYS']}
                    disabled={!priceEditMode}
                    onChange={(e) => setPremiumPrices({...premiumPrices, '7_DAYS': Number(e.target.value)})}
                    InputProps={{
                      endAdornment: <Typography variant="body2">VNĐ</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Gói 30 ngày"
                    type="number"
                    value={premiumPrices['30_DAYS']}
                    disabled={!priceEditMode}
                    onChange={(e) => setPremiumPrices({...premiumPrices, '30_DAYS': Number(e.target.value)})}
                    InputProps={{
                      endAdornment: <Typography variant="body2">VNĐ</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Gói 90 ngày"
                    type="number"
                    value={premiumPrices['90_DAYS']}
                    disabled={!priceEditMode}
                    onChange={(e) => setPremiumPrices({...premiumPrices, '90_DAYS': Number(e.target.value)})}
                    InputProps={{
                      endAdornment: <Typography variant="body2">VNĐ</Typography>
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thống kê hệ thống
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Tổng doanh thu Premium"
                    secondary={formatCurrency(dashboardStats?.monthlyRevenue?.reduce(
                      (sum: number, item: any) => sum + Number(item._sum?.amount || 0),
                      0
                    ) || 0)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Số lượng BĐS Premium"
                    secondary={`${dashboardStats?.totalProperties || 0} BĐS`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Tổng số người dùng"
                    secondary={`${dashboardStats?.totalUsers || 0} người`}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* User Edit Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>ID:</strong> {selectedUser.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Họ tên:</strong> {selectedUser.fullName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={selectedUser.role}
                  label="Vai trò"
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                >
                  <MenuItem value="BUYER">Buyer</MenuItem>
                  <MenuItem value="SELLER">Seller</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={() => handleUserRoleChange(selectedUser.id, selectedUser.role)}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Property Review Dialog */}
      <Dialog open={propertyDialog} onClose={() => setPropertyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết bất động sản</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProperty.title}
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedProperty.description}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Loại:</strong> {selectedProperty.type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Giá:</strong> {formatCurrency(Number(selectedProperty.price))}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Diện tích:</strong> {selectedProperty.area}m²
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Địa chỉ:</strong> {selectedProperty.address}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Người đăng:</strong> {selectedProperty.seller?.fullName} ({selectedProperty.seller?.email})
                  </Typography>
                </Grid>
              </Grid>
              {selectedProperty.status === 'PENDING' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Lý do từ chối (nếu từ chối)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPropertyDialog(false)}>Đóng</Button>
          {selectedProperty?.status === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => handlePropertyReject(selectedProperty.id)}
              >
                Từ chối
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handlePropertyApprove(selectedProperty.id)}
              >
                Duyệt
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={addMoneyDialog} onClose={() => setAddMoneyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cộng tiền cho người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Người dùng:</strong> {selectedUser.fullName} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Số dư hiện tại:</strong> {formatCurrency(selectedUser.balance || 0)}
              </Typography>
              <TextField
                fullWidth
                label="Số tiền cộng thêm"
                type="number"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  endAdornment: <Typography variant="body2">VNĐ</Typography>
                }}
              />
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {[50000, 100000, 500000, 1000000].map((amount) => (
                  <Grid item xs={3} key={amount}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => setAddMoneyAmount(amount.toString())}
                    >
                      {formatCurrency(amount).replace(' ₫', '')}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddMoneyDialog(false);
            setAddMoneyAmount('');
          }}>Hủy</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddMoney}
            disabled={!addMoneyAmount || Number(addMoneyAmount) <= 0}
          >
            Cộng tiền
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premium Upgrade Dialog */}
      <Dialog open={premiumUpgradeDialog} onClose={() => setPremiumUpgradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nâng cấp Premium cho BĐS</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>BĐS:</strong> {selectedProperty.title}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Người đăng:</strong> {selectedProperty.seller?.fullName}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Chọn gói Premium</InputLabel>
                <Select
                  value={selectedPremiumDuration}
                  label="Chọn gói Premium"
                  onChange={(e) => setSelectedPremiumDuration(e.target.value)}
                >
                  <MenuItem value="7_DAYS">7 ngày - {formatCurrency(premiumPrices['7_DAYS'])}</MenuItem>
                  <MenuItem value="30_DAYS">30 ngày - {formatCurrency(premiumPrices['30_DAYS'])}</MenuItem>
                  <MenuItem value="90_DAYS">90 ngày - {formatCurrency(premiumPrices['90_DAYS'])}</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 2 }}>
                Admin nâng cấp Premium miễn phí, không trừ tiền của người dùng
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPremiumUpgradeDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handlePremiumUpgrade}
          >
            Nâng cấp Premium
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;