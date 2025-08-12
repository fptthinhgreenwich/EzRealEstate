import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djrxwczwo',
  api_key: process.env.CLOUDINARY_API_KEY || '723396958835134',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Aa1c0VBT4c8QsXj19RzCj_G9Vj0'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            inquiries: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin profile'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, address, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        fullName,
        phone,
        // Add address and bio fields to schema if needed
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật profile'
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user?.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi mật khẩu'
    });
  }
});

// Upload avatar
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload buffer to Cloudinary
    const uploadPromise = new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'ezrealestate/avatars',
          public_id: `avatar_${req.user?.id}_${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      ).end(req.file!.buffer);
    });

    const avatarUrl = await uploadPromise;

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh đại diện'
    });
  }
});

// Get user stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        _count: {
          select: {
            properties: true,
            inquiries: true
          }
        },
        badges: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate stats
    let totalViews = 0;
    if (user.role === 'SELLER') {
      const properties = await prisma.property.findMany({
        where: { sellerId: user.id },
        select: { id: true }
      });

      const propertyIds = properties.map(p => p.id);
      
      const analytics = await prisma.propertyAnalytics.aggregate({
        where: { propertyId: { in: propertyIds } },
        _sum: { views: true }
      });

      totalViews = analytics._sum.views || 0;
    }

    res.json({
      success: true,
      data: {
        totalProperties: user._count.properties,
        totalInquiries: user._count.inquiries,
        totalViews,
        memberSince: user.createdAt.toLocaleDateString('vi-VN'),
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
});

// Get user's stats
router.get('/:userId/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;

    // Verify user can access these stats
    if (userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Different stats based on role
    if (user.role === 'BUYER') {
      // Temporarily return mock data until we update the schema
      const savedCount = 0;
      const inquiriesCount = 0;
      const viewedCount = 0;

      // Calculate response rate
      const respondedInquiries = 0;
      const responseRate = 0;

      res.json({
        success: true,
        data: {
          savedCount,
          inquiriesCount,
          viewedCount,
          responseRate
        }
      });
    } else {
      // Seller stats
      const [
        totalProperties,
        activeProperties,
        premiumProperties,
        totalViews,
        totalInquiries
      ] = await Promise.all([
        prisma.property.count({ where: { sellerId: userId } }),
        prisma.property.count({ where: { sellerId: userId, status: 'AVAILABLE' } }),
        prisma.property.count({ where: { sellerId: userId, premiumStatus: 'ACTIVE' } }),
        prisma.propertyAnalytics.aggregate({
          where: { sellerId: userId },
          _sum: { views: true }
        }),
        prisma.inquiry.count({
          where: {
            property: { sellerId: userId }
          }
        })
      ]);

      // Calculate monthly revenue (mock for now)
      const monthlyRevenue = premiumProperties * 500000;

      res.json({
        success: true,
        data: {
          totalProperties,
          activeProperties,
          premiumProperties,
          totalViews: totalViews._sum.views || 0,
          totalInquiries,
          monthlyRevenue
        }
      });
    }
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
});

export default router;
