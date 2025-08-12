import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const notificationController = {
  // Get all notifications for user
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { userId };
      if (unreadOnly === 'true') {
        where.isRead = false;
      }
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.notification.count({ where })
      ]);
      
      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thông báo'
      });
    }
  },
  
  // Mark notification as read
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const notification = await prisma.notification.findFirst({
        where: { id, userId }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }
      
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      
      res.json({
        success: true,
        message: 'Đã đánh dấu đã đọc'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo'
      });
    }
  },
  
  // Mark all notifications as read
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
      
      res.json({
        success: true,
        message: 'Đã đánh dấu tất cả đã đọc'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo'
      });
    }
  },
  
  // Get unread count
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const count = await prisma.notification.count({
        where: { userId, isRead: false }
      });
      
      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy số lượng thông báo chưa đọc'
      });
    }
  },
  
  // Delete notification
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const notification = await prisma.notification.findFirst({
        where: { id, userId }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }
      
      await prisma.notification.delete({
        where: { id }
      });
      
      res.json({
        success: true,
        message: 'Đã xóa thông báo'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa thông báo'
      });
    }
  }
};

// Helper function to create notification
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  propertyId?: string,
  metadata?: any
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        propertyId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}