import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, sellerMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics for seller
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

    // Get analytics data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await prisma.propertyAnalytics.findMany({
      where: {
        sellerId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    });

    // Group by date and aggregate
    const groupedData = analytics.reduce((acc: any[], item) => {
      const dateStr = item.date.toISOString().split('T')[0];
      const existing = acc.find(a => a.date === dateStr);
      
      if (existing) {
        existing.views += item.views;
        existing.clicks += item.clicks;
        existing.inquiries += item.inquiries;
      } else {
        acc.push({
          date: dateStr,
          views: item.views,
          clicks: item.clicks,
          inquiries: item.inquiries
        });
      }
      
      return acc;
    }, []);

    res.json({
      success: true,
      data: groupedData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu phân tích'
    });
  }
});

// Track property view
router.post('/track/view', async (req, res) => {
  try {
    const { propertyId } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { sellerId: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await prisma.propertyAnalytics.upsert({
      where: {
        propertyId_date: {
          propertyId,
          date: new Date()
        }
      },
      update: {
        views: { increment: 1 }
      },
      create: {
        propertyId,
        sellerId: property.sellerId,
        date: new Date(),
        views: 1,
        clicks: 0,
        inquiries: 0
      }
    });

    res.json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking view'
    });
  }
});

export default router;
