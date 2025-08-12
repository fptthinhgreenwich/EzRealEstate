import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'

const router = express.Router()
const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for image uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties with filters
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or address
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HOUSE, APARTMENT, LAND, COMMERCIAL]
 *         description: Property type filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, SOLD, PENDING]
 *         description: Property status filter
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: premiumOnly
 *         schema:
 *           type: boolean
 *         description: Show only premium properties
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      type,
      status = 'AVAILABLE',
      minPrice,
      maxPrice,
      premiumOnly,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      status: status as string
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.type = type as string
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice as string)
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
    }

    if (premiumOnly === 'true') {
      where.premiumStatus = 'ACTIVE'
    }

    // Build orderBy
    const orderBy: any = {}
    orderBy[sortBy as string] = sortOrder as string

    // Get properties with pagination
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.property.count({ where })
    ])

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching properties:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách bất động sản'
    })
  }
})

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    })

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bất động sản'
      })
    }

    // Increment view count by updating analytics
    // Create a date without time for comparison (only date part)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      // First try to find existing analytics record
      const existingAnalytics = await prisma.propertyAnalytics.findFirst({
        where: {
          propertyId: id,
          date: today
        }
      })
      
      if (existingAnalytics) {
        // Update existing record
        await prisma.propertyAnalytics.update({
          where: { id: existingAnalytics.id },
          data: {
            views: { increment: 1 }
          }
        })
      } else {
        // Create new record
        await prisma.propertyAnalytics.create({
          data: {
            propertyId: id,
            sellerId: property.sellerId,
            date: today,
            views: 1
          }
        })
      }
    } catch (analyticsError) {
      // Log error but don't fail the request
      console.error('Error updating analytics:', analyticsError)
    }

    res.json({
      success: true,
      data: property
    })
  } catch (error) {
    console.error('Error fetching property:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin bất động sản'
    })
  }
})

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - price
 *               - area
 *               - address
 *               - locationId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [HOUSE, APARTMENT, LAND, COMMERCIAL]
 *               price:
 *                 type: number
 *               area:
 *                 type: number
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               locationId:
 *                 type: string
 *               features:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property created successfully
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      price,
      area,
      bedrooms,
      bathrooms,
      floors,
      yearBuilt,
      street,
      address,
      latitude,
      longitude,
      mapEmbedCode,
      provinceId,
      districtId,
      wardId,
      features
    } = req.body

    const userId = (req as any).user.id

    // Validate required fields
    if (!title || !description || !type || !price || !area || !address || !provinceId || !districtId || !wardId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      })
    }

    // Use placeholder for now - will be replaced when images are uploaded
    const imageUrls = [`https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodeURIComponent(title)}`]

    // Create property
    const property = await prisma.property.create({
      data: {
        title,
        description,
        type,
        status: 'PENDING', // Default to PENDING for review
        price: parseFloat(price),
        area: parseFloat(area),
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        floors: floors ? parseInt(floors) : null,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        provinceId,
        districtId,
        wardId,
        street: street || null,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        mapEmbedCode: mapEmbedCode || null,
        images: JSON.stringify(imageUrls),
        virtualTour: features ? JSON.stringify(features) : null, // Store features in virtualTour field temporarily
        sellerId: userId,
        premiumStatus: 'NONE',
        slug: `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      },
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
    })

    res.status(201).json({
      success: true,
      message: 'Tạo tin đăng thành công. Tin đăng sẽ được duyệt trong 24h.',
      data: property
    })
  } catch (error) {
    console.error('Error creating property:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tin đăng'
    })
  }
})

/**
 * @swagger
 * /api/properties/{id}/upgrade:
 *   post:
 *     summary: Upgrade property to premium
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 description: Premium duration in days
 *                 example: 30
 *     responses:
 *       200:
 *         description: Property upgraded to premium successfully
 */
router.post('/:id/upgrade', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { duration = 30 } = req.body
    const userId = (req as any).user.id

    // Check if property exists and user has permission
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    })

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bất động sản'
      })
    }

    if (existingProperty.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền nâng cấp tin đăng này'
      })
    }

    // Calculate premium expiry date
    const premiumUntil = new Date()
    premiumUntil.setDate(premiumUntil.getDate() + duration)

    // Update property to premium
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        premiumStatus: 'ACTIVE',
        premiumUntil
      }
    })

    // Create payment record (mock)
    await prisma.payment.create({
      data: {
        userId,
        propertyId: id,
        amount: 500000, // 500k VND for 30 days
        currency: 'VND',
        status: 'COMPLETED',
        paymentMethod: 'VNPAY',
        premiumDuration: duration,
        premiumStartDate: new Date(),
        premiumEndDate: premiumUntil,
        metadata: JSON.stringify({
          propertyId: id,
          duration,
          premiumUntil
        })
      }
    })

    res.json({
      success: true,
      message: 'Nâng cấp Premium thành công',
      data: {
        property: updatedProperty,
        premiumUntil
      }
    })
  } catch (error) {
    console.error('Error upgrading property:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nâng cấp Premium'
    })
  }
})

/**
 * @swagger
 * /api/properties/user/my-properties:
 *   get:
 *     summary: Get current user's properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, SOLD, PENDING]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User's properties
 */
router.get('/user/my-properties', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { status, page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = { sellerId: userId }
    if (status) {
      where.status = status as string
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          province: true,
          district: true,
          ward: true,
          seller: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.property.count({ where })
    ])

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching user properties:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải tin đăng của bạn'
    })
  }
})

// Get properties by user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is requesting their own properties or is admin
    if (userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const properties = await prisma.property.findMany({
      where: { sellerId: userId },
      include: {
        province: true,
        district: true,
        ward: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách BĐS'
    });
  }
});

// Get property stats for user
router.get('/user/:userId/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

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

    res.json({
      success: true,
      data: {
        totalProperties,
        activeProperties,
        premiumProperties,
        totalViews: totalViews._sum.views || 0,
        totalInquiries,
        monthlyRevenue: premiumProperties * 500000
      }
    });
  } catch (error) {
    console.error('Get property stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê BĐS'
    });
  }
});

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [HOUSE, APARTMENT, LAND, COMMERCIAL]
 *               price:
 *                 type: number
 *               area:
 *                 type: number
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               floors:
 *                 type: integer
 *               yearBuilt:
 *                 type: integer
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               provinceId:
 *                 type: string
 *               districtId:
 *                 type: string
 *               wardId:
 *                 type: string
 *               street:
 *                 type: string
 *               features:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, PENDING, SOLD, RENTED]
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 *       403:
 *         description: Unauthorized to update this property
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = (req as any).user.id
    const userRole = (req as any).user.role
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    })
    
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bất động sản'
      })
    }
    
    // Check permission - owner or admin can update
    if (existingProperty.sellerId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bất động sản này'
      })
    }
    
    const {
      title,
      description,
      type,
      price,
      area,
      bedrooms,
      bathrooms,
      floors,
      yearBuilt,
      street,
      address,
      latitude,
      longitude,
      mapEmbedCode,
      provinceId,
      districtId,
      wardId,
      features,
      status
    } = req.body
    
    // Build update data object - only include fields that were provided
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (price !== undefined) updateData.price = parseFloat(price)
    if (area !== undefined) updateData.area = parseFloat(area)
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms) : null
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(bathrooms) : null
    if (floors !== undefined) updateData.floors = floors ? parseInt(floors) : null
    if (yearBuilt !== undefined) updateData.yearBuilt = yearBuilt ? parseInt(yearBuilt) : null
    if (street !== undefined) updateData.street = street || null
    if (address !== undefined) updateData.address = address
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null
    if (mapEmbedCode !== undefined) updateData.mapEmbedCode = mapEmbedCode || null
    if (provinceId !== undefined) updateData.provinceId = provinceId
    if (districtId !== undefined) updateData.districtId = districtId
    if (wardId !== undefined) updateData.wardId = wardId
    if (features !== undefined) updateData.virtualTour = features ? JSON.stringify(features) : null
    if (status !== undefined && userRole === 'ADMIN') updateData.status = status // Only admin can change status
    
    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
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
    })
    
    res.json({
      success: true,
      message: 'Cập nhật bất động sản thành công',
      data: updatedProperty
    })
  } catch (error) {
    console.error('Error updating property:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bất động sản'
    })
  }
})

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 *       403:
 *         description: Unauthorized to delete this property
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = (req as any).user.id
    const userRole = (req as any).user.role
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    })
    
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bất động sản'
      })
    }
    
    // Check permission - owner or admin can delete
    if (existingProperty.sellerId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bất động sản này'
      })
    }
    
    // Delete related records first
    await prisma.inquiry.deleteMany({
      where: { propertyId: id }
    })
    
    await prisma.propertyAnalytics.deleteMany({
      where: { propertyId: id }
    })
    
    await prisma.payment.deleteMany({
      where: { propertyId: id }
    })
    
    // Delete the property
    await prisma.property.delete({
      where: { id }
    })
    
    res.json({
      success: true,
      message: 'Xóa bất động sản thành công'
    })
  } catch (error) {
    console.error('Error deleting property:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bất động sản'
    })
  }
})

// Upload property images
router.post('/:id/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check property ownership
    const property = await prisma.property.findUnique({
      where: { id },
      select: { sellerId: true, images: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bất động sản'
      });
    }

    if (property.sellerId !== userId && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền upload ảnh cho BĐS này'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có ảnh nào được upload'
      });
    }

    // Upload images to Cloudinary
    const uploadPromises = (req.files as Express.Multer.File[]).map((file, index) => {
      return new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `ezrealestate/properties/${id}`,
            public_id: `property_${id}_${Date.now()}_${index}`,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        ).end(file.buffer);
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Get existing images
    let existingImages: string[] = [];
    try {
      existingImages = property.images ? JSON.parse(property.images) : [];
      // Filter out placeholder images
      existingImages = existingImages.filter(url => !url.includes('placeholder'));
    } catch (e) {
      existingImages = [];
    }

    // Combine with new images
    const allImages = [...existingImages, ...uploadedUrls];

    // Update property with new images
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { images: JSON.stringify(allImages) },
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

    res.json({
      success: true,
      message: `Upload thành công ${uploadedUrls.length} ảnh`,
      data: {
        ...updatedProperty,
        images: allImages
      }
    });
  } catch (error) {
    console.error('Upload property images error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh BĐS'
    });
  }
});

export default router
