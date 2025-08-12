import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Slider,
  FormLabel,
  Tooltip,
  Badge,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Terrain as TerrainIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
  Bed as BedIcon,
  Bathroom as BathroomIcon,
  SquareFoot as AreaIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../store/store';
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
      id={`buyer-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address: string;
  street?: string;
  ward?: any;
  district?: any;
  province?: any;
  images?: any[];
  status: string;
  premiumStatus?: string;
  views?: number;
  seller?: any;
  createdAt: string;
}

interface SavedProperty {
  id: string;
  property: Property;
  createdAt: string;
}

interface Inquiry {
  id: string;
  property: Property;
  message: string;
  status: string;
  createdAt: string;
  response?: string;
}

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: 0,
    maxPrice: 10000000000,
    minArea: 0,
    maxArea: 1000,
    bedrooms: '',
    bathrooms: '',
    provinceId: '',
    districtId: '',
    wardId: ''
  });
  
  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Location data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    savedCount: 0,
    inquiriesCount: 0,
    viewedCount: 0,
    responseRate: 0
  });

  const propertyTypes = [
    { value: 'HOUSE', label: 'Nhà riêng', icon: <HomeIcon /> },
    { value: 'APARTMENT', label: 'Căn hộ', icon: <ApartmentIcon /> },
    { value: 'LAND', label: 'Đất', icon: <TerrainIcon /> },
    { value: 'COMMERCIAL', label: 'Thương mại', icon: <BusinessIcon /> }
  ];

  useEffect(() => {
    if (authLoading) return;
    
    const token = localStorage.getItem('token');
    if (token && !user) {
      return;
    }
    
    if (!user || user.role !== 'BUYER') {
      navigate('/');
    } else {
      loadDashboardData();
      loadProvinces();
    }
  }, [user, navigate, authLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProperties(),
        loadSavedProperties(),
        loadInquiries(),
        loadRecommendations(),
        loadRecentlyViewed(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await api.get('/properties', {
        params: {
          status: 'AVAILABLE',
          ...filters,
          search: searchQuery
        }
      });
      if (response.data.success) {
        setProperties(response.data.data);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const response = await api.get(`/properties/saved/${user?.id}`);
      if (response.data.success) {
        setSavedProperties(response.data.data);
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
    }
  };

  const loadInquiries = async () => {
    try {
      const response = await api.get(`/inquiries/buyer/${user?.id}`);
      if (response.data.success) {
        setInquiries(response.data.data);
      }
    } catch (error) {
      console.error('Error loading inquiries:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await api.get(`/properties/recommendations/${user?.id}`);
      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const response = await api.get(`/properties/recently-viewed/${user?.id}`);
      if (response.data.success) {
        setRecentlyViewed(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/users/${user?.id}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProvinces = async () => {
    try {
      const response = await api.get('/locations/provinces');
      if (response.data.success) {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    try {
      const response = await api.get(`/locations/provinces/${provinceId}/districts`);
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadWards = async (districtId: string) => {
    try {
      const response = await api.get(`/locations/districts/${districtId}/wards`);
      if (response.data.success) {
        setWards(response.data.data);
      }
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const handleSaveProperty = async (propertyId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await api.delete(`/properties/saved/${propertyId}`);
      } else {
        await api.post(`/properties/saved/${propertyId}`);
      }
      loadSavedProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleSearch = () => {
    loadProperties();
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'provinceId' && value) {
      loadDistricts(value);
      setFilters(prev => ({ ...prev, districtId: '', wardId: '' }));
    }
    
    if (field === 'districtId' && value) {
      loadWards(value);
      setFilters(prev => ({ ...prev, wardId: '' }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPropertyIcon = (type: string) => {
    const propertyType = propertyTypes.find(t => t.value === type);
    return propertyType?.icon || <HomeIcon />;
  };

  const isSaved = (propertyId: string) => {
    return savedProperties.some(sp => sp.property.id === propertyId);
  };

  const renderPropertyCard = (property: Property) => (
    <Card key={property.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={property.images?.[0]?.url || 'https://via.placeholder.com/400x200'}
          alt={property.title}
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/property/${property.id}`)}
        />
        {property.premiumStatus === 'ACTIVE' && (
          <Chip
            label="Premium"
            size="small"
            color="warning"
            sx={{ position: 'absolute', top: 10, left: 10 }}
          />
        )}
        <IconButton
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
          }}
          onClick={() => handleSaveProperty(property.id, isSaved(property.id))}
        >
          {isSaved(property.id) ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {getPropertyIcon(property.type)}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {propertyTypes.find(t => t.value === property.type)?.label}
          </Typography>
        </Box>
        
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {property.title}
        </Typography>
        
        <Typography variant="h5" color="primary" gutterBottom>
          {formatCurrency(property.price)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }} noWrap>
            {property.district?.name}, {property.province?.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {property.bedrooms && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BedIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {property.bedrooms}
              </Typography>
            </Box>
          )}
          {property.bathrooms && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BathroomIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {property.bathrooms}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AreaIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              {property.area}m²
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={() => navigate(`/property/${property.id}`)}>
          Xem chi tiết
        </Button>
        <Button size="small" color="primary">
          Liên hệ
        </Button>
      </CardActions>
    </Card>
  );

  // Show loading state
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Người Mua
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tìm kiếm và quản lý bất động sản yêu thích của bạn
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FavoriteIcon color="error" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Đã lưu
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.savedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                BĐS yêu thích
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MessageIcon color="primary" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Liên hệ
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.inquiriesCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yêu cầu đã gửi
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ViewIcon color="info" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Đã xem
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.viewedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                BĐS đã xem
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingIcon color="success" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Phản hồi
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.responseRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ phản hồi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Tìm kiếm BĐS" />
          <Tab label="BĐS đã lưu" />
          <Tab label="Yêu cầu đã gửi" />
          <Tab label="Gợi ý cho bạn" />
          <Tab label="Đã xem gần đây" />
        </Tabs>
      </Paper>

      {/* Search Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo tên, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại BĐS</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Loại BĐS"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {propertyTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterOpen(true)}
              >
                Bộ lọc
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <ListViewIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Properties Grid/List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : properties.length > 0 ? (
          <Grid container spacing={3}>
            {properties.map(property => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                {renderPropertyCard(property)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Không tìm thấy bất động sản nào phù hợp
          </Alert>
        )}
      </TabPanel>

      {/* Saved Properties Tab */}
      <TabPanel value={tabValue} index={1}>
        {savedProperties.length > 0 ? (
          <Grid container spacing={3}>
            {savedProperties.map(saved => (
              <Grid item xs={12} sm={6} md={4} key={saved.id}>
                {renderPropertyCard(saved.property)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Bạn chưa lưu bất động sản nào
          </Alert>
        )}
      </TabPanel>

      {/* Inquiries Tab */}
      <TabPanel value={tabValue} index={2}>
        {inquiries.length > 0 ? (
          <List>
            {inquiries.map(inquiry => (
              <React.Fragment key={inquiry.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <MessageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={inquiry.property.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {inquiry.message}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(inquiry.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={inquiry.status === 'PENDING' ? 'Chờ phản hồi' : 'Đã phản hồi'}
                    size="small"
                    color={inquiry.status === 'PENDING' ? 'warning' : 'success'}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            Bạn chưa gửi yêu cầu liên hệ nào
          </Alert>
        )}
      </TabPanel>

      {/* Recommendations Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          Gợi ý dành cho bạn
        </Typography>
        {recommendations.length > 0 ? (
          <Grid container spacing={3}>
            {recommendations.map(property => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                {renderPropertyCard(property)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Chưa có gợi ý nào. Hãy xem thêm bất động sản để nhận gợi ý phù hợp!
          </Alert>
        )}
      </TabPanel>

      {/* Recently Viewed Tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" gutterBottom>
          Đã xem gần đây
        </Typography>
        {recentlyViewed.length > 0 ? (
          <Grid container spacing={3}>
            {recentlyViewed.map(property => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                {renderPropertyCard(property)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Bạn chưa xem bất động sản nào
          </Alert>
        )}
      </TabPanel>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Bộ lọc</Typography>
            <IconButton onClick={() => setFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormLabel>Khoảng giá (VNĐ)</FormLabel>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onChange={(e, value) => {
                const [min, max] = value as number[];
                handleFilterChange('minPrice', min);
                handleFilterChange('maxPrice', max);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={10000000000}
              step={100000000}
              valueLabelFormat={(value) => formatCurrency(value)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormLabel>Diện tích (m²)</FormLabel>
            <Slider
              value={[filters.minArea, filters.maxArea]}
              onChange={(e, value) => {
                const [min, max] = value as number[];
                handleFilterChange('minArea', min);
                handleFilterChange('maxArea', max);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              step={10}
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phòng ngủ"
                type="number"
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phòng tắm"
                type="number"
                value={filters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tỉnh/Thành phố</InputLabel>
            <Select
              value={filters.provinceId}
              onChange={(e) => handleFilterChange('provinceId', e.target.value)}
              label="Tỉnh/Thành phố"
            >
              <MenuItem value="">Tất cả</MenuItem>
              {provinces.map(province => (
                <MenuItem key={province.id} value={province.id}>
                  {province.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {filters.provinceId && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Quận/Huyện</InputLabel>
              <Select
                value={filters.districtId}
                onChange={(e) => handleFilterChange('districtId', e.target.value)}
                label="Quận/Huyện"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {districts.map(district => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {filters.districtId && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Phường/Xã</InputLabel>
              <Select
                value={filters.wardId}
                onChange={(e) => handleFilterChange('wardId', e.target.value)}
                label="Phường/Xã"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {wards.map(ward => (
                  <MenuItem key={ward.id} value={ward.id}>
                    {ward.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setFilters({
                  type: '',
                  minPrice: 0,
                  maxPrice: 10000000000,
                  minArea: 0,
                  maxArea: 1000,
                  bedrooms: '',
                  bathrooms: '',
                  provinceId: '',
                  districtId: '',
                  wardId: ''
                });
              }}
            >
              Xóa bộ lọc
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleSearch();
                setFilterOpen(false);
              }}
            >
              Áp dụng
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default BuyerDashboard;