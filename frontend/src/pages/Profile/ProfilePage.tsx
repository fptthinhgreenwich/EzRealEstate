import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  VpnKey as PasswordIcon,
  PhotoCamera as CameraIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { setUser } from '../../store/slices/authSlice';
import api from '../../services/api';

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
      id={`profile-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });
  
  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    memberSince: '',
    badges: []
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadProfile();
      loadStats();
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.data;
      setProfileData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || ''
      });
      // Also update the user in Redux if avatar changed
      if (userData.avatar && user && userData.avatar !== user.avatar) {
        dispatch(setUser({...user, ...userData}));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Lỗi khi tải thông tin profile');
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/users/profile', profileData);
      dispatch(setUser(response.data.data));
      setSuccess('Cập nhật profile thành công');
      setEditMode(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Lỗi khi cập nhật profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      setLoading(false);
      return;
    }
    
    try {
      await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Đổi mật khẩu thành công');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await api.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update user in Redux store with the new avatar
      if (response.data.success && response.data.data) {
        // Merge the updated data with existing user data
        const updatedUser = {
          ...user,
          ...response.data.data
        };
        dispatch(setUser(updatedUser));
        setSuccess('Cập nhật ảnh đại diện thành công');
      }
      
      // Reload profile to ensure consistency
      setTimeout(() => loadProfile(), 100);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Lỗi khi upload ảnh');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên', color: 'error' };
      case 'SELLER':
        return { label: 'Người bán', color: 'primary' };
      case 'BUYER':
        return { label: 'Người mua', color: 'info' };
      default:
        return { label: role, color: 'default' };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  color="primary"
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                >
                  <CameraIcon />
                </IconButton>
              </label>
            </Box>
            
            <Typography variant="h5" gutterBottom>
              {user?.fullName}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <BadgeIcon
                sx={{ verticalAlign: 'middle', mr: 1 }}
                color={getRoleBadge(user?.role || '').color as any}
              />
              <Typography variant="body1" component="span">
                {getRoleBadge(user?.role || '').label}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary={user?.email}
                  secondary="Email"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary={profileData.phone || 'Chưa cập nhật'}
                  secondary="Số điện thoại"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary={profileData.address || 'Chưa cập nhật'}
                  secondary="Địa chỉ"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary={stats.memberSince || 'N/A'}
                  secondary="Thành viên từ"
                />
              </ListItem>
            </List>
            
            {user?.role === 'SELLER' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h6">{stats.totalProperties}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      BĐS
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6">{stats.totalViews}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lượt xem
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6">{stats.totalInquiries}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Liên hệ
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Thông tin cá nhân" />
              <Tab label="Bảo mật" />
              {user?.role === 'SELLER' && <Tab label="Huy hiệu" />}
            </Tabs>
            
            {/* Personal Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Thông tin cá nhân</Typography>
                  {!editMode ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setEditMode(false);
                          loadProfile();
                        }}
                        sx={{ mr: 1 }}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleUpdateProfile}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Lưu'}
                      </Button>
                    </Box>
                  )}
                </Box>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Giới thiệu"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!editMode}
                      placeholder="Viết vài dòng giới thiệu về bạn..."
                    />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            
            {/* Security Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Bảo mật tài khoản
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PasswordIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Mật khẩu"
                      secondary="Đổi mật khẩu đăng nhập"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialog(true)}
                    >
                      Đổi mật khẩu
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemText
                      primary="Xác thực 2 bước"
                      secondary="Tăng cường bảo mật cho tài khoản"
                    />
                    <Button variant="outlined" disabled>
                      Sắp ra mắt
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemText
                      primary="Lịch sử đăng nhập"
                      secondary="Xem lịch sử truy cập tài khoản"
                    />
                    <Button variant="outlined" disabled>
                      Xem
                    </Button>
                  </ListItem>
                </List>
              </Box>
            </TabPanel>
            
            {/* Badges Tab (Seller only) */}
            {user?.role === 'SELLER' && (
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Huy hiệu đã đạt được
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <StarIcon sx={{ fontSize: 48, color: 'gold' }} />
                          <Typography variant="h6">
                            Top Seller
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bán được 10+ BĐS
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <HomeIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h6">
                            Chuyên gia BĐS
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            100+ tin đăng
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ opacity: 0.5 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <BadgeIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                          <Typography variant="h6" color="text.secondary">
                            Premium Seller
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Chưa đạt được
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type={showPassword.current ? 'text' : 'password'}
              label="Mật khẩu hiện tại"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                      edge="end"
                    >
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              type={showPassword.new ? 'text' : 'password'}
              label="Mật khẩu mới"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      edge="end"
                    >
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              type={showPassword.confirm ? 'text' : 'password'}
              label="Xác nhận mật khẩu mới"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      edge="end"
                    >
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Đổi mật khẩu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;