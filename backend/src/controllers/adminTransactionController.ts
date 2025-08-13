import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const adminTransactionController = {
  // Get all wallet transactions with filters
  async getAllTransactions(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      const { 
        page = 1, 
        limit = 10,
        status,
        type,
        userId,
        startDate,
        endDate,
        search
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build filter conditions
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (userId) {
        where.userId = userId;
      }

      if (search) {
        where.OR = [
          { referenceId: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(String(startDate));
        }
        if (endDate) {
          where.createdAt.lte = new Date(String(endDate));
        }
      }

      // Get transactions with user info
      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true
              }
            }
          }
        }),
        prisma.walletTransaction.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách giao dịch'
      });
    }
  },

  // Get transaction statistics
  async getTransactionStats(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      const [
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        totalDeposit,
        totalWithdraw,
        todayTransactions
      ] = await Promise.all([
        prisma.walletTransaction.count(),
        prisma.walletTransaction.count({ where: { status: 'COMPLETED' } }),
        prisma.walletTransaction.count({ where: { status: 'PENDING' } }),
        prisma.walletTransaction.count({ where: { status: 'FAILED' } }),
        prisma.walletTransaction.aggregate({
          where: { type: 'DEPOSIT', status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.walletTransaction.aggregate({
          where: { type: 'WITHDRAW', status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.walletTransaction.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalTransactions,
          completedTransactions,
          pendingTransactions,
          failedTransactions,
          totalDeposit: totalDeposit._sum.amount || 0,
          totalWithdraw: totalWithdraw._sum.amount || 0,
          todayTransactions
        }
      });
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê giao dịch'
      });
    }
  },

  // Update transaction status (for manual verification)
  async updateTransactionStatus(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      const { transactionId } = req.params;
      const { status, note } = req.body;

      if (!['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      const transaction = await prisma.walletTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch'
        });
      }

      // If changing from PENDING to COMPLETED for DEPOSIT, update user balance
      if (transaction.status === 'PENDING' && 
          status === 'COMPLETED' && 
          transaction.type === 'DEPOSIT') {
        
        await prisma.$transaction(async (tx) => {
          // Update user balance
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              balance: {
                increment: transaction.amount
              }
            }
          });

          // Update transaction
          await tx.walletTransaction.update({
            where: { id: transactionId },
            data: {
              status,
              description: note ? 
                `${transaction.description} - Admin: ${note}` : 
                transaction.description
            }
          });
        });
      } else {
        // Just update transaction status
        await prisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status,
            description: note ? 
              `${transaction.description} - Admin: ${note}` : 
              transaction.description
          }
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật trạng thái giao dịch thành công'
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái giao dịch'
      });
    }
  },

  // Get transaction detail
  async getTransactionDetail(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      const { transactionId } = req.params;

      const transaction = await prisma.walletTransaction.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              balance: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết giao dịch'
      });
    }
  }
};

export default adminTransactionController;