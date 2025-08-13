import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createVnpayUrl, verifyVnpayReturn, getClientIp, VnpayPaymentParams } from '../config/vnpay';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const vnpayController = {
  async createTopupPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { 
        amount, 
        bankCode, 
        language,
        orderType 
      } = req.body;

      if (!amount || amount < 10000) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền nạp tối thiểu là 10,000 VNĐ'
        });
      }

      if (amount > 100000000) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền nạp tối đa là 100,000,000 VNĐ'
        });
      }

      const orderId = `TOPUP${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Get user information for billing
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const pendingTransaction = await prisma.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          description: `Nạp tiền vào ví qua VNPay - Đang xử lý`,
          referenceId: orderId,
          status: 'PENDING'
        }
      });

      const orderInfo = `Nap tien vao vi - Ma giao dich: ${orderId}`;
      const ipAddr = getClientIp(req);
      
      // Parse full name into first and last name if available
      let billFirstName = '';
      let billLastName = '';
      if (user?.fullName) {
        const nameParts = user.fullName.trim().split(' ');
        if (nameParts.length > 0) {
          billFirstName = nameParts[0];
          billLastName = nameParts.slice(1).join(' ');
        }
      }

      const vnpayParams: VnpayPaymentParams = {
        orderId,
        amount,
        orderInfo,
        orderType: orderType || 'topup',
        ipAddr,
        bankCode: bankCode || undefined,
        language: language || 'vn',
        billMobile: user?.phone || undefined,
        billEmail: user?.email || undefined,
        billFirstName: billFirstName || undefined,
        billLastName: billLastName || undefined,
        billCountry: 'VN'
      };
      
      const paymentUrl = createVnpayUrl(vnpayParams);

      res.json({
        success: true,
        data: {
          paymentUrl,
          orderId,
          amount
        }
      });
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thanh toán'
      });
    }
  },

  async vnpayReturn(req: Request, res: Response) {
    try {
      console.log('VNPAY Return received:', req.query);
      
      const vnp_Params = req.query;
      const isValid = verifyVnpayReturn(vnp_Params);

      console.log('Signature validation:', isValid);

      if (!isValid) {
        console.error('Invalid VNPAY signature');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=invalid`);
      }

      const orderId = vnp_Params.vnp_TxnRef as string;
      const responseCode = vnp_Params.vnp_ResponseCode as string;
      const transactionNo = vnp_Params.vnp_TransactionNo as string;
      const bankCode = vnp_Params.vnp_BankCode as string;
      const amount = Number(vnp_Params.vnp_Amount) / 100;

      console.log(`Processing payment: Order ${orderId}, Response Code: ${responseCode}, Amount: ${amount}`);

      const transaction = await prisma.walletTransaction.findFirst({
        where: { referenceId: orderId }
      });

      if (!transaction) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=notfound`);
      }

      if (transaction.status !== 'PENDING') {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=processed`);
      }

      if (responseCode === '00') {
        // Transaction successful
        await prisma.$transaction(async (tx) => {
          // Update user balance
          const updatedUser = await tx.user.update({
            where: { id: transaction.userId },
            data: {
              balance: {
                increment: amount
              }
            }
          });

          console.log(`Updated balance for user ${transaction.userId}: +${amount} VND`);

          // Update transaction status
          await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              description: `Nạp tiền thành công qua VNPay - Ngân hàng: ${bankCode} - Mã GD: ${transactionNo}`
            }
          });
        });

        console.log(`Payment successful! Redirecting to wallet...`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=success&amount=${amount}&orderId=${orderId}`);
      } else {
        await prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            description: `Nạp tiền thất bại - Mã lỗi: ${responseCode}`
          }
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=failed`);
      }
    } catch (error) {
      console.error('Error processing VNPay return:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?status=error`);
    }
  },

  async vnpayIpn(req: Request, res: Response) {
    try {
      const vnp_Params = req.query;
      const isValid = verifyVnpayReturn(vnp_Params);

      if (!isValid) {
        return res.json({ RspCode: '97', Message: 'Invalid signature' });
      }

      const orderId = vnp_Params.vnp_TxnRef as string;
      const responseCode = vnp_Params.vnp_ResponseCode as string;
      const transactionNo = vnp_Params.vnp_TransactionNo as string;
      const amount = Number(vnp_Params.vnp_Amount) / 100;

      const transaction = await prisma.walletTransaction.findFirst({
        where: { referenceId: orderId }
      });

      if (!transaction) {
        return res.json({ RspCode: '01', Message: 'Order not found' });
      }

      if (transaction.status !== 'PENDING') {
        return res.json({ RspCode: '02', Message: 'Order already processed' });
      }

      if (Number(transaction.amount) !== amount) {
        return res.json({ RspCode: '04', Message: 'Invalid amount' });
      }

      if (responseCode === '00') {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              balance: {
                increment: amount
              }
            }
          });

          await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              description: `Nạp tiền thành công qua VNPay - Mã GD: ${transactionNo}`
            }
          });
        });

        return res.json({ RspCode: '00', Message: 'Success' });
      } else {
        await prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            description: `Nạp tiền thất bại - Mã lỗi: ${responseCode}`
          }
        });

        return res.json({ RspCode: '00', Message: 'Success' });
      }
    } catch (error) {
      console.error('Error processing VNPay IPN:', error);
      return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  },

  async checkTransactionStatus(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          referenceId: orderId,
          userId
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
        data: {
          orderId,
          amount: Number(transaction.amount),
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      console.error('Error checking transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái giao dịch'
      });
    }
  }
};