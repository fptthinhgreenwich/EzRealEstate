import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from './notificationController';

const prisma = new PrismaClient();

// Premium pricing (VND)
const PREMIUM_PRICE = {
  '7_DAYS': 50000,
  '30_DAYS': 150000,
  '90_DAYS': 400000
};

export const premiumController = {
  // Get premium pricing
  async getPricing(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          packages: [
            {
              duration: '7_DAYS',
              days: 7,
              price: PREMIUM_PRICE['7_DAYS'],
              name: 'Gói 7 ngày',
              features: [
                'Hiển thị ưu tiên trên trang chủ',
                'Huy hiệu Premium',
                'Thống kê chi tiết',
                'Hỗ trợ ưu tiên'
              ]
            },
            {
              duration: '30_DAYS',
              days: 30,
              price: PREMIUM_PRICE['30_DAYS'],
              name: 'Gói 30 ngày',
              popular: true,
              features: [
                'Hiển thị ưu tiên trên trang chủ',
                'Huy hiệu Premium',
                'Thống kê chi tiết',
                'Hỗ trợ ưu tiên',
                'Tiết kiệm 20%'
              ]
            },
            {
              duration: '90_DAYS',
              days: 90,
              price: PREMIUM_PRICE['90_DAYS'],
              name: 'Gói 90 ngày',
              features: [
                'Hiển thị ưu tiên trên trang chủ',
                'Huy hiệu Premium',
                'Thống kê chi tiết',
                'Hỗ trợ ưu tiên',
                'Tiết kiệm 30%'
              ]
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching premium pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin gói premium'
      });
    }
  },
  
  // Upgrade property to premium
  async upgradeToPremium(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { propertyId, duration } = req.body;
      
      // Validate duration
      if (!PREMIUM_PRICE[duration]) {
        return res.status(400).json({
          success: false,
          message: 'Gói premium không hợp lệ'
        });
      }
      
      // Check property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          sellerId: userId
        }
      });
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy BĐS hoặc bạn không có quyền'
        });
      }
      
      // Check if property is approved
      if (property.status !== 'AVAILABLE' && property.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'BĐS phải được duyệt trước khi nâng cấp premium'
        });
      }
      
      // Check user balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      
      const price = PREMIUM_PRICE[duration];
      const userBalance = user ? Number(user.balance) : 0;
      
      if (!user || userBalance < price) {
        return res.status(400).json({
          success: false,
          message: 'Số dư không đủ. Vui lòng nạp thêm tiền vào ví'
        });
      }
      
      // Process upgrade
      await prisma.$transaction(async (tx) => {
        // Calculate premium end date
        const daysToAdd = duration === '7_DAYS' ? 7 : duration === '30_DAYS' ? 30 : 90;
        const now = new Date();
        const premiumUntil = new Date(now);
        
        // If property already has premium, extend from current end date
        if (property.premiumStatus !== 'NONE' && property.premiumUntil && property.premiumUntil > now) {
          premiumUntil.setTime(property.premiumUntil.getTime());
        }
        
        premiumUntil.setDate(premiumUntil.getDate() + daysToAdd);
        
        // Update property
        await tx.property.update({
          where: { id: propertyId },
          data: {
            premiumStatus: 'PREMIUM',
            premiumUntil
          }
        });
        
        // Deduct from user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: price
            }
          }
        });
        
        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: -price,
            type: 'PREMIUM_UPGRADE',
            description: `Nâng cấp Premium cho BĐS: ${property.title} (${daysToAdd} ngày)`,
            propertyId,
            status: 'COMPLETED'
          }
        });
        
        // Create payment record with unique transaction ID
        await tx.payment.create({
          data: {
            userId,
            propertyId,
            amount: price,
            status: 'COMPLETED',
            paymentMethod: 'WALLET',
            transactionId: `PREMIUM_${propertyId}_${Date.now()}`,
            premiumDuration: daysToAdd,
            premiumStartDate: now,
            premiumEndDate: premiumUntil
          }
        });
      });
      
      // Send notification
      await createNotification(
        userId,
        'PREMIUM_UPGRADE',
        'Nâng cấp Premium thành công',
        `BĐS "${property.title}" đã được nâng cấp lên Premium`,
        propertyId,
        { duration, price }
      );
      
      res.json({
        success: true,
        message: 'Nâng cấp Premium thành công'
      });
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nâng cấp premium'
      });
    }
  },
  
  // Check and expire premium properties
  async checkExpiredPremium() {
    try {
      const now = new Date();
      
      // Find expired premium properties
      const expiredProperties = await prisma.property.findMany({
        where: {
          premiumStatus: 'PREMIUM',
          premiumUntil: {
            lt: now
          }
        },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });
      
      // Update expired properties
      for (const property of expiredProperties) {
        await prisma.property.update({
          where: { id: property.id },
          data: {
            premiumStatus: 'NONE'
          }
        });
        
        // Send notification to seller
        await createNotification(
          property.sellerId,
          'PREMIUM_EXPIRED',
          'Premium đã hết hạn',
          `Gói Premium cho BĐS "${property.title}" đã hết hạn. Nâng cấp lại để tiếp tục nhận ưu đãi.`,
          property.id
        );
      }
      
      console.log(`Expired ${expiredProperties.length} premium properties`);
    } catch (error) {
      console.error('Error checking expired premium:', error);
    }
  }
};