import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { createNotification } from '../controllers/notificationController';
import adminTransactionController from '../controllers/adminTransactionController';
import { sendPropertyApprovalEmail } from '../config/email';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProperties,
      pendingProperties,
      totalInquiries,
      recentPayments,
      usersByRole,
      propertiesByType,
      monthlyRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.inquiry.count(),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.property.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        pendingProperties,
        totalInquiries,
        recentPayments,
        usersByRole,
        propertiesByType,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê dashboard'
    });
  }
});

// Get user statistics
router.get('/users/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      sellers,
      buyers,
      totalBalance
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.aggregate({
        _sum: { balance: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        sellers,
        buyers,
        totalBalance: totalBalance._sum.balance || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng'
    });
  }
});

// User Management Routes
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: String(search) } },
        { fullName: { contains: String(search) } },
        { phone: { contains: String(search) } }
      ];
    }
    if (role) {
      where.role = String(role);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isVerified: true,
          balance: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              inquiries: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
});

// Update user status (ban/unban)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified }
    });

    res.json({
      success: true,
      message: `Đã ${isVerified ? 'kích hoạt' : 'khóa'} tài khoản thành công`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái người dùng'
    });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({
      success: true,
      message: 'Đã cập nhật role thành công',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật role người dùng'
    });
  }
});

// Get all properties (for admin management)
router.get('/properties/all', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = String(status);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { address: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          province: true,
          district: true,
          ward: true
        }
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bất động sản'
    });
  }
});

// Property Moderation Routes
router.get('/properties/pending', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { status: 'PENDING' },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          province: true,
          district: true,
          ward: true
        }
      }),
      prisma.property.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get pending properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bất động sản chờ duyệt'
    });
  }
});

// Approve property
router.patch('/properties/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: { 
        status: 'AVAILABLE',
        approvedAt: new Date(),
        approvedBy: req.user?.id
      },
      include: {
        seller: true
      }
    });

    // Send notification to seller
    await createNotification(
      property.sellerId,
      'PROPERTY_APPROVED',
      'Bất động sản đã được duyệt',
      `BĐS "${property.title}" của bạn đã được duyệt và đang hiển thị trên hệ thống.`,
      property.id,
      { propertyTitle: property.title }
    );

    // Send email notification
    try {
      await sendPropertyApprovalEmail(
        property.seller.email,
        property.seller.fullName,
        property.title,
        property.id,
        'APPROVED'
      );
      console.log('Approval email sent to:', property.seller.email);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Đã duyệt bất động sản thành công',
      data: property
    });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi duyệt bất động sản'
    });
  }
});

// Reject property
router.patch('/properties/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const property = await prisma.property.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: req.user?.id,
        rejectionReason: reason
      },
      include: {
        seller: true
      }
    });

    // Send notification to seller
    await createNotification(
      property.sellerId,
      'PROPERTY_REJECTED',
      'Bất động sản bị từ chối',
      `BĐS "${property.title}" của bạn đã bị từ chối. Lý do: ${reason}`,
      property.id,
      { 
        propertyTitle: property.title,
        rejectionReason: reason
      }
    );

    // Send email notification
    try {
      await sendPropertyApprovalEmail(
        property.seller.email,
        property.seller.fullName,
        property.title,
        property.id,
        'REJECTED',
        reason
      );
      console.log('Rejection email sent to:', property.seller.email);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Đã từ chối bất động sản',
      data: property
    });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối bất động sản'
    });
  }
});

// System Analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {
      createdAt: {
        gte: startDate ? new Date(String(startDate)) : new Date(new Date().setDate(new Date().getDate() - 30)),
        lte: endDate ? new Date(String(endDate)) : new Date()
      }
    };

    const [
      userGrowth,
      propertyGrowth,
      revenueGrowth,
      topSellers,
      popularLocations
    ] = await Promise.all([
      // User growth over time
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: true,
        where: dateFilter,
        orderBy: { createdAt: 'asc' }
      }),
      // Property listings over time
      prisma.property.groupBy({
        by: ['createdAt'],
        _count: true,
        where: dateFilter,
        orderBy: { createdAt: 'asc' }
      }),
      // Revenue over time
      prisma.payment.groupBy({
        by: ['createdAt'],
        _sum: { amount: true },
        where: { ...dateFilter, status: 'COMPLETED' },
        orderBy: { createdAt: 'asc' }
      }),
      // Top sellers
      prisma.user.findMany({
        where: { role: 'SELLER' },
        orderBy: { totalSales: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          email: true,
          totalSales: true,
          _count: {
            select: { properties: true }
          }
        }
      }),
      // Popular locations
      prisma.property.groupBy({
        by: ['provinceId'],
        _count: true,
        orderBy: { _count: { provinceId: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        propertyGrowth,
        revenueGrowth,
        topSellers,
        popularLocations
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu phân tích'
    });
  }
});

// Add money to user balance
router.post('/add-balance', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin không hợp lệ'
      });
    }

    // Update user balance
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: 'ADMIN_ADD',
        description: description || `Admin cộng tiền: ${amount} VNĐ`,
        status: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      message: 'Đã cộng tiền thành công',
      data: user
    });
  } catch (error) {
    console.error('Add balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cộng tiền'
    });
  }
});

// Deduct money from user balance
router.post('/deduct-balance', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin không hợp lệ'
      });
    }

    // Check current balance
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (currentUser.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Số dư không đủ. Số dư hiện tại: ${currentUser.balance} VNĐ`
      });
    }

    // Update user balance
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        userId,
        amount: -amount, // Negative amount for deduction
        type: 'ADMIN_DEDUCT',
        description: description || `Admin trừ tiền: ${amount} VNĐ`,
        status: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      message: 'Đã trừ tiền thành công',
      data: user
    });
  } catch (error) {
    console.error('Deduct balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi trừ tiền'
    });
  }
});

// Admin upgrade property to premium
router.post('/upgrade-premium', async (req, res) => {
  try {
    const { propertyId, duration } = req.body;
    
    const daysToAdd = duration === '7_DAYS' ? 7 : duration === '30_DAYS' ? 30 : 90;
    const now = new Date();
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + daysToAdd);

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        premiumStatus: 'PREMIUM',
        premiumUntil
      },
      include: {
        seller: true
      }
    });

    // Create notification
    await createNotification(
      property.sellerId,
      'PREMIUM_UPGRADE',
      'Admin nâng cấp Premium',
      `Admin đã nâng cấp BĐS "${property.title}" lên Premium (${daysToAdd} ngày)`,
      property.id,
      { duration, adminUpgrade: true }
    );

    res.json({
      success: true,
      message: 'Đã nâng cấp Premium thành công',
      data: property
    });
  } catch (error) {
    console.error('Upgrade premium error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nâng cấp Premium'
    });
  }
});

// Transaction Management Routes
router.get('/transactions', adminTransactionController.getAllTransactions);
router.get('/transactions/stats', adminTransactionController.getTransactionStats);
router.get('/transactions/:transactionId', adminTransactionController.getTransactionDetail);
router.put('/transactions/:transactionId/status', adminTransactionController.updateTransactionStatus);

// Update premium prices
router.post('/premium-prices', async (req, res) => {
  try {
    const prices = req.body;
    
    // Store in system config or a dedicated table
    // For now, we'll return success (you can implement actual storage later)
    
    res.json({
      success: true,
      message: 'Đã cập nhật giá Premium thành công',
      data: prices
    });
  } catch (error) {
    console.error('Update premium prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật giá Premium'
    });
  }
});

// System Configuration
router.get('/config', async (req, res) => {
  try {
    const config = await prisma.systemConfig.findFirst();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu hình hệ thống'
    });
  }
});

router.patch('/config', async (req, res) => {
  try {
    const config = await prisma.systemConfig.findFirst();
    
    if (config) {
      const updated = await prisma.systemConfig.update({
        where: { id: config.id },
        data: req.body
      });
      res.json({
        success: true,
        message: 'Đã cập nhật cấu hình hệ thống',
        data: updated
      });
    } else {
      const created = await prisma.systemConfig.create({
        data: req.body
      });
      res.json({
        success: true,
        message: 'Đã tạo cấu hình hệ thống',
        data: created
      });
    }
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cấu hình hệ thống'
    });
  }
});

export default router;
