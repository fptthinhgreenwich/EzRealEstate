import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Card,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Landscape as LandIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../store/store';
import api from '../../services/api';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: number;
  provinceId: string;
  districtId: string;
  wardId: string;
  street?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string;
  virtualTour?: string;
  premiumStatus: string;
  premiumUntil?: string;
  province?: any;
  district?: any;
  ward?: any;
  seller?: any;
}

interface Location {
  id: string;
  name: string;
  type: string;
  parentId?: string;
}

const EditPropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Property data
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    yearBuilt: '',
    provinceId: '',
    districtId: '',
    wardId: '',
    street: '',
    address: '',
    latitude: '',
    longitude: '',
    mapEmbedCode: '',
    features: [] as string[]
  });
  
  // Location data
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  
  // Image management
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleteImageDialog, setDeleteImageDialog] = useState<string | null>(null);
  
  // Load property data
  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }
    
    loadProperty();
    loadProvinces();
  }, [id]);
  
  // Load districts when province changes
  useEffect(() => {
    if (formData.provinceId) {
      loadDistricts(formData.provinceId);
    }
  }, [formData.provinceId]);
  
  // Load wards when district changes
  useEffect(() => {
    if (formData.districtId) {
      loadWards(formData.districtId);
    }
  }, [formData.districtId]);
  
  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      
      if (response.data.success) {
        const propertyData = response.data.data;
        setProperty(propertyData);
        
        // Parse images
        let imageList = [];
        try {
          imageList = JSON.parse(propertyData.images || '[]');
        } catch (e) {
          imageList = [];
        }
        setImages(imageList);
        
        // Parse features
        let featureList = [];
        try {
          if (propertyData.virtualTour) {
            featureList = JSON.parse(propertyData.virtualTour);
          }
        } catch (e) {
          featureList = [];
        }
        
        // Set form data
        setFormData({
          title: propertyData.title || '',
          description: propertyData.description || '',
          type: propertyData.type || 'APARTMENT',
          status: propertyData.status || 'AVAILABLE',
          price: propertyData.price?.toString() || '',
          area: propertyData.area?.toString() || '',
          bedrooms: propertyData.bedrooms?.toString() || '',
          bathrooms: propertyData.bathrooms?.toString() || '',
          floors: propertyData.floors?.toString() || '',
          yearBuilt: propertyData.yearBuilt?.toString() || '',
          provinceId: propertyData.provinceId || '',
          districtId: propertyData.districtId || '',
          wardId: propertyData.wardId || '',
          street: propertyData.street || '',
          address: propertyData.address || '',
          latitude: propertyData.latitude?.toString() || '',
          longitude: propertyData.longitude?.toString() || '',
          mapEmbedCode: propertyData.mapEmbedCode || '',
          features: featureList
        });
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Không thể tải thông tin bất động sản');
    } finally {
      setLoading(false);
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
      const response = await api.get(`/locations/districts/${provinceId}`);
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };
  
  const loadWards = async (districtId: string) => {
    try {
      const response = await api.get(`/locations/wards/${districtId}`);
      if (response.data.success) {
        setWards(response.data.data);
      }
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };
  
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset dependent fields
    if (name === 'provinceId') {
      setFormData(prev => ({
        ...prev,
        districtId: '',
        wardId: ''
      }));
      setDistricts([]);
      setWards([]);
    } else if (name === 'districtId') {
      setFormData(prev => ({
        ...prev,
        wardId: ''
      }));
      setWards([]);
    }
  };
  
  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    
    try {
      const formDataUpload = new FormData();
      for (let i = 0; i < files.length; i++) {
        formDataUpload.append('images', files[i]);
      }
      
      const response = await api.post(`/properties/${id}/images`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setImages(response.data.data.images);
        setSuccess('Upload ảnh thành công!');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Lỗi khi upload ảnh');
    } finally {
      setUploadingImages(false);
    }
  };
  
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const newImages = images.filter(img => img !== imageUrl);
      
      // Update property with new image list
      const response = await api.put(`/properties/${id}`, {
        images: JSON.stringify(newImages)
      });
      
      if (response.data.success) {
        setImages(newImages);
        setSuccess('Xóa ảnh thành công!');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Lỗi khi xóa ảnh');
    } finally {
      setDeleteImageDialog(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.area) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const updateData = {
        ...formData,
        features: formData.features.length > 0 ? formData.features : undefined
      };
      
      const response = await api.put(`/properties/${id}`, updateData);
      
      if (response.data.success) {
        setSuccess('Cập nhật bất động sản thành công!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error updating property:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật bất động sản');
    } finally {
      setSaving(false);
    }
  };
  
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'HOUSE':
        return <HomeIcon />;
      case 'APARTMENT':
        return <ApartmentIcon />;
      case 'LAND':
        return <LandIcon />;
      case 'COMMERCIAL':
        return <BusinessIcon />;
      default:
        return <HomeIcon />;
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!property) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Không tìm thấy bất động sản</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Quay lại Dashboard
        </Button>
      </Container>
    );
  }
  
  const availableFeatures = [
    'Bãi đỗ xe',
    'Thang máy',
    'Ban công',
    'Sân vườn',
    'Hồ bơi',
    'An ninh 24/7',
    'Điều hòa',
    'Nội thất đầy đủ',
    'Gần trường học',
    'Gần bệnh viện',
    'Gần chợ',
    'Gần công viên'
  ];
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">
              Chỉnh sửa bất động sản
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {property.id}
            </Typography>
          </Box>
        </Box>
        {property.premiumStatus === 'ACTIVE' && (
          <Chip label="Premium" color="warning" icon={<StarIcon />} />
        )}
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tiêu đề tin đăng"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    helperText="Tiêu đề ngắn gọn, thu hút người xem"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả chi tiết"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    required
                    helperText="Mô tả chi tiết về bất động sản, vị trí, tiện ích..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Loại bất động sản</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      label="Loại bất động sản"
                      startAdornment={getPropertyTypeIcon(formData.type)}
                    >
                      <MenuItem value="APARTMENT">Căn hộ/Chung cư</MenuItem>
                      <MenuItem value="HOUSE">Nhà riêng</MenuItem>
                      <MenuItem value="LAND">Đất nền</MenuItem>
                      <MenuItem value="COMMERCIAL">Nhà mặt tiền/Văn phòng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Trạng thái"
                      disabled={user?.role !== 'ADMIN'}
                    >
                      <MenuItem value="AVAILABLE">Đang bán/cho thuê</MenuItem>
                      <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                      <MenuItem value="SOLD">Đã bán</MenuItem>
                      <MenuItem value="RENTED">Đã cho thuê</MenuItem>
                    </Select>
                    {user?.role !== 'ADMIN' && (
                      <FormHelperText>Chỉ admin mới có thể thay đổi trạng thái</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Price and Area */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Giá và diện tích
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Giá"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    type="number"
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
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    type="number"
                    required
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m²</InputAdornment>
                    }}
                  />
                </Grid>
                
                {(formData.type === 'HOUSE' || formData.type === 'APARTMENT') && (
                  <>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Số phòng ngủ"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleChange}
                        type="number"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Số phòng tắm"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleChange}
                        type="number"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Số tầng"
                        name="floors"
                        value={formData.floors}
                        onChange={handleChange}
                        type="number"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Năm xây dựng"
                        name="yearBuilt"
                        value={formData.yearBuilt}
                        onChange={handleChange}
                        type="number"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          {/* Location */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vị trí
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Tỉnh/Thành phố</InputLabel>
                    <Select
                      name="provinceId"
                      value={formData.provinceId}
                      onChange={handleChange}
                      label="Tỉnh/Thành phố"
                    >
                      {provinces.map((province) => (
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
                      name="districtId"
                      value={formData.districtId}
                      onChange={handleChange}
                      label="Quận/Huyện"
                    >
                      {districts.map((district) => (
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
                      name="wardId"
                      value={formData.wardId}
                      onChange={handleChange}
                      label="Phường/Xã"
                    >
                      {wards.map((ward) => (
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
                    label="Số nhà, tên đường"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Địa chỉ đầy đủ"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Google Maps Embed Code"
                    name="mapEmbedCode"
                    value={formData.mapEmbedCode}
                    onChange={handleChange}
                    multiline
                    rows={3}
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
            </Paper>
          </Grid>
          
          {/* Features */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tiện ích
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableFeatures.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    color={formData.features.includes(feature) ? 'primary' : 'default'}
                    variant={formData.features.includes(feature) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          
          {/* Images */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Hình ảnh ({images.length})
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? 'Đang upload...' : 'Thêm ảnh'}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={image}
                        alt={`Property ${index + 1}`}
                      />
                      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                          color="error"
                          onClick={() => setDeleteImageDialog(image)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
                
                {images.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      border: '2px dashed #ccc',
                      borderRadius: 2
                    }}>
                      <Typography color="text.secondary">
                        Chưa có hình ảnh nào. Nhấn "Thêm ảnh" để upload.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          {/* Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      {/* Delete Image Dialog */}
      <Dialog open={!!deleteImageDialog} onClose={() => setDeleteImageDialog(null)}>
        <DialogTitle>Xác nhận xóa ảnh</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa ảnh này?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteImageDialog(null)}>Hủy</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => deleteImageDialog && handleDeleteImage(deleteImageDialog)}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditPropertyPage;