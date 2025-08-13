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
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Search,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  referenceId?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
  };
}

interface TransactionStats {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalDeposit: number;
  totalWithdraw: number;
  todayTransactions: number;
}

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Dialog states
  const [detailDialog, setDetailDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, rowsPerPage, statusFilter, typeFilter, searchTerm, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      const response = await api.get(`/admin/transactions?${params}`);
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setTotal(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/transactions/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTransaction || !updateStatus) return;

    try {
      const response = await api.put(
        `/admin/transactions/${selectedTransaction.id}/status`,
        { status: updateStatus, note: updateNote }
      );

      if (response.data.success) {
        alert('Cập nhật trạng thái thành công!');
        setUpdateDialog(false);
        setSelectedTransaction(null);
        setUpdateStatus('');
        setUpdateNote('');
        fetchTransactions();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: any = {
      COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircle /> },
      PENDING: { label: 'Đang xử lý', color: 'warning', icon: <HourglassEmpty /> },
      FAILED: { label: 'Thất bại', color: 'error', icon: <Cancel /> },
      CANCELLED: { label: 'Đã hủy', color: 'default', icon: <Cancel /> }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  const getTypeChip = (type: string) => {
    const typeConfig: any = {
      DEPOSIT: { label: 'Nạp tiền', color: 'success', icon: <TrendingDown /> },
      WITHDRAW: { label: 'Rút tiền', color: 'error', icon: <TrendingUp /> },
      COMMISSION: { label: 'Hoa hồng', color: 'info', icon: <AttachMoney /> },
      ADMIN_ADD: { label: 'Admin cộng', color: 'primary', icon: <AccountBalanceWallet /> },
      ADMIN_DEDUCT: { label: 'Admin trừ', color: 'warning', icon: <AccountBalanceWallet /> }
    };

    const config = typeConfig[type] || { label: type, color: 'default' };
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        icon={config.icon}
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
                  Tổng giao dịch
                </Typography>
                <Typography variant="h4">
                  {stats.totalTransactions}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Hôm nay: {stats.todayTransactions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Hoàn thành
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completedTransactions}
                </Typography>
                <Chip
                  label={`${((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)}%`}
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
                  Tổng nạp
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(stats.totalDeposit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Đang xử lý
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingTransactions}
                </Typography>
                {stats.pendingTransactions > 0 && (
                  <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                    Cần xử lý
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm mã GD..."
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
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="PENDING">Đang xử lý</MenuItem>
                <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                <MenuItem value="FAILED">Thất bại</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại GD</InputLabel>
              <Select
                value={typeFilter}
                label="Loại GD"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="DEPOSIT">Nạp tiền</MenuItem>
                <MenuItem value="WITHDRAW">Rút tiền</MenuItem>
                <MenuItem value="COMMISSION">Hoa hồng</MenuItem>
                <MenuItem value="ADMIN_ADD">Admin cộng</MenuItem>
                <MenuItem value="ADMIN_DEDUCT">Admin trừ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Từ ngày"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Đến ngày"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                fetchTransactions();
                fetchStats();
              }}
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
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
                  <TableCell>Mã GD</TableCell>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.referenceId || transaction.id.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.user.fullName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {transaction.user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getTypeChip(transaction.type)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={
                          transaction.type === 'DEPOSIT' || transaction.type === 'ADMIN_ADD' || transaction.type === 'COMMISSION'
                            ? 'success.main' 
                            : 'error.main'
                        }
                      >
                        {transaction.type === 'DEPOSIT' || transaction.type === 'ADMIN_ADD' || transaction.type === 'COMMISSION' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(transaction.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {transaction.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDetailDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      {transaction.status === 'PENDING' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setUpdateStatus(transaction.status);
                            setUpdateDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      )}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết giao dịch</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Mã giao dịch</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTransaction.referenceId || selectedTransaction.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Trạng thái</Typography>
                  <Box>{getStatusChip(selectedTransaction.status)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Loại giao dịch</Typography>
                  <Box>{getTypeChip(selectedTransaction.type)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Số tiền</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    color={
                      selectedTransaction.type === 'DEPOSIT' || 
                      selectedTransaction.type === 'ADMIN_ADD' || 
                      selectedTransaction.type === 'COMMISSION'
                        ? 'success.main' 
                        : 'error.main'
                    }
                  >
                    {selectedTransaction.type === 'DEPOSIT' || 
                     selectedTransaction.type === 'ADMIN_ADD' || 
                     selectedTransaction.type === 'COMMISSION' ? '+' : '-'}
                    {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Người dùng</Typography>
                  <Typography variant="body1">
                    {selectedTransaction.user.fullName} ({selectedTransaction.user.email})
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Mô tả</Typography>
                  <Typography variant="body1">
                    {selectedTransaction.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Thời gian</Typography>
                  <Typography variant="body1">
                    {new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái giao dịch</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Lưu ý: Thay đổi trạng thái từ PENDING sang COMPLETED sẽ cộng tiền vào ví người dùng
              </Alert>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Trạng thái mới</InputLabel>
                <Select
                  value={updateStatus}
                  label="Trạng thái mới"
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  <MenuItem value="PENDING">Đang xử lý</MenuItem>
                  <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                  <MenuItem value="FAILED">Thất bại</MenuItem>
                  <MenuItem value="CANCELLED">Hủy</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi chú (tùy chọn)"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!updateStatus}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionManagement;