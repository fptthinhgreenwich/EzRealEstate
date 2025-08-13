import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        // Only show conversations that have messages
        lastMessage: {
          not: null
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            message: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });
    
    // Format conversations
    const formattedConversations = conversations.map(conv => {
      const isCurrentUserBuyer = conv.buyerId === userId;
      const otherUser = isCurrentUserBuyer ? conv.seller : conv.buyer;
      const unreadCount = isCurrentUserBuyer ? conv.unreadCountBuyer : conv.unreadCountSeller;
      
      return {
        id: conv.id,
        otherUser,
        property: conv.property,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        createdAt: conv.createdAt
      };
    });
    
    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách cuộc trò chuyện'
    });
  }
});

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a specific conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Check if user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }
    
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem cuộc trò chuyện này'
      });
    }
    
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    res.json({
      success: true,
      data: messages.reverse() // Reverse to get chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải tin nhắn'
    });
  }
});

/**
 * @swagger
 * /api/chat/conversations/start:
 *   post:
 *     summary: Start a new conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               initialMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation created or existing conversation returned
 */
router.post('/conversations/start', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { receiverId, propertyId, initialMessage } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'ID người nhận là bắt buộc'
      });
    }
    
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Người nhận không tồn tại'
      });
    }
    
    // Determine buyer and seller based on roles
    let buyerId, sellerId;
    
    // If a property is involved, the property owner is always the seller
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { sellerId: true }
      });
      
      if (property) {
        sellerId = property.sellerId;
        buyerId = (sellerId === userId) ? receiverId : userId;
      } else {
        // Fallback to role-based determination
        if (userRole === 'BUYER') {
          buyerId = userId;
          sellerId = receiverId;
        } else if (receiver.role === 'BUYER') {
          buyerId = receiverId;
          sellerId = userId;
        } else {
          // Both are sellers or admins, use sender as buyer for simplicity
          buyerId = userId;
          sellerId = receiverId;
        }
      }
    } else {
      // No property, determine by roles
      if (userRole === 'BUYER') {
        buyerId = userId;
        sellerId = receiverId;
      } else if (receiver.role === 'BUYER') {
        buyerId = receiverId;
        sellerId = userId;
      } else {
        // Both are sellers or admins, use sender as buyer for simplicity
        buyerId = userId;
        sellerId = receiverId;
      }
    }
    
    // Check if conversation already exists
    // We only care about buyer-seller pair, not property
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId,
        sellerId
      },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true
          }
        }
      }
    });
    
    // If conversation exists but doesn't have a property, and we're starting from a property page, update it
    if (conversation && !conversation.propertyId && propertyId) {
      console.log('Updating existing conversation with propertyId:', propertyId);
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { 
          propertyId
        },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
              area: true,
              address: true,
              type: true
            }
          }
        }
      });
    }
    
    if (!conversation) {
      // Create new conversation
      console.log('Creating new conversation:', { buyerId, sellerId, propertyId });
      
      try {
        conversation = await prisma.conversation.create({
          data: {
            buyerId,
            sellerId,
            propertyId: propertyId || null,
            lastMessage: initialMessage || null,
            lastMessageAt: initialMessage ? new Date() : null
          },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
              area: true,
              address: true,
              type: true
            }
          }
        }
        });
      } catch (createError: any) {
        console.error('Error creating conversation:', createError);
        
        // If unique constraint error, try to find existing conversation
        if (createError.code === 'P2002') {
          console.log('Unique constraint error, finding existing conversation');
          conversation = await prisma.conversation.findFirst({
            where: {
              buyerId,
              sellerId
            },
            include: {
              buyer: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                  email: true
                }
              },
              seller: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                  email: true
                }
              },
              property: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                  price: true
                }
              }
            }
          });
          
          if (!conversation) {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
      
      // Create initial message if provided
      if (initialMessage) {
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            message: initialMessage,
            isRead: false
          }
        });
        
        // Update unread count
        if (userRole === 'BUYER') {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { unreadCountSeller: 1 }
          });
        } else {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { unreadCountBuyer: 1 }
          });
        }
      }
    }
    
    // Format the response similar to GET /conversations/:id
    const isCurrentUserBuyer = conversation.buyerId === userId;
    const otherUser = isCurrentUserBuyer ? conversation.seller : conversation.buyer;
    
    res.json({
      success: true,
      data: {
        id: conversation.id,
        otherUser,
        property: conversation.property,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: 0,
        createdAt: conversation.createdAt,
        isBuyer: isCurrentUserBuyer
      }
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bắt đầu cuộc trò chuyện'
    });
  }
});

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get a specific conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation details
 */
router.get('/conversations/:conversationId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { conversationId } = req.params;
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true,
            phone: true
          }
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            address: true,
            type: true,
            area: true
          }
        }
      }
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }
    
    // Check if user is part of the conversation
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem cuộc trò chuyện này'
      });
    }
    
    // Format response
    const isCurrentUserBuyer = conversation.buyerId === userId;
    const otherUser = isCurrentUserBuyer ? conversation.seller : conversation.buyer;
    const unreadCount = isCurrentUserBuyer ? conversation.unreadCountBuyer : conversation.unreadCountSeller;
    
    res.json({
      success: true,
      data: {
        id: conversation.id,
        otherUser,
        property: conversation.property,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
        createdAt: conversation.createdAt,
        isBuyer: isCurrentUserBuyer
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải cuộc trò chuyện'
    });
  }
});

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get total unread message count for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      select: {
        buyerId: true,
        unreadCountBuyer: true,
        unreadCountSeller: true
      }
    });
    
    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.buyerId === userId) {
        totalUnread += conv.unreadCountBuyer;
      } else {
        totalUnread += conv.unreadCountSeller;
      }
    });
    
    res.json({
      success: true,
      data: {
        unreadCount: totalUnread
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải số tin nhắn chưa đọc'
    });
  }
});

export default router;