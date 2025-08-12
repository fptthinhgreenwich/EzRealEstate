import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Avatar,
  Rating,
  Divider,
  IconButton,
  useTheme,
  alpha
} from '@mui/material'
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Terrain as TerrainIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Verified as VerifiedIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Instagram as InstagramIcon
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Property {
  id: string
  title: string
  type: string
  price: number
  area: number
  address: string
  images: string
  premiumStatus: string
  views: number
}

interface Testimonial {
  id: string
  name: string
  avatar: string
  rating: number
  comment: string
  propertyType: string
}

const HomePage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])

  const propertyTypes = [
    { 
      type: 'APARTMENT', 
      label: 'Căn hộ', 
      icon: <ApartmentIcon />, 
      count: '2,500+',
      color: '#2196F3'
    },
    { 
      type: 'HOUSE', 
      label: 'Nhà riêng', 
      icon: <HomeIcon />, 
      count: '1,800+',
      color: '#4CAF50'
    },
    { 
      type: 'LAND', 
      label: 'Đất nền', 
      icon: <TerrainIcon />, 
      count: '950+',
      color: '#FF9800'
    },
    { 
      type: 'COMMERCIAL', 
      label: 'Thương mại', 
      icon: <BusinessIcon />, 
      count: '420+',
      color: '#9C27B0'
    }
  ]

  const features = [
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: 'Tìm kiếm nhanh chóng',
      description: 'Công cụ tìm kiếm thông minh với bộ lọc nâng cao'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 48 }} />,
      title: 'Tin đăng đã xác minh',
      description: 'Tất cả tin đăng đều được kiểm duyệt và xác minh'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Giao dịch an toàn',
      description: 'Bảo mật thông tin và hỗ trợ giao dịch minh bạch'
    },
    {
      icon: <SupportIcon sx={{ fontSize: 48 }} />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ'
    }
  ]

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      avatar: 'https://via.placeholder.com/60',
      rating: 5,
      comment: 'Tôi đã tìm được căn hộ mơ ước thông qua EZREALESTATE. Dịch vụ tuyệt vời!',
      propertyType: 'Căn hộ 2PN'
    },
    {
      id: '2',
      name: 'Trần Thị B',
      avatar: 'https://via.placeholder.com/60',
      rating: 5,
      comment: 'Bán nhà nhanh chóng, thủ tục đơn giản. Rất hài lòng với dịch vụ.',
      propertyType: 'Nhà phố 3 tầng'
    },
    {
      id: '3',
      name: 'Lê Minh C',
      avatar: 'https://via.placeholder.com/60',
      rating: 4,
      comment: 'Platform rất dễ sử dụng, nhiều lựa chọn bất động sản chất lượng.',
      propertyType: 'Đất nền 100m²'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Bất động sản' },
    { number: '5,000+', label: 'Khách hàng hài lòng' },
    { number: '15+', label: 'Tỉnh thành' },
    { number: '99%', label: 'Độ tin cậy' }
  ]

  useEffect(() => {
    fetchFeaturedProperties()
  }, [])

  const fetchFeaturedProperties = async () => {
    try {
      // Fetch properties from API
      const response = await api.get('/properties', {
        params: {
          status: 'AVAILABLE',
          limit: 6
        }
      })
      
      if (response.data.success) {
        const properties = response.data.data.properties.map((p: any) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
          area: p.area,
          address: p.address,
          images: p.images,
          premiumStatus: p.premiumStatus || 'NONE',
          views: p.views || 0
        }))
        
        // Sort properties: Premium first, then by views
        const sortedProperties = properties.sort((a: Property, b: Property) => {
          // Premium properties come first
          if (a.premiumStatus === 'PREMIUM' && b.premiumStatus !== 'PREMIUM') {
            return -1
          }
          if (a.premiumStatus !== 'PREMIUM' && b.premiumStatus === 'PREMIUM') {
            return 1
          }
          // Then sort by views (highest first)
          return b.views - a.views
        })
        
        // Take only first 3 for featured section
        setFeaturedProperties(sortedProperties.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      // Fallback to mock data if API fails
      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'Căn hộ cao cấp view sông Sài Gòn',
          type: 'APARTMENT',
          price: 5500000000,
          area: 75.5,
          address: 'Quận 1, TP.HCM',
          images: '["https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Premium+Apartment"]',
          premiumStatus: 'PREMIUM',
          views: 450
        },
        {
          id: '2',
          title: 'Nhà phố 3 tầng mặt tiền đường lớn',
          type: 'HOUSE',
          price: 8200000000,
          area: 60,
          address: 'Quận 7, TP.HCM',
          images: '["https://via.placeholder.com/300x200/7ED321/FFFFFF?text=Modern+House"]',
          premiumStatus: 'PREMIUM',
          views: 320
        },
        {
          id: '3',
          title: 'Đất nền khu dân cư cao cấp',
          type: 'LAND',
          price: 2800000000,
          area: 100,
          address: 'Quận 6, TP.HCM',
          images: '["https://via.placeholder.com/300x200/F5A623/FFFFFF?text=Premium+Land"]',
          premiumStatus: 'PREMIUM',
          views: 280
        }
      ]
      setFeaturedProperties(mockProperties)
    }
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchTerm)}`)
    } else {
      navigate('/properties')
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`
    }
    return `${(price / 1000000).toFixed(0)} triệu`
  }

  const parseImages = (images: string) => {
    try {
      return JSON.parse(images)[0] || 'https://via.placeholder.com/300x200'
    } catch {
      return 'https://via.placeholder.com/300x200'
    }
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="20" cy="20" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 2
              }}
            >
              Tìm ngôi nhà mơ ước của bạn
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                opacity: 0.9,
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              Nền tảng bất động sản hàng đầu Việt Nam với hàng nghìn tin đăng chất lượng
            </Typography>

            {/* Search Bar */}
            <Paper
              sx={{
                p: 2,
                maxWidth: 600,
                mx: 'auto',
                display: 'flex',
                gap: 2,
                borderRadius: 2,
                boxShadow: 3
              }}
            >
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo địa điểm, dự án..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="medium"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                sx={{ minWidth: 120 }}
              >
                Tìm kiếm
              </Button>
            </Paper>

            {/* Quick Stats */}
            <Grid container spacing={4} sx={{ mt: 6 }}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Property Types */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" component="h2" textAlign="center" gutterBottom>
          Loại hình bất động sản
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 6, color: 'text.secondary' }}>
          Khám phá các loại hình bất động sản phù hợp với nhu cầu của bạn
        </Typography>

        <Grid container spacing={4}>
          {propertyTypes.map((type) => (
            <Grid item xs={6} md={3} key={type.type}>
              <Card 
                sx={{ 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  p: 3,
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/properties?type=${type.type}`)}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: alpha(type.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: type.color
                    }}
                  >
                    {React.cloneElement(type.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {type.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {type.count} tin đăng có sẵn
                  </Typography>
                  <Button variant="outlined" component={Link} to={`/properties?type=${type.type}`}>
                    Xem ngay
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Properties */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h2" gutterBottom>
                Bất động sản nổi bật
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Những tin đăng được quan tâm nhất tuần này
              </Typography>
            </Box>
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/properties')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              Xem tất cả
            </Button>
          </Box>

          <Grid container spacing={3}>
            {featuredProperties.map((property) => (
              <Grid item xs={12} md={4} key={property.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={parseImages(property.images)}
                      alt={property.title}
                    />
                    {property.premiumStatus === 'PREMIUM' && (
                      <Chip
                        icon={<StarIcon />}
                        label="Premium"
                        color="warning"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: 'warning.main',
                          color: 'white'
                        }}
                      />
                    )}
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}>
                      <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {property.views}
                    </Box>
                  </Box>

                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {property.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {property.address}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatPrice(property.price)} VND
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {property.area}m²
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', md: 'none' } }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/properties')}
            >
              Xem tất cả bất động sản
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Premium Listing CTA */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h3" gutterBottom>
                Gói Premium Listing
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Đưa tin đăng của bạn lên trang đầu, tăng khả năng tiếp cận khách hàng lên đến 300%
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Hiển thị ưu tiên trên trang chủ
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Badge Premium nổi bật
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Thống kê chi tiết lượt xem
                </Typography>
                <Typography variant="body2">
                  ✓ Hỗ trợ 24/7 từ đội ngũ chuyên viên
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                sx={{ mr: 2 }}
                onClick={() => navigate('/dashboard')}
              >
                Nâng cấp Premium
              </Button>
              <Button variant="outlined" size="large">
                Tìm hiểu thêm
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem'
                }}
              >
                Premium Listing Demo
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
