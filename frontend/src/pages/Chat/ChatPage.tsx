import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import io, { Socket } from 'socket.io-client';
import { useAppSelector } from '../../store/store';
import api from '../../services/api';
import config from '../../config';

interface User {
  id: string;
  fullName: string;
  avatar?: string;
  email: string;
  phone?: string;
}

interface Property {
  id: string;
  title: string;
  images: string;
  price: number;
  address: string;
  type: string;
  area: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  otherUser: User;
  property?: Property;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

const ChatPage = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAppSelector((state) => state.auth);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get receiver and property from search params (for starting new conversation)
  const receiverId = searchParams.get('sellerId');
  const propertyId = searchParams.get('propertyId');
  
  // Check authentication and redirect if needed
  useEffect(() => {
    // Wait for auth loading to complete before checking
    if (authLoading || (localStorage.getItem('token') && !user)) {
      return;
    }
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, authLoading, navigate]);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    // Don't initialize socket if still loading auth or no user
    if (authLoading || !user || !token) {
      return;
    }
    
    const socketConnection = io(config.SOCKET_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketConnection.on('connect', () => {
      console.log('Connected to chat server');
      socketConnection.emit('join-conversations');
      // Reload conversations on reconnect
      if (socket) {
        loadConversations();
        if (conversationId) {
          loadMessages(conversationId);
        }
      }
    });
    
    socketConnection.on('new-message', (data: { conversationId: string; message: Message }) => {
      // Only add message if it's for the current conversation
      if (window.location.pathname.includes(data.conversationId)) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          // Remove optimistic message if real message received
          const filtered = prev.filter(m => !m.id.startsWith('temp-'));
          return [...filtered, data.message];
        });
        
        // Mark as read since we're viewing this conversation
        socketConnection.emit('mark-as-read', { conversationId: data.conversationId });
      }
      
      // Always update conversation list
      setConversations(prev => prev.map(conv => {
        if (conv.id === data.conversationId) {
          const isViewing = window.location.pathname.includes(data.conversationId);
          return {
            ...conv,
            lastMessage: data.message.message,
            lastMessageAt: data.message.createdAt,
            unreadCount: !isViewing && data.message.senderId !== user?.id 
              ? conv.unreadCount + 1 
              : 0
          };
        }
        return conv;
      }));
    });
    
    socketConnection.on('new-conversation', () => {
      loadConversations();
    });
    
    socketConnection.on('error', (error: any) => {
      console.error('Socket error:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    });
    
    setSocket(socketConnection);
    
    return () => {
      socketConnection.disconnect();
    };
  }, [user, token, authLoading, conversationId]);
  
  // Load conversations and handle navigation
  useEffect(() => {
    if (authLoading || !user || !token) return;
    
    loadConversations();
    
    // If starting new conversation
    if (receiverId && !conversationId) {
      startNewConversation();
    } else if (conversationId) {
      loadConversation(conversationId);
      loadMessages(conversationId);
    }
  }, [conversationId, receiverId, propertyId, user, token, authLoading]);
  
  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Không thể tải danh sách tin nhắn');
    }
  };
  
  const loadConversation = async (convId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${convId}`);
      if (response.data.success) {
        const conv = response.data.data;
        setActiveConversation(conv);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Không thể tải cuộc trò chuyện');
    }
  };
  
  const loadMessages = async (convId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/conversations/${convId}/messages`);
      if (response.data.success) {
        setMessages(response.data.data);
        // Mark as read
        if (socket) {
          socket.emit('mark-as-read', { conversationId: convId });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };
  
  const startNewConversation = async () => {
    if (!receiverId) return;
    
    try {
      console.log('Starting new conversation with:', { receiverId, propertyId });
      const response = await api.post('/chat/conversations/start', {
        receiverId,
        propertyId,
        initialMessage: null
      });
      
      console.log('Start conversation response:', response.data);
      
      if (response.data.success && response.data.data) {
        const conversation = response.data.data;
        if (conversation.id) {
          console.log('Created conversation:', conversation.id);
          // Set the active conversation immediately
          setActiveConversation(conversation);
          // Navigate to the new conversation
          navigate(`/chat/${conversation.id}`);
          // Note: Conversation won't appear in list until first message is sent
        } else {
          console.error('No conversation ID in response');
          setError('Không nhận được ID cuộc trò chuyện');
        }
      } else {
        console.error('Invalid response structure:', response.data);
        setError('Phản hồi không hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      console.error('Error response:', error.response?.data);
      
      // More specific error messages
      if (error.response?.status === 404) {
        setError('Không tìm thấy người dùng');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Thông tin không hợp lệ');
      } else if (error.response?.status === 500) {
        setError('Lỗi server. Vui lòng thử lại sau');
      } else {
        setError('Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại');
      }
    }
  };
  
  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !activeConversation) return;
    
    setSending(true);
    
    // Check if this is the first message (conversation not in list yet)
    const isFirstMessage = messages.length === 0;
    
    socket.emit('send-message', {
      conversationId: activeConversation.id,
      receiverId: activeConversation.otherUser?.id,
      message: newMessage,
      propertyId: activeConversation.property?.id
    }, (response: any) => {
      if (response?.error) {
        setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
        setSending(false);
      }
    });
    
    // Add message optimistically
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: user!.id,
      message: newMessage,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user!.id,
        fullName: user!.fullName,
        avatar: user!.avatar
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(false);
    
    // If this was the first message, reload conversations to show it in the list
    if (isFirstMessage) {
      setTimeout(() => {
        loadConversations();
      }, 500);
    }
  };
  
  const updateConversationLastMessage = (convId: string, message: Message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === convId) {
        return {
          ...conv,
          lastMessage: message.message,
          lastMessageAt: message.createdAt,
          unreadCount: message.senderId !== user?.id ? conv.unreadCount + 1 : conv.unreadCount
        };
      }
      return conv;
    }));
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Show loading spinner while auth is loading
  if (authLoading || (localStorage.getItem('token') && !user)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Vui lòng đăng nhập để sử dụng chat</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, pb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ height: 'calc(100vh - 240px)', minHeight: '500px', overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Conversations List */}
          <Grid item xs={12} md={4} sx={{ borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Tin nhắn
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              
              {/* Conversation List */}
              <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <ListItem
                      key={conv.id}
                      button
                      selected={conv.id === conversationId}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={conv.unreadCount} color="error">
                          <Avatar src={conv.otherUser?.avatar}>
                            {conv.otherUser?.fullName?.[0] || '?'}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%' }}>
                              {conv.property 
                                ? `${conv.otherUser?.fullName} - ${conv.property.title}`
                                : conv.otherUser?.fullName
                              }
                            </Typography>
                            {conv.lastMessageAt && (
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(conv.lastMessageAt)}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          conv.lastMessage ? (
                            <Typography variant="body2" noWrap color="text.secondary">
                              {conv.lastMessage}
                            </Typography>
                          ) : null
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <MessageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      {searchTerm ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn nào'}
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Grid>
          
          {/* Chat Area */}
          <Grid item xs={12} md={8} sx={{ height: '100%', overflow: 'hidden' }}>
            {activeConversation ? (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Chat Header */}
                <AppBar position="static" color="default" elevation={0} sx={{ flexShrink: 0 }}>
                  <Toolbar>
                    <IconButton edge="start" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
                      <ArrowBackIcon />
                    </IconButton>
                    <Avatar src={activeConversation.otherUser?.avatar} sx={{ mr: 2 }}>
                      {activeConversation.otherUser?.fullName?.[0] || '?'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {activeConversation.property 
                          ? `${activeConversation.otherUser?.fullName} - ${activeConversation.property.title}`
                          : activeConversation.otherUser?.fullName
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activeConversation.otherUser?.email}
                      </Typography>
                    </Box>
                    {activeConversation.otherUser?.phone && (
                      <IconButton>
                        <PhoneIcon />
                      </IconButton>
                    )}
                    <IconButton>
                      <InfoIcon />
                    </IconButton>
                  </Toolbar>
                </AppBar>
                
                {/* Property Info */}
                {activeConversation.property && (
                  <Card sx={{ m: 2, mb: 0, flexShrink: 0 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {(() => {
                          try {
                            const images = JSON.parse(activeConversation.property.images);
                            return (
                              <Box
                                component="img"
                                src={images[0]}
                                sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                                onError={(e: any) => {
                                  e.target.src = config.PLACEHOLDER_IMAGE;
                                }}
                              />
                            );
                          } catch {
                            return (
                              <Box
                                sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  borderRadius: 1, 
                                  mr: 2, 
                                  bgcolor: 'grey.300',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <HomeIcon />
                              </Box>
                            );
                          }
                        })()}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {activeConversation.property.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(activeConversation.property.price)} • {activeConversation.property.area}m²
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/property/${activeConversation.property!.id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                {/* Messages Area */}
                <Box sx={{ 
                  flex: 1, 
                  p: 2,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }
                  }
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : messages.length > 0 ? (
                    <>
                      {messages.map((message, index) => {
                        const isOwn = message.senderId === user?.id;
                        const showAvatar = !isOwn && (
                          index === 0 || messages[index - 1]?.senderId !== message.senderId
                        );
                        
                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              mb: 1
                            }}
                          >
                            {!isOwn && (
                              <Box sx={{ width: 40, mr: 1 }}>
                                {showAvatar && (
                                  <Avatar
                                    src={message.sender.avatar}
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    {message.sender.fullName[0]}
                                  </Avatar>
                                )}
                              </Box>
                            )}
                            
                            <Paper
                              sx={{
                                maxWidth: '70%',
                                bgcolor: isOwn ? 'primary.main' : 'grey.100',
                                color: isOwn ? 'white' : 'text.primary',
                                px: 2,
                                py: 1
                              }}
                            >
                              <Typography variant="body1">
                                {message.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  opacity: 0.7,
                                  color: isOwn ? 'inherit' : 'text.secondary'
                                }}
                              >
                                {formatTime(message.createdAt)}
                                {isOwn && message.isRead && ' • Đã xem'}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography color="text.secondary">
                        Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Message Input */}
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  flexShrink: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      sx={{ mr: 1 }}
                    />
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 3
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <MessageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Chọn một cuộc trò chuyện
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chọn từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mt: 2 }}
                  >
                    Quay lại Dashboard
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ChatPage;