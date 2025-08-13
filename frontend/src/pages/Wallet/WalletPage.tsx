import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  History,
  ArrowUpward,
  ArrowDownward,
  CheckCircle,
  Cancel,
  HourglassEmpty
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { vnpayService } from '../../services/vnpayService';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];
  
  const bankList = [
    { code: '', name: 'Không chọn ngân hàng' },
    { code: 'NCB', name: 'Ngân hàng NCB' },
    { code: 'AGRIBANK', name: 'Ngân hàng Agribank' },
    { code: 'SCB', name: 'Ngân hàng SCB' },
    { code: 'SACOMBANK', name: 'Ngân hàng SacomBank' },
    { code: 'EXIMBANK', name: 'Ngân hàng EximBank' },
    { code: 'MSBANK', name: 'Ngân hàng MSBANK' },
    { code: 'NAMABANK', name: 'Ngân hàng NamABank' },
    { code: 'VNMART', name: 'Ví điện tử VnMart' },
    { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank' },
    { code: 'VIETCOMBANK', name: 'Ngân hàng VCB' },
    { code: 'HDBANK', name: 'Ngân hàng HDBank' },
    { code: 'DONGABANK', name: 'Ngân hàng Đông Á' },
    { code: 'TPBANK', name: 'Ngân hàng TPBank' },
    { code: 'OJB', name: 'Ngân hàng OceanBank' },
    { code: 'BIDV', name: 'Ngân hàng BIDV' },
    { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank' },
    { code: 'VPBANK', name: 'Ngân hàng VPBank' },
    { code: 'MBBANK', name: 'Ngân hàng MBBank' },
    { code: 'ACB', name: 'Ngân hàng ACB' },
    { code: 'OCB', name: 'Ngân hàng OCB' },
    { code: 'IVB', name: 'Ngân hàng IVB' },
    { code: 'VISA', name: 'Thanh toán qua VISA/MASTER' }
  ];

  useEffect(() => {
    fetchWalletData();
    checkPaymentStatus();
  }, [location]);

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get('status');
    const amount = urlParams.get('amount');
    const orderId = urlParams.get('orderId');

    if (status === 'success') {
      setSuccessMessage(`Nạp tiền thành công! Số tiền: ${formatCurrency(Number(amount))}`);
      
      // Refresh wallet data to show new balance
      await fetchWalletData();
      
      // Optional: Check transaction details
      if (orderId) {
        try {
          const result = await vnpayService.checkTransactionStatus(orderId);
          if (result.success && result.data) {
            console.log('Transaction details:', result.data);
          }
        } catch (error) {
          console.error('Error checking transaction:', error);
        }
      }
    } else if (status === 'failed') {
      setError('Giao dịch nạp tiền thất bại. Vui lòng thử lại.');
    } else if (status === 'invalid') {
      setError('Giao dịch không hợp lệ - Chữ ký không đúng.');
    } else if (status === 'processed') {
      setError('Giao dịch này đã được xử lý trước đó.');
    } else if (status === 'notfound') {
      setError('Không tìm thấy thông tin giao dịch.');
    } else if (status === 'error') {
      setError('Có lỗi xảy ra khi xử lý giao dịch.');
    }

    // Clear URL params after processing
    if (status) {
      navigate('/wallet', { replace: true });
    }
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions')
      ]);

      setBalance(balanceRes.data.data.balance);
      setTransactions(transactionsRes.data.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    
    if (!amount || amount < 10000) {
      setError('Số tiền nạp tối thiểu là 10,000 VNĐ');
      return;
    }

    if (amount > 100000000) {
      setError('Số tiền nạp tối đa là 100,000,000 VNĐ');
      return;
    }

    try {
      setTopupLoading(true);
      const paymentParams = {
        amount,
        bankCode: selectedBank || undefined,
        language: 'vn' as const,
        orderType: 'topup'
      };
      
      const response = await vnpayService.createPayment(paymentParams);
      
      if (response.success && response.data) {
        vnpayService.redirectToPayment(response.data.paymentUrl);
      } else {
        setError(response.message || 'Không thể tạo thanh toán');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      setError('Lỗi khi tạo thanh toán');
    } finally {
      setTopupLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip label="Thành công" color="success" size="small" icon={<CheckCircle />} />;
      case 'PENDING':
        return <Chip label="Đang xử lý" color="warning" size="small" icon={<HourglassEmpty />} />;
      case 'FAILED':
        return <Chip label="Thất bại" color="error" size="small" icon={<Cancel />} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownward color="success" />;
      case 'WITHDRAW':
        return <ArrowUpward color="error" />;
      case 'COMMISSION':
        return <AccountBalanceWallet color="primary" />;
      default:
        return <History />;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Ví của tôi
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceWallet fontSize="large" color="primary" />
                <Typography variant="h6" ml={2}>
                  Số dư ví
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(balance)}
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  fullWidth
                  onClick={() => setTopupDialogOpen(true)}
                >
                  Nạp tiền
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Lịch sử giao dịch
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loại</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thời gian</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getTypeIcon(transaction.type)}
                        </Box>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(transaction.status)}</TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">
                          Chưa có giao dịch nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={topupDialogOpen} onClose={() => setTopupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nạp tiền vào ví</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Số tiền nạp"
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              InputProps={{
                endAdornment: <Typography>VNĐ</Typography>
              }}
              helperText="Số tiền tối thiểu: 10,000 VNĐ"
            />
            <Box mt={3}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Chọn nhanh:
              </Typography>
              <Grid container spacing={1}>
                {predefinedAmounts.map((amount) => (
                  <Grid item xs={4} key={amount}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setTopupAmount(amount.toString())}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box mt={3}>
              <FormControl fullWidth>
                <InputLabel id="bank-select-label">Chọn ngân hàng (tùy chọn)</InputLabel>
                <Select
                  labelId="bank-select-label"
                  value={selectedBank}
                  label="Chọn ngân hàng (tùy chọn)"
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  {bankList.map((bank) => (
                    <MenuItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopupDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleTopup}
            disabled={topupLoading}
          >
            {topupLoading ? <CircularProgress size={24} /> : 'Thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WalletPage;