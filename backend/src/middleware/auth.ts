import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JwtPayload {
  id: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        fullName: string
      }
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    fullName: string
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      })
    }
    
    // Optional: Check if user is verified (can be disabled for development)
    if (user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản chưa được xác thực'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    })
  }
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền truy cập'
    })
  }
  next()
}

export const sellerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ seller hoặc admin mới có quyền truy cập'
    })
  }
  next()
}
