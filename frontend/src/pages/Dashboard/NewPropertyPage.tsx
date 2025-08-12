import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  IconButton,
  FormHelperText,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Terrain as TerrainIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/store';
import api from '../../services/api';

interface Province {
  id: string;
  code: string;
  name: string;
}

interface District {
  id: string;
  code: string;
  name: string;
  provinceId: string;
}

interface Ward {
  id: string;
  code: string;
  name: string;
  districtId: string;
}

const propertyTypes = [
  { value: 'HOUSE', label: 'Nhà riêng', icon: <HomeIcon /> },
  { value: 'APARTMENT', label: 'Căn hộ/Chung cư', icon: <ApartmentIcon /> },
  { value: 'LAND', label: 'Đất', icon: <TerrainIcon /> },
  { value: 'COMMERCIAL', label: 'Mặt bằng kinh doanh', icon: <BusinessIcon /> }
];

const steps = ['Thông tin cơ bản', 'Vị trí', 'Chi tiết', 'Hình ảnh'];

const NewPropertyPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic info
    title: '',
    description: '',
    type: 'APARTMENT',
    price: '',
    area: '',
    
    // Location
    provinceId: '',
    districtId: '',
    wardId: '',
    street: '',
    address: '',
    
    // Details
    bedrooms: '',
    bathrooms: '',
    floors: '',
    yearBuilt: '',
    features: [] as string[],
    
    // Map embed (optional)
    mapEmbedCode: ''
  });
  
  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Available features
  const availableFeatures = [
    'Sân vườn', 'Gara ô tô', 'Thang máy', 'Hồ bơi', 
    'Sân thượng', 'Ban công', 'Tầng hầm', 'An ninh 24/7',
    'Gần trường học', 'Gần bệnh viện', 'Gần chợ', 'Gần công viên'
  ];

  useEffect(() => {
    if (!user || user.role === 'BUYER') {
      navigate('/dashboard');
      return;
    }
    loadProvinces();
  }, [user, navigate]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations/provinces');
      if (response.data.success) {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      setError('Lỗi khi tải danh sách tỉnh/thành phố');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    try {
      const response = await api.get(`/locations/provinces/${provinceId}/districts`);
      if (response.data.success) {
        setDistricts(response.data.data);
        setWards([]); // Reset wards when province changes
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Load districts when province changes
    if (field === 'provinceId' && value) {
      loadDistricts(value);
      setFormData(prev => ({
        ...prev,
        districtId: '',
        wardId: ''
      }));
    }
    
    // Load wards when district changes
    if (field === 'districtId' && value) {
      loadWards(value);
      setFormData(prev => ({
        ...prev,
        wardId: ''
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const newImages = Array.from(files);
    const totalImages = images.length + newImages.length;
    
    if (totalImages > 10) {
      setError('Chỉ được upload tối đa 10 ảnh');
      return;
    }
    
    setImages(prev => [...prev, ...newImages]);
    
    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]); // Clean up preview URL
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic info
        if (!formData.title || !formData.description || !formData.type || !formData.price || !formData.area) {
          setError('Vui lòng điền đầy đủ thông tin cơ bản');
          return false;
        }
        break;
      case 1: // Location
        if (!formData.provinceId || !formData.districtId || !formData.wardId || !formData.address) {
          setError('Vui lòng điền đầy đủ thông tin vị trí');
          return false;
        }
        break;
      case 2: // Details
        // Optional, no validation needed
        break;
      case 3: // Images
        if (images.length === 0) {
          setError('Vui lòng upload ít nhất 1 ảnh');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // Create property first
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        mapEmbedCode: formData.mapEmbedCode || null
      };
      
      const response = await api.post('/properties', propertyData);
      
      if (response.data.success) {
        const propertyId = response.data.data.id;
        
        // Upload images if any
        if (images.length > 0) {
          try {
            const imageFormData = new FormData();
            images.forEach(image => {
              imageFormData.append('images', image);
            });
            
            await api.post(`/properties/${propertyId}/images`, imageFormData);
          } catch (imageError: any) {
            console.error('Image upload error:', imageError);
            // Continue even if image upload fails
            setError('Tin đã được tạo nhưng lỗi khi upload ảnh. Bạn có thể thêm ảnh sau.');
          }
        }
        
        setSuccess('Đăng tin thành công! Tin của bạn sẽ được duyệt trong 24h.');
        
        // Redirect to properties list after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Lỗi khi đăng tin');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề tin đăng"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                helperText="Ví dụ: Bán căn hộ 2PN tại Quận 1"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả chi tiết"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                helperText="Mô tả chi tiết về bất động sản của bạn"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Loại bất động sản
              </Typography>
              <Grid container spacing={2}>
                {propertyTypes.map(type => (
                  <Grid item xs={6} sm={3} key={type.value}>
                    <Card
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: formData.type === type.value ? 2 : 1,
                        borderColor: formData.type === type.value ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => handleInputChange('type', type.value)}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        {type.icon}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {type.label}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Giá"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Diện tích"
                type="number"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">m²</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        );
        
      case 1: // Location
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Tỉnh/Thành phố</InputLabel>
                <Select
                  value={formData.provinceId}
                  onChange={(e) => handleInputChange('provinceId', e.target.value)}
                  label="Tỉnh/Thành phố"
                >
                  {provinces.map(province => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required disabled={!formData.provinceId}>
                <InputLabel>Quận/Huyện</InputLabel>
                <Select
                  value={formData.districtId}
                  onChange={(e) => handleInputChange('districtId', e.target.value)}
                  label="Quận/Huyện"
                >
                  {districts.map(district => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required disabled={!formData.districtId}>
                <InputLabel>Phường/Xã</InputLabel>
                <Select
                  value={formData.wardId}
                  onChange={(e) => handleInputChange('wardId', e.target.value)}
                  label="Phường/Xã"
                >
                  {wards.map(ward => (
                    <MenuItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên đường"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                helperText="Ví dụ: Nguyễn Huệ"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ cụ thể"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                helperText="Số nhà, tên tòa nhà, tên đường..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Google Maps Embed Code"
                multiline
                rows={3}
                value={formData.mapEmbedCode}
                onChange={(e) => handleInputChange('mapEmbedCode', e.target.value)}
                placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
                helperText="Dán mã nhúng iframe từ Google Maps. Vào Google Maps → Chia sẻ → Nhúng bản đồ → Sao chép HTML"
              />
            </Grid>
            
            {formData.mapEmbedCode && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Xem trước bản đồ:
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 400, 
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.mapEmbedCode }}
                />
              </Grid>
            )}
          </Grid>
        );
        
      case 2: // Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Số phòng ngủ"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Số phòng tắm"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Số tầng"
                type="number"
                value={formData.floors}
                onChange={(e) => handleInputChange('floors', e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Năm xây dựng"
                type="number"
                value={formData.yearBuilt}
                onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tiện ích
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableFeatures.map(feature => (
                  <Chip
                    key={feature}
                    label={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    color={formData.features.includes(feature) ? 'primary' : 'default'}
                    variant={formData.features.includes(feature) ? 'filled' : 'outlined'}
                    icon={formData.features.includes(feature) ? <CheckIcon /> : undefined}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );
        
      case 3: // Images
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    Chọn ảnh (Tối đa 10 ảnh)
                  </Button>
                </label>
                <FormHelperText>
                  JPG, PNG, GIF - Tối đa 5MB mỗi ảnh
                </FormHelperText>
              </Box>
              
              {imagePreviews.length > 0 && (
                <Grid container spacing={2}>
                  {imagePreviews.map((preview, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="150"
                          image={preview}
                          alt={`Preview ${index + 1}`}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            bgcolor: 'rgba(255,255,255,0.8)'
                          }}
                          onClick={() => removeImage(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {index === 0 && (
                          <Chip
                            label="Ảnh chính"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 5,
                              left: 5
                            }}
                          />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };

  if (loading && activeStep === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          
          <Typography variant="h4" gutterBottom>
            Đăng tin bất động sản
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Quay lại
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {submitting ? 'Đang đăng...' : 'Đăng tin'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
            >
              Tiếp theo
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default NewPropertyPage;