import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await prisma.province.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tỉnh/thành phố'
    });
  }
});

// Get districts by province
router.get('/provinces/:provinceId/districts', async (req, res) => {
  try {
    const { provinceId } = req.params;
    
    const districts = await prisma.district.findMany({
      where: { provinceId },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách quận/huyện'
    });
  }
});

// Get wards by district
router.get('/districts/:districtId/wards', async (req, res) => {
  try {
    const { districtId } = req.params;
    
    const wards = await prisma.ward.findMany({
      where: { districtId },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: wards
    });
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phường/xã'
    });
  }
});

// Get location hierarchy (province -> district -> ward)
router.get('/hierarchy', async (req, res) => {
  try {
    const provinces = await prisma.province.findMany({
      include: {
        districts: {
          include: {
            wards: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Get location hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu trúc địa điểm'
    });
  }
});

export default router;