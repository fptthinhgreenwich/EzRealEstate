import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface SocketUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface SendMessageData {
  conversationId?: string;
  receiverId: string;
  message: string;
  propertyId?: string;
}

interface MarkAsReadData {
  conversationId: string;
}

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as SocketUser;
    console.log(`User ${user.fullName} (${user.id}) connected`);

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Join existing conversation rooms
    socket.on('join-conversations', async () => {
      try {
        const conversations = await prisma.conversation.findMany({
          where: {
            OR: [
              { buyerId: user.id },
              { sellerId: user.id }
            ]
          }
        });

        conversations.forEach(conv => {
          socket.join(`conversation:${conv.id}`);
        });

        socket.emit('conversations-joined', conversations.map(c => c.id));
      } catch (error) {
        console.error('Error joining conversations:', error);
        socket.emit('error', { message: 'Failed to join conversations' });
      }
    });

    // Handle sending messages
    socket.on('send-message', async (data: SendMessageData) => {
      try {
        let conversation;
        
        // Find or create conversation
        if (data.conversationId) {
          conversation = await prisma.conversation.findUnique({
            where: { id: data.conversationId }
          });
        } else {
          // Check if conversation exists
          const existingConversation = await prisma.conversation.findFirst({
            where: {
              OR: [
                {
                  buyerId: user.id,
                  sellerId: data.receiverId,
                  propertyId: data.propertyId || null
                },
                {
                  buyerId: data.receiverId,
                  sellerId: user.id,
                  propertyId: data.propertyId || null
                }
              ]
            }
          });

          if (existingConversation) {
            conversation = existingConversation;
          } else {
            // Create new conversation with message
            const isBuyer = user.role === 'BUYER';
            conversation = await prisma.conversation.create({
              data: {
                buyerId: isBuyer ? user.id : data.receiverId,
                sellerId: isBuyer ? data.receiverId : user.id,
                propertyId: data.propertyId || null,
                lastMessage: data.message,
                lastMessageAt: new Date(),
                unreadCountBuyer: isBuyer ? 0 : 1,
                unreadCountSeller: isBuyer ? 1 : 0
              }
            });

            // Join the new conversation room
            socket.join(`conversation:${conversation.id}`);
            
            // Notify receiver to join the new conversation
            io.to(`user:${data.receiverId}`).emit('new-conversation', conversation);
          }
        }

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Check if user is part of the conversation
        if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
          throw new Error('Unauthorized');
        }

        // Create the message
        const message = await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            message: data.message,
            isRead: false
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                avatar: true
              }
            }
          }
        });

        // Update conversation
        const isBuyer = conversation.buyerId === user.id;
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: data.message,
            lastMessageAt: new Date(),
            unreadCountBuyer: isBuyer ? conversation.unreadCountBuyer : conversation.unreadCountBuyer + 1,
            unreadCountSeller: isBuyer ? conversation.unreadCountSeller + 1 : conversation.unreadCountSeller
          }
        });

        // Emit message to conversation room
        io.to(`conversation:${conversation.id}`).emit('new-message', {
          conversationId: conversation.id,
          message
        });

        // Send notification to receiver if they're online
        const receiverId = isBuyer ? conversation.sellerId : conversation.buyerId;
        io.to(`user:${receiverId}`).emit('message-notification', {
          conversationId: conversation.id,
          message,
          sender: user
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle marking messages as read
    socket.on('mark-as-read', async (data: MarkAsReadData) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId }
        });

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Check if user is part of the conversation
        if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
          throw new Error('Unauthorized');
        }

        // Mark messages as read
        await prisma.chatMessage.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: { not: user.id },
            isRead: false
          },
          data: {
            isRead: true
          }
        });

        // Reset unread count
        const isBuyer = conversation.buyerId === user.id;
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: {
            unreadCountBuyer: isBuyer ? 0 : conversation.unreadCountBuyer,
            unreadCountSeller: isBuyer ? conversation.unreadCountSeller : 0
          }
        });

        // Notify the conversation room about read status
        socket.to(`conversation:${data.conversationId}`).emit('messages-read', {
          conversationId: data.conversationId,
          readBy: user.id
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
        conversationId: data.conversationId,
        userId: user.id,
        userName: user.fullName
      });
    });

    socket.on('stop-typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {
        conversationId: data.conversationId,
        userId: user.id
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user.fullName} (${user.id}) disconnected`);
      
      // Notify all conversation rooms that user is offline
      io.emit('user-offline', user.id);
    });

    // Notify that user is online
    io.emit('user-online', user.id);
  });

  return io;
};