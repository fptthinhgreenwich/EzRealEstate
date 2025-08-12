import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CircularProgress
} from '@mui/material'
import {
  Person as PersonIcon,
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
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Apartment as ApartmentIcon,
  Business as BusinessIcon,
  Terrain as TerrainIcon,
  Upgrade as UpgradeIcon,
  CreditCard as PaymentIcon
} from '@mui/icons-material'

interface Property {
  id: string
  title: string
  type: string
  status: string
  price: number
  area: number
  address: string
  images: string
  premiumStatus: string
  views: number
  createdAt: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  // Mock user data
  const user = {
    id: '1',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    avatar: 'https://via.placeholder.com/100',
    memberSince: '2023-01-15',
    totalProperties: 5,
    totalViews: 1250,
    totalPremium: 2
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock properties data
      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'Căn hộ cao cấp view sông Sài Gòn',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          price: 5500000000,
          area: 75.5,
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          images: '["https://via.placeholder.com/300x200"]',
          premiumStatus: 'ACTIVE',
          views: 450,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'Nhà phố 3 tầng mặt tiền đường lớn',
          type: 'HOUSE',
          status: 'AVAILABLE', 
          price: 8200000000,
          area: 60,
          address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM',
          images: '["https://via.placeholder.com/300x200"]',
          premiumStatus: 'NONE',
          views: 320,
          createdAt: '2024-01-10'
        },
        {
          id: '3',
          title: 'Đất nền khu dân cư cao cấp',
          type: 'LAND',
          status: 'SOLD',
          price: 2800000000,
          area: 100,
          address: '789 Võ Văn Kiệt, Quận 6, TP.HCM',
          images: '["https://via.placeholder.com/300x200"]',
          premiumStatus: 'EXPIRED',
          views: 280,
          createdAt: '2023-12-05'
        }
      ]

      setProperties(mockProperties)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`
    }
    return `${(price / 1000000).toFixed(0)} triệu`
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'HOUSE': return <HomeIcon />
      case 'APARTMENT': return <ApartmentIcon />
      case 'LAND': return <TerrainIcon />
      case 'COMMERCIAL': return <BusinessIcon />
      default: return <HomeIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success'
      case 'SOLD': return 'default'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Đang bán'
      case 'SOLD': return 'Đã bán'
      case 'PENDING': return 'Chờ duyệt'
      default: return status
    }
  }

  const getPremiumColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'warning'
      case 'EXPIRED': return 'error'
      default: return 'default'
    }
  }

  const getPremiumLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Premium'
      case 'EXPIRED': return 'Hết hạn'
      default: return 'Thường'
    }
  }

  const handlePropertyMenuClick = (event: React.MouseEvent<HTMLElement>, property: Property) => {
    setAnchorEl(event.currentTarget)
    setSelectedProperty(property)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedProperty(null)
  }

  const handleDeleteProperty = async () => {
    if (selectedProperty) {
      try {
        // Simulate API call
        console.log('Deleting property:', selectedProperty.id)
        setProperties(prev => prev.filter(p => p.id !== selectedProperty.id))
        setDeleteDialogOpen(false)
        handleMenuClose()
      } catch (error) {
        console.error('Error deleting property:', error)
      }
    }
  }

  const handleUpgradeProperty = async () => {
    if (selectedProperty) {
      try {
        // Simulate API call
        console.log('Upgrading property:', selectedProperty.id)
        setProperties(prev => prev.map(p => 
          p.id === selectedProperty.id 
            ? { ...p, premiumStatus: 'ACTIVE' }
            : p
        ))
        setUpgradeDialogOpen(false)
        handleMenuClose()
      } catch (error) {
        console.error('Error upgrading property:', error)
      }
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý tin đăng và theo dõi hiệu suất của bạn
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {user.totalProperties}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tin đăng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {user.totalViews.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng lượt xem
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {user.totalPremium}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tin Premium
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    +25%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tăng trưởng tuần
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Sidebar - User Info */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={user.avatar}
                  sx={{ width: 80, height: 80, mb: 2 }}
                >
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thành viên từ {new Date(user.memberSince).getFullYear()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Hồ sơ"
                    secondary={user.email}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <HomeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Tin đăng"
                    secondary={`${user.totalProperties} bất động sản`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <StarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Premium"
                    secondary={`${user.totalPremium} tin đang hoạt động`}
                  />
                </ListItem>
              </List>

              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                startIcon={<EditIcon />}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                aria-label="dashboard tabs"
              >
                <Tab label="Tin đăng của tôi" />
                <Tab label="Thống kê" />
                <Tab label="Premium" />
              </Tabs>
            </Box>

            {/* Tab 1: My Properties */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Danh sách tin đăng ({properties.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/new-property')}
                >
                  Đăng tin mới
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bất động sản</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Giá</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Premium</TableCell>
                        <TableCell>Lượt xem</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <img
                                src={JSON.parse(property.images)[0]}
                                alt={property.title}
                                style={{ 
                                  width: 60, 
                                  height: 45, 
                                  objectFit: 'cover', 
                                  borderRadius: 4,
                                  marginRight: 12
                                }}
                              />
                              <Box>
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                                  {property.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <LocationIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                  {property.address}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              icon={getPropertyIcon(property.type)}
                              label={property.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {formatPrice(property.price)} VND
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {property.area}m²
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={getStatusLabel(property.status)}
                              color={getStatusColor(property.status) as any}
                              size="small"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={getPremiumLabel(property.premiumStatus)}
                              color={getPremiumColor(property.premiumStatus) as any}
                              size="small"
                              icon={property.premiumStatus === 'ACTIVE' ? <StarIcon /> : undefined}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {property.views.toLocaleString()}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => handlePropertyMenuClick(e, property)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* Tab 2: Analytics */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Thống kê hiệu suất
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Lượt xem theo tuần
                      </Typography>
                      <Box sx={{ 
                        height: 200, 
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1
                      }}>
                        <Typography color="text.secondary">
                          Biểu đồ sẽ được tích hợp tại đây
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top tin đăng được xem nhiều
                      </Typography>
                      <List>
                        {properties
                          .sort((a, b) => b.views - a.views)
                          .slice(0, 3)
                          .map((property, index) => (
                            <ListItem key={property.id}>
                              <ListItemIcon>
                                <Typography variant="h6" color="primary">
                                  {index + 1}
                                </Typography>
                              </ListItemIcon>
                              <ListItemText
                                primary={property.title}
                                secondary={`${property.views} lượt xem`}
                              />
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 3: Premium */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Quản lý Premium Listing
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Premium Listing giúp tin đăng của bạn hiển thị nổi bật hơn và thu hút nhiều người xem hơn.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <StarIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Gói Premium
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        500K VND
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        /tin đăng/30 ngày
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText primary="✓ Hiển thị nổi bật" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="✓ Ưu tiên trong tìm kiếm" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="✓ Badge Premium" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="✓ Thống kê chi tiết" />
                        </ListItem>
                      </List>

                      <Button 
                        variant="contained" 
                        fullWidth
                        startIcon={<PaymentIcon />}
                        sx={{ mt: 2 }}
                      >
                        Nâng cấp ngay
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Tin đăng Premium hiện tại
                  </Typography>
                  
                  {properties
                    .filter(p => p.premiumStatus === 'ACTIVE')
                    .map((property) => (
                      <Card key={property.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <img
                                src={JSON.parse(property.images)[0]}
                                alt={property.title}
                                style={{ 
                                  width: 80, 
                                  height: 60, 
                                  objectFit: 'cover', 
                                  borderRadius: 4,
                                  marginRight: 16
                                }}
                              />
                              <Box>
                                <Typography variant="h6" gutterBottom>
                                  {property.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {property.views} lượt xem • Còn 15 ngày
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box>
                              <Chip
                                icon={<StarIcon />}
                                label="Premium Active"
                                color="warning"
                                sx={{ mr: 1 }}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ScheduleIcon />}
                              >
                                Gia hạn
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/property/${selectedProperty?.id}`)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          Xem chi tiết
        </MenuItem>
        
        <MenuItem onClick={() => {
          navigate(`/dashboard/edit-property/${selectedProperty?.id}`)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Chỉnh sửa
        </MenuItem>
        
        {selectedProperty?.premiumStatus !== 'ACTIVE' && (
          <MenuItem onClick={() => {
            setUpgradeDialogOpen(true)
          }}>
            <ListItemIcon>
              <UpgradeIcon fontSize="small" />
            </ListItemIcon>
            Nâng cấp Premium
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setDeleteDialogOpen(true)
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Xóa tin đăng
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa tin đăng "{selectedProperty?.title}"?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleDeleteProperty} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade to Premium Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)}>
        <DialogTitle>Nâng cấp Premium Listing</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Nâng cấp tin đăng "{selectedProperty?.title}" lên Premium với giá 500,000 VND/30 ngày?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Premium Listing sẽ hiển thị nổi bật và được ưu tiên trong kết quả tìm kiếm.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleUpgradeProperty} variant="contained">
            Thanh toán & Nâng cấp
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default DashboardPage
