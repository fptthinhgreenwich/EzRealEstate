import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Alert,
  Container,
  Paper,
  Button
} from '@mui/material';
import { CheckCircle, Cancel, Error } from '@mui/icons-material';
import { vnpayService } from '../services/vnpayService';

const PaymentStatusChecker: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    const paymentStatus = searchParams.get('status');
    const paymentAmount = searchParams.get('amount');
    const orderId = searchParams.get('orderId');

    if (paymentStatus === 'success') {
      setStatus('success');
      setMessage('Giao dịch nạp tiền thành công!');
      setAmount(paymentAmount ? Number(paymentAmount) : null);
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
      setMessage('Giao dịch nạp tiền thất bại. Vui lòng thử lại.');
    } else if (paymentStatus === 'invalid') {
      setStatus('error');
      setMessage('Giao dịch không hợp lệ.');
    } else if (paymentStatus === 'processed') {
      setStatus('error');
      setMessage('Giao dịch đã được xử lý trước đó.');
    } else if (paymentStatus === 'notfound') {
      setStatus('error');
      setMessage('Không tìm thấy giao dịch.');
    } else if (paymentStatus === 'error') {
      setStatus('error');
      setMessage('Có lỗi xảy ra khi xử lý giao dịch.');
    }

    if (orderId) {
      try {
        const result = await vnpayService.checkTransactionStatus(orderId);
        if (result.success && result.data) {
          setStatus(result.data.status === 'COMPLETED' ? 'success' : 
                   result.data.status === 'FAILED' ? 'failed' : 'error');
          setMessage(result.data.description);
          setAmount(result.data.amount);
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    }

    setLoading(false);

    setTimeout(() => {
      navigate('/wallet');
    }, 5000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang kiểm tra trạng thái giao dịch...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          {status === 'success' && (
            <CheckCircle color="success" sx={{ fontSize: 80 }} />
          )}
          {status === 'failed' && (
            <Cancel color="error" sx={{ fontSize: 80 }} />
          )}
          {status === 'error' && (
            <Error color="warning" sx={{ fontSize: 80 }} />
          )}
        </Box>

        <Typography variant="h5" gutterBottom>
          {message}
        </Typography>

        {amount && (
          <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
            Số tiền: {formatCurrency(amount)}
          </Typography>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          Bạn sẽ được chuyển về trang ví trong 5 giây...
        </Alert>

        <Button
          variant="contained"
          onClick={() => navigate('/wallet')}
          sx={{ mt: 2 }}
        >
          Quay về ví
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentStatusChecker;