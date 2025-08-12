import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  ImageList,
  ImageListItem,
  Fab,
  Alert
} from '@mui/material'
import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Terrain as TerrainIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  ArrowBack as ArrowBackIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  SquareFoot as AreaIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as PriceIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  Report as ReportIcon
} from '@mui/icons-material'
import api from '../services/api'

interface Property {
  id: string
  title: string
  description: string
  type: string
  status: string
  price: number
  area: number
  bedrooms?: number
  bathrooms?: number
  address: string
  latitude?: number
  longitude?: number
  mapEmbedCode?: string
  images: string
  premiumStatus: string
  createdAt: string
  seller: {
    id: string
    fullName: string
    email: string
    phone?: string
    avatar?: string
  }
  features?: string
}

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const propertyTypes = {
    'HOUSE': { label: 'Nhà riêng', icon: <HomeIcon /> },
    'APARTMENT': { label: 'Căn hộ', icon: <ApartmentIcon /> },
    'LAND': { label: 'Đất nền', icon: <TerrainIcon /> },
    'COMMERCIAL': { label: 'Thương mại', icon: <BusinessIcon /> }
  }

  useEffect(() => {
    if (id) {
      fetchProperty(id)
    }
  }, [id])

  const fetchProperty = async (propertyId: string) => {
    try {
      setLoading(true)
      
      // Fetch from backend API
      const response = await api.get(`/properties/${propertyId}`)
      
      if (response.data.success && response.data.data) {
        const p = response.data.data
        
        // Map the backend data to our Property interface
        const mappedProperty: Property = {
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
          area: p.area,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          mapEmbedCode: p.mapEmbedCode,
          images: p.images,
          premiumStatus: p.premiumStatus || 'NONE',
          createdAt: p.createdAt,
          seller: {
            id: p.seller?.id || p.sellerId,
            fullName: p.seller?.fullName || 'Người bán',
            email: p.seller?.email || '',
            phone: p.seller?.phone,
            avatar: p.seller?.avatar
          },
          features: p.virtualTour || '[]'
        }
        
        setProperty(mappedProperty)
      } else {
        setProperty(null)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching property:', error)
      setProperty(null)
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ VND`
    }
    return `${(price / 1000000).toFixed(0)} triệu VND`
  }

  const parseArray = (jsonString: string | undefined) => {
    if (!jsonString) return []
    try {
      return JSON.parse(jsonString)
    } catch {
      return []
    }
  }

  const handleContactSeller = () => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    // Check if user is trying to message themselves
    if (currentUser?.id === property?.seller.id) {
      alert('Bạn không thể gửi tin nhắn cho chính mình!')
      return
    }
    
    // Navigate to chat page with seller and property info
    navigate(`/chat?sellerId=${property?.seller.id}&propertyId=${property?.id}`)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    )
  }

  if (!property) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy bất động sản này!</Alert>
      </Container>
    )
  }

  const images = parseArray(property.images)
  const features = parseArray(property.features)

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Quay lại
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Images & Details */}
        <Grid item xs={12} md={8}>
          {/* Main Image */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={images[selectedImageIndex] || 'https://via.placeholder.com/800x600'}
                alt={property.title}
                style={{ width: '100%', height: '400px', objectFit: 'cover' }}
              />
              
              {/* Premium Badge */}
              {property.premiumStatus === 'ACTIVE' && (
                <Chip
                  icon={<StarIcon />}
                  label="Premium Listing"
                  color="warning"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: 'warning.main',
                    color: 'white'
                  }}
                />
              )}

              {/* Action Buttons */}
              <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                <Fab size="small" color="default">
                  <ShareIcon />
                </Fab>
                <Fab size="small" color="default">
                  <FavoriteIcon />
                </Fab>
              </Box>
            </Box>
          </Card>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <ImageList sx={{ mb: 3 }} cols={5} rowHeight={100}>
              {images.map((image: string, index: number) => (
                <ImageListItem 
                  key={index}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedImageIndex === index ? '3px solid #1976d2' : 'none'
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${property.title} ${index + 1}`}
                    loading="lazy"
                    style={{ height: '100%', objectFit: 'cover' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}

          {/* Property Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {property.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body1" color="text.secondary">
                      {property.address}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {formatPrice(property.price)}
                  </Typography>
                  <Chip 
                    icon={propertyTypes[property.type as keyof typeof propertyTypes]?.icon}
                    label={propertyTypes[property.type as keyof typeof propertyTypes]?.label || property.type}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Property Stats */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AreaIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6">{property.area}m²</Typography>
                    <Typography variant="caption" color="text.secondary">Diện tích</Typography>
                  </Box>
                </Grid>
                {property.bedrooms && (
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BedIcon color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h6">{property.bedrooms}</Typography>
                      <Typography variant="caption" color="text.secondary">Phòng ngủ</Typography>
                    </Box>
                  </Grid>
                )}
                {property.bathrooms && (
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BathtubIcon color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h6">{property.bathrooms}</Typography>
                      <Typography variant="caption" color="text.secondary">Phòng tắm</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6">
                      {new Date(property.createdAt).getFullYear()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Năm đăng</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Description */}
              <Typography variant="h6" gutterBottom>
                Mô tả chi tiết
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {property.description}
              </Typography>

              {/* Features */}
              {features.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Tiện ích & Đặc điểm
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {features.map((feature: string, index: number) => (
                      <Chip
                        key={index}
                        label={feature}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          {property.mapEmbedCode && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vị trí trên bản đồ
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%',
                    height: 400,
                    borderRadius: 1,
                    overflow: 'hidden',
                    '& iframe': {
                      width: '100%',
                      height: '100%',
                      border: 0
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: property.mapEmbedCode }}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Seller Info & Contact */}
        <Grid item xs={12} md={4}>
          {/* Seller Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin người bán
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={property.seller.avatar}
                  sx={{ width: 64, height: 64, mr: 2 }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {property.seller.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Người bán
                  </Typography>
                </Box>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={property.seller.email} />
                </ListItem>
                {property.seller.phone && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={property.seller.phone} />
                  </ListItem>
                )}
              </List>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                {/* Only show contact buttons if current user is not the seller */}
                {currentUser?.id !== property.seller.id ? (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<MessageIcon />}
                      onClick={handleContactSeller}
                    >
                      Nhắn tin với người bán
                    </Button>
                    
                    {property.seller.phone && (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<PhoneIcon />}
                        href={`tel:${property.seller.phone}`}
                      >
                        Gọi điện
                      </Button>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    Đây là bất động sản của bạn
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Price Calculator */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tính toán chi phí
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PriceIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Giá bán"
                    secondary={formatPrice(property.price)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AreaIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Giá/m²"
                    secondary={formatPrice(property.price / property.area)}
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                Giá có thể thương lượng. Liên hệ người bán để biết thêm chi tiết.
              </Alert>
            </CardContent>
          </Card>

          {/* Report Button */}
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<ReportIcon />}
            sx={{ mt: 2 }}
          >
            Báo cáo tin đăng
          </Button>
        </Grid>
      </Grid>

    </Container>
  )
}

export default PropertyDetailPage
