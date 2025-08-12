import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  Link as MuiLink,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../services/api';
import { loginSuccess } from '../../store/slices/authSlice';

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  password: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu là bắt buộc'),
  fullName: yup.string().required('Họ tên là bắt buộc'),
  phone: yup.string().matches(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ'),
  role: yup.string().oneOf(['BUYER', 'SELLER'], 'Vai trò không hợp lệ').required('Vai trò là bắt buộc'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'BUYER',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.register(data);
      
      if (response.success) {
        dispatch(loginSuccess({
          user: response.data.user,
          token: response.data.token,
        }));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Đăng ký tài khoản
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tham gia EZREALESTATE để mua bán bất động sản
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Họ và tên"
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Số điện thoại (tùy chọn)"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Mật khẩu"
                type="password"
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.role} sx={{ mb: 3 }}>
                <InputLabel>Vai trò</InputLabel>
                <Select {...field} label="Vai trò">
                  <MenuItem value="BUYER">Người mua - Tìm kiếm bất động sản</MenuItem>
                  <MenuItem value="SELLER">Người bán - Đăng tin bán bất động sản</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
              </FormControl>
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Đã có tài khoản?{' '}
            <MuiLink component={Link} to="/login">
              Đăng nhập ngay
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
