import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, sellerMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get inquiries for seller
router.get('/seller/:sellerId', authMiddleware, async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    
    // Check authorization
    if (sellerId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        property: {
          sellerId: sellerId
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu cầu'
    });
  }
});

// Create new inquiry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { propertyId, message, phone, email } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        buyerId: req.user!.id,
        message,
        phone: phone || '',
        email: email || req.user?.email || ''
      }
    });

    res.status(201).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi yêu cầu liên hệ'
    });
  }
});

// Update inquiry status
router.patch('/:id/status', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verify ownership
    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id,
        property: {
          sellerId: req.user?.id
        }
      }
    });

    if (!inquiry && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái'
    });
  }
});

export default router;