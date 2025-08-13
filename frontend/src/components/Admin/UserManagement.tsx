import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Menu,
  Avatar
} from '@mui/material';
import {
  Edit,
  Block,
  CheckCircle,
  AccountBalance,
  Search,
  FilterList,
  Refresh,
  PersonAdd,
  RemoveCircle,
  AddCircle,
  MoreVert,
  Email,
  Phone,
  Badge
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  balance: number;
  createdAt: string;
  _count?: {
    properties: number;
    inquiries: number;
  };
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  sellers: number;
  buyers: number;
  totalBalance: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [addBalanceDialog, setAddBalanceDialog] = useState(false);
  const [deductBalanceDialog, setDeductBalanceDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, rowsPerPage, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        ...(roleFilter && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/admin/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.data);
        setTotal(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/users/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Create mock stats if API doesn't exist yet
      setStats({
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.isVerified).length,
        sellers: users.filter(u => u.role === 'SELLER').length,
        buyers: users.filter(u => u.role === 'BUYER').length,
        totalBalance: users.reduce((sum, u) => sum + u.balance, 0)
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await api.patch(`/admin/users/${user.id}/status`, {
        isVerified: !user.isVerified
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleUpdateRole = async (user: User, newRole: string) => {
    try {
      const response = await api.patch(`/admin/users/${user.id}/role`, {
        role: newRole
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật role');
    }
  };

  const handleAddBalance = async () => {
    if (!selectedUser || !amount) return;

    try {
      const response = await api.post('/admin/add-balance', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        description
      });

      if (response.data.success) {
        alert('Cộng tiền thành công!');
        setAddBalanceDialog(false);
        setSelectedUser(null);
        setAmount('');
        setDescription('');
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi cộng tiền');
    }
  };

  const handleDeductBalance = async () => {
    if (!selectedUser || !amount) return;

    try {
      const response = await api.post('/admin/deduct-balance', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        description
      });

      if (response.data.success) {
        alert('Trừ tiền thành công!');
        setDeductBalanceDialog(false);
        setSelectedUser(null);
        setAmount('');
        setDescription('');
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi trừ tiền');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoleChip = (role: string) => {
    const roleConfig: any = {
      ADMIN: { label: 'Admin', color: 'error' },
      SELLER: { label: 'Người bán', color: 'primary' },
      BUYER: { label: 'Người mua', color: 'success' }
    };

    const config = roleConfig[role] || { label: role, color: 'default' };
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  return (
    <Box>
      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng người dùng
                </Typography>
                <Typography variant="h4">
                  {stats.totalUsers}
                </Typography>
                <Chip
                  label={`${stats.verifiedUsers} đã xác thực`}
                  color="success"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Người bán
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.sellers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Người mua
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.buyers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng số dư
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(stats.totalBalance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm email, tên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={roleFilter}
                label="Vai trò"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="BUYER">Người mua</MenuItem>
                <MenuItem value="SELLER">Người bán</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>SĐT</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell align="right">Số dư</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>BĐS/Liên hệ</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={user.balance > 0 ? 'success.main' : 'text.primary'}
                      >
                        {formatCurrency(user.balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        color={user.isVerified ? 'success' : 'warning'}
                        size="small"
                        icon={user.isVerified ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user._count?.properties || 0} / {user._count?.inquiries || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedUser(user);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Số dòng mỗi trang"
            />
          </>
        )}
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          handleToggleStatus(selectedUser!);
          setAnchorEl(null);
        }}>
          {selectedUser?.isVerified ? <Block sx={{ mr: 1 }} /> : <CheckCircle sx={{ mr: 1 }} />}
          {selectedUser?.isVerified ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
        </MenuItem>
        
        {selectedUser?.role !== 'ADMIN' && (
          <MenuItem onClick={() => {
            setAddBalanceDialog(true);
            setAnchorEl(null);
          }}>
            <AddCircle sx={{ mr: 1, color: 'success.main' }} />
            Cộng tiền
          </MenuItem>
        )}
        
        {selectedUser?.role === 'SELLER' && (
          <MenuItem onClick={() => {
            setDeductBalanceDialog(true);
            setAnchorEl(null);
          }}>
            <RemoveCircle sx={{ mr: 1, color: 'error.main' }} />
            Trừ tiền
          </MenuItem>
        )}
      </Menu>

      {/* Add Balance Dialog */}
      <Dialog open={addBalanceDialog} onClose={() => setAddBalanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cộng tiền cho người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Cộng tiền cho: <strong>{selectedUser.fullName}</strong> ({selectedUser.email})
                <br />
                Số dư hiện tại: <strong>{formatCurrency(selectedUser.balance)}</strong>
              </Alert>
              
              <TextField
                fullWidth
                type="number"
                label="Số tiền cộng"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi chú (tùy chọn)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddBalanceDialog(false);
            setAmount('');
            setDescription('');
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddBalance}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Cộng tiền
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deduct Balance Dialog */}
      <Dialog open={deductBalanceDialog} onClose={() => setDeductBalanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trừ tiền người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Trừ tiền từ: <strong>{selectedUser.fullName}</strong> ({selectedUser.email})
                <br />
                Số dư hiện tại: <strong>{formatCurrency(selectedUser.balance)}</strong>
              </Alert>
              
              <TextField
                fullWidth
                type="number"
                label="Số tiền trừ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>
                }}
                error={parseFloat(amount) > selectedUser.balance}
                helperText={parseFloat(amount) > selectedUser.balance ? 'Số tiền trừ vượt quá số dư hiện tại' : ''}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Lý do trừ tiền *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                helperText="Vui lòng nhập lý do trừ tiền"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeductBalanceDialog(false);
            setAmount('');
            setDescription('');
          }}>
            Hủy
          </Button>
          <Tooltip 
            title={
              !amount ? "Vui lòng nhập số tiền" :
              parseFloat(amount) <= 0 ? "Số tiền phải lớn hơn 0" :
              parseFloat(amount) > (selectedUser?.balance || 0) ? "Số tiền vượt quá số dư" :
              !description ? "Vui lòng nhập lý do trừ tiền" :
              ""
            }
            disableHoverListener={
              amount && 
              parseFloat(amount) > 0 && 
              parseFloat(amount) <= (selectedUser?.balance || 0) && 
              description !== ''
            }
          >
            <span>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeductBalance}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  parseFloat(amount) > (selectedUser?.balance || 0) ||
                  !description
                }
              >
                Trừ tiền
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;