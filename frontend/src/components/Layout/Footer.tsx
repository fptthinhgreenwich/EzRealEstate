import { Box, Container, Typography, Grid, Link } from '@mui/material'

const Footer = () => {
  return (
    <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              EZREALESTATE
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Nền tảng bất động sản hàng đầu Việt Nam, kết nối người mua và người bán một cách hiệu quả.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom>
              Dịch vụ
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/properties" color="inherit" underline="hover">
                Tìm kiếm
              </Link>
              <Link href="/dashboard" color="inherit" underline="hover">
                Đăng tin
              </Link>
              <Link href="/premium" color="inherit" underline="hover">
                Premium
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom>
              Hỗ trợ
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/help" color="inherit" underline="hover">
                Trợ giúp
              </Link>
              <Link href="/contact" color="inherit" underline="hover">
                Liên hệ
              </Link>
              <Link href="/terms" color="inherit" underline="hover">
                Điều khoản
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Liên hệ
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Email: support@ezrealestate.com
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Hotline: 1900 1234
            </Typography>
            <Typography variant="body2">
              Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ borderTop: '1px solid', borderColor: 'grey.700', pt: 3, mt: 4 }}>
          <Typography variant="body2" textAlign="center">
            © 2024 EZREALESTATE. Tất cả quyền được bảo lưu.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
