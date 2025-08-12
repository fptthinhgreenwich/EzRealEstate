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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Terrain as TerrainIcon,
  Business as BusinessIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
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
  images: string
  premiumStatus: string
  createdAt: string
  seller: {
    fullName: string
  }
}

const PropertyListPage = () => {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const propertyTypes = [
    { value: 'HOUSE', label: 'Nhà riêng', icon: <HomeIcon /> },
    { value: 'APARTMENT', label: 'Căn hộ', icon: <ApartmentIcon /> },
    { value: 'LAND', label: 'Đất nền', icon: <TerrainIcon /> },
    { value: 'COMMERCIAL', label: 'Thương mại', icon: <BusinessIcon /> }
  ]

  useEffect(() => {
    fetchProperties()
  }, [page, selectedType, searchTerm, priceRange])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params: any = {
        page: page,
        limit: 6,
        status: 'AVAILABLE'
      }
      
      if (selectedType) {
        params.type = selectedType
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      if (priceRange.min) {
        params.minPrice = parseFloat(priceRange.min) * 1000000000 // Convert tỷ to VND
      }
      
      if (priceRange.max) {
        params.maxPrice = parseFloat(priceRange.max) * 1000000000
      }

      // Fetch from API
      const response = await api.get('/properties', { params })
      
      if (response.data.success) {
        // Map the data to match our interface
        const mappedProperties = response.data.data.properties.map((p: any) => ({
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
          images: p.images,
          premiumStatus: p.premiumStatus || 'NONE',
          createdAt: p.createdAt,
          seller: {
            fullName: p.seller?.fullName || 'Người bán'
          }
        }))
        
        // Sort properties: Premium first, then by creation date
        const sortedProperties = mappedProperties.sort((a: any, b: any) => {
          // Premium properties come first
          if (a.premiumStatus === 'PREMIUM' && b.premiumStatus !== 'PREMIUM') {
            return -1
          }
          if (a.premiumStatus !== 'PREMIUM' && b.premiumStatus === 'PREMIUM') {
            return 1
          }
          // Then sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        
        setProperties(sortedProperties)
        setTotalPages(response.data.data.pagination?.totalPages || 1)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching properties:', error)
      // If API fails, show empty results
      setProperties([])
      setTotalPages(1)
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
    const typeInfo = propertyTypes.find(t => t.value === type)
    return typeInfo?.icon || <HomeIcon />
  }

  const getPropertyTypeLabel = (type: string) => {
    const typeInfo = propertyTypes.find(t => t.value === type)
    return typeInfo?.label || type
  }

  const parseImages = (images: string) => {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed[0] : 'https://via.placeholder.com/300x200'
    } catch {
      return 'https://via.placeholder.com/300x200'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tìm kiếm bất động sản
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Khám phá hàng nghìn tin đăng bất động sản chất lượng
        </Typography>
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo địa chỉ, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Loại hình</InputLabel>
              <Select
                value={selectedType}
                label="Loại hình"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {propertyTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Giá từ (tỷ)"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Giá đến (tỷ)"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            />
          </Grid>

          <Grid item xs={12} md={1}>
            <IconButton color="primary" size="large">
              <FilterIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Property Type Chips */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tất cả"
            onClick={() => setSelectedType('')}
            color={selectedType === '' ? 'primary' : 'default'}
            variant={selectedType === '' ? 'filled' : 'outlined'}
          />
          {propertyTypes.map((type) => (
            <Chip
              key={type.value}
              icon={type.icon}
              label={type.label}
              onClick={() => setSelectedType(type.value)}
              color={selectedType === type.value ? 'primary' : 'default'}
              variant={selectedType === type.value ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Results Count */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Tìm thấy {properties.length} kết quả
        </Typography>
      </Box>

      {/* Property Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Đang tải...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {properties.map((property) => (
            <Grid item xs={12} md={6} lg={4} key={property.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease'
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
                  
                  {/* Premium Badge */}
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

                  {/* Property Type */}
                  <Chip
                    icon={getPropertyIcon(property.type)}
                    label={getPropertyTypeLabel(property.type)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }}
                  />
                </Box>

                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {property.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {property.description.length > 80 
                      ? `${property.description.substring(0, 80)}...`
                      : property.description
                    }
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {property.address}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formatPrice(property.price)} VND
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {property.area}m²
                    </Typography>
                  </Box>

                  {property.bedrooms && property.bathrooms && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        🛏️ {property.bedrooms} PN
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🚿 {property.bathrooms} PT
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Đăng bởi: {property.seller.fullName}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/property/${property.id}`)
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* No Results */}
      {!loading && properties.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" gutterBottom>
            Không tìm thấy kết quả nào
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => {
              setSearchTerm('')
              setSelectedType('')
              setPriceRange({ min: '', max: '' })
            }}
          >
            Xóa bộ lọc
          </Button>
        </Box>
      )}
    </Container>
  )
}

export default PropertyListPage
