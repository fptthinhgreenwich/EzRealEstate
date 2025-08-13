import React, { useState, useEffect } from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Badge,
  InputBase,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Container,
  Chip
} from '@mui/material'
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  Message as MessageIcon,
  Chat as ChatIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { styled } from '@mui/material/styles'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { logout } from '../../store/slices/authSlice'
import api from '../../services/api'

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}))

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  // Fetch unread message count
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount()
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count')
      if (response.data.success) {
        setUnreadMessages(response.data.data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    handleMenuClose()
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchValue.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchValue)}`)
    }
  }

  interface NavItem {
    label: string;
    path: string;
    icon: React.ReactElement;
    authRequired?: boolean;
    sellerOnly?: boolean;
    adminOnly?: boolean;
    badge?: number;
  }

  const navigationItems: NavItem[] = [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon /> },
    { label: 'Mua bán', path: '/properties', icon: <LocationIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, authRequired: true },
    { label: 'Ví của tôi', path: '/wallet', icon: <WalletIcon />, authRequired: true },
    { label: 'Đăng tin', path: '/dashboard/new-property', icon: <AddIcon />, authRequired: true, sellerOnly: true },
    { label: 'Admin', path: '/admin', icon: <AdminIcon />, authRequired: true, adminOnly: true },
  ]

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const renderDesktopNavigation = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Logo */}
      <Typography 
        variant="h6" 
        component={Link}
        to="/"
        sx={{ 
          fontWeight: 'bold',
          cursor: 'pointer',
          color: 'primary.contrastText',
          textDecoration: 'none',
          fontSize: '1.5rem'
        }}
      >
        EZREALESTATE
      </Typography>

      {/* Navigation Links */}
      <Box sx={{ display: 'flex', gap: 1, ml: 4 }}>
        {navigationItems.map((item) => {
          if (item.authRequired && !isAuthenticated) return null
          if (item.adminOnly && user?.role !== 'ADMIN') return null
          if (item.sellerOnly && user?.role === 'BUYER') return null
          
          return (
            <Button
              key={item.path}
              color="inherit"
              component={Link}
              to={item.path}
              sx={{
                color: isActivePath(item.path) ? 'warning.main' : 'inherit',
                fontWeight: isActivePath(item.path) ? 'bold' : 'normal',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1)
                }
              }}
              startIcon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            >
              {item.label}
            </Button>
          )
        })}
      </Box>

      {/* Search Bar */}
      <Search sx={{ ml: 'auto', mr: 2 }}>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <form onSubmit={handleSearch}>
          <StyledInputBase
            placeholder="Tìm kiếm BĐS..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            inputProps={{ 'aria-label': 'search' }}
          />
        </form>
      </Search>

      {/* User Actions */}
      {isAuthenticated ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Chat Messages */}
          <IconButton 
            color="inherit"
            onClick={() => navigate('/chat')}
            sx={{ 
              position: 'relative',
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.1)
              }
            }}
          >
            <Badge badgeContent={unreadMessages} color="error">
              <MessageIcon />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton onClick={handleProfileMenuClick}>
            <Avatar 
              src={user?.avatar}
              sx={{ width: 32, height: 32 }}
            >
              <PersonIcon />
            </Avatar>
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            component={Link}
            to="/login"
            variant="outlined"
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              textTransform: 'none'
            }}
          >
            Đăng nhập
          </Button>
          <Button 
            component={Link}
            to="/register"
            variant="contained"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            Đăng ký
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar sx={{ px: 0 }}>
            {isMobile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {/* Mobile Menu Button */}
                <IconButton
                  color="inherit"
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>

                {/* Logo */}
                <Typography 
                  variant="h6" 
                  component={Link}
                  to="/"
                  sx={{ 
                    fontWeight: 'bold',
                    flexGrow: 1,
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  EZREALESTATE
                </Typography>

                {/* User Actions */}
                {isAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Chat Icon for Mobile */}
                    <IconButton 
                      color="inherit"
                      onClick={() => navigate('/chat')}
                    >
                      <Badge badgeContent={unreadMessages} color="error">
                        <MessageIcon />
                      </Badge>
                    </IconButton>
                    
                    <IconButton onClick={handleProfileMenuClick} color="inherit">
                      <Avatar 
                        src={user?.avatar}
                        sx={{ width: 32, height: 32 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </IconButton>
                  </Box>
                ) : (
                  <Button 
                    color="inherit" 
                    component={Link}
                    to="/login"
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Đăng nhập
                  </Button>
                )}
              </Box>
            ) : (
              renderDesktopNavigation()
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => navigate('/dashboard')}>
          <DashboardIcon sx={{ mr: 2 }} />
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => navigate('/chat')}>
          <MessageIcon sx={{ mr: 2 }} />
          Tin nhắn
          {unreadMessages > 0 && (
            <Chip 
              label={unreadMessages} 
              size="small" 
              color="error" 
              sx={{ ml: 'auto' }}
            />
          )}
        </MenuItem>
        <MenuItem onClick={() => navigate('/profile')}>
          <PersonIcon sx={{ mr: 2 }} />
          Hồ sơ
        </MenuItem>
        <MenuItem onClick={() => navigate('/dashboard')}>
          <AnalyticsIcon sx={{ mr: 2 }} />
          Thống kê
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Đăng xuất
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>
            EZREALESTATE
          </Typography>
          
          <List>
            {navigationItems.map((item) => {
              if (item.authRequired && !isAuthenticated) return null
              if (item.adminOnly && user?.role !== 'ADMIN') return null
              if (item.sellerOnly && user?.role === 'BUYER') return null
              
              return (
                <ListItem 
                  button 
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  sx={{
                    backgroundColor: isActivePath(item.path) ? 'primary.light' : 'transparent',
                    color: isActivePath(item.path) ? 'primary.contrastText' : 'inherit'
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isActivePath(item.path) ? 'primary.contrastText' : 'inherit' 
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              )
            })}
          </List>

          {/* Mobile Search */}
          <Box sx={{ px: 2, mt: 2 }}>
            <form onSubmit={handleSearch}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'grey.100',
                borderRadius: 1,
                px: 2,
                py: 1
              }}>
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <InputBase
                  placeholder="Tìm kiếm BĐS..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
            </form>
          </Box>

          {/* Mobile Auth Buttons */}
          {!isAuthenticated && (
            <Box sx={{ px: 2, mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                fullWidth
                variant="outlined" 
                component={Link}
                to="/login"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{ textTransform: 'none' }}
              >
                Đăng nhập
              </Button>
              <Button 
                fullWidth
                variant="contained" 
                component={Link}
                to="/register"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{ textTransform: 'none' }}
              >
                Đăng ký
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default Header
