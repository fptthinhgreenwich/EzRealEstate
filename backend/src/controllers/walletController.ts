import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const walletController = {
  // Get wallet balance
  async getBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      
      res.json({
        success: true,
        data: {
          balance: user ? Number(user.balance) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy số dư ví'
      });
    }
  },
  
  // Get transaction history
  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, type } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { userId };
      if (type) {
        where.type = type;
      }
      
      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.walletTransaction.count({ where })
      ]);
      
      res.json({
        success: true,
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử giao dịch'
      });
    }
  },
  
  // Deposit money
  async deposit(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { amount, paymentMethod, transactionId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền không hợp lệ'
        });
      }
      
      // Create transaction record
      await prisma.$transaction(async (tx) => {
        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: amount
            }
          }
        });
        
        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            userId,
            amount,
            type: 'DEPOSIT',
            description: `Nạp tiền vào ví qua ${paymentMethod}`,
            referenceId: transactionId,
            status: 'COMPLETED'
          }
        });
      });
      
      res.json({
        success: true,
        message: 'Nạp tiền thành công'
      });
    } catch (error) {
      console.error('Error depositing money:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nạp tiền'
      });
    }
  },
  
  // Withdraw money
  async withdraw(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { amount, bankAccount, bankName } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền không hợp lệ'
        });
      }
      
      // Check balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      
      const userBalance = user ? Number(user.balance) : 0;
      
      if (!user || userBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Số dư không đủ'
        });
      }
      
      // Create withdrawal request
      await prisma.$transaction(async (tx) => {
        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: amount
            }
          }
        });
        
        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: -amount,
            type: 'WITHDRAW',
            description: `Rút tiền về ${bankName} - ${bankAccount}`,
            status: 'PENDING'
          }
        });
      });
      
      res.json({
        success: true,
        message: 'Yêu cầu rút tiền đã được gửi'
      });
    } catch (error) {
      console.error('Error withdrawing money:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi rút tiền'
      });
    }
  }
};

// Helper function to add commission for seller
export async function addSellerCommission(
  sellerId: string,
  amount: number,
  propertyId: string,
  description: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Update seller balance
      await tx.user.update({
        where: { id: sellerId },
        data: {
          balance: {
            increment: amount
          }
        }
      });
      
      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId: sellerId,
          amount,
          type: 'COMMISSION',
          description,
          propertyId,
          status: 'COMPLETED'
        }
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error adding seller commission:', error);
    return false;
  }
}